# Server-Side Rendering (SSR) Architecture

This document explains how SSR is structured in the GIC project — how the server renders React to HTML, injects state, and how the client then hydrates that markup.

---

## Overview

The project uses a **Vite-powered React SSR** setup served by an **Express** backend. The same React codebase has two entry points: one for the server (renders to string) and one for the client (hydrates the existing DOM). Redux state is serialized on the server and rehydrated on the client to avoid a second data fetch.

---

## Project Layout

```
GIC/
├── src/               # Express backend (TypeScript)
│   └── server.ts      # Main SSR server — handles both dev and production
├── ui/
│   ├── index.html     # HTML template with SSR injection placeholders
│   ├── vite.config.ts # Vite config for client and SSR builds
│   └── src/
│       ├── entry-server.jsx   # Server entry — renderToString
│       ├── entry-client.jsx   # Client entry — hydrateRoot
│       ├── App.jsx            # Route definitions
│       └── store.ts           # Redux store factory
└── ui/dist/
    ├── client/        # Browser-facing JS, CSS, and assets
    └── server/        # SSR bundle (entry-server.js)
```

---

## Entry Points

### `ui/src/entry-server.jsx` — Server Render

Called by the Express server on every request. It:

1. Creates a Redux store with a preloaded state (auth + app data).
2. Wraps the app in `StaticRouter` (URL-aware, no browser APIs).
3. Calls `renderToString()` and returns `{ appHtml, preloadedState }`.

```jsx
export async function render(url, env, client) {
  const preloadedState = { auth: {...}, app: { siteData: client, env } }
  const store = createAppStore(preloadedState)
  const appHtml = renderToString(
    <EnvContext.Provider value={env}>
      <StaticRouter location={url}>
        <Provider store={store}>
          <App />
        </Provider>
      </StaticRouter>
    </EnvContext.Provider>
  )
  return { appHtml, preloadedState: store.getState() }
}
```

### `ui/src/entry-client.jsx` — Client Hydration

Runs in the browser after the HTML is received. It:

1. Reads `window.__PRELOADED_STATE__` injected by the server.
2. Creates a Redux store with that exact state (no extra request needed).
3. Calls `hydrateRoot()` instead of `createRoot()` so React attaches to existing DOM.

```jsx
const preloadedState = window.__PRELOADED_STATE__
const store = createAppStore(preloadedState)

hydrateRoot(
  document.getElementById('root'),
  <BrowserRouter>
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>
)
```

---

## HTML Template (`ui/index.html`)

The template has four injection points that the server fills in per request:

```html
<head>
  <!--app-head-->        <!-- reserved for head tags (meta, links) -->
  <!--env-->             <!-- window.__ENV__ script injected here -->
</head>
<body>
  <div id="root"><!--app-html--></div>   <!-- rendered React HTML -->
  <!--preloaded-state-->                  <!-- window.__PRELOADED_STATE__ -->
  <script type="module" src="/src/entry-client.jsx"></script>
</body>
```

---

## Server (`src/server.ts`) — Request Lifecycle

For every `GET *` request that isn't an API route or static asset:

```
1. Read ui/index.html
2. Inject window.__ENV__ at <!--env-->
3. Load client data from /file_storage/client_blueprint.json
4. Call render(url, envVars, clientData)  →  { appHtml, preloadedState }
5. Replace <!--app-html--> with appHtml
6. Replace <!--preloaded-state--> with <script>window.__PRELOADED_STATE__ = {...}</script>
7. Send the complete HTML document
```

### Development mode

Vite is started in `middlewareMode` and embedded directly into Express:

```ts
const vite = await createViteServer({ server: { middlewareMode: true }, ... })
app.use(vite.middlewares)
// template transformed by Vite on every request (HMR-aware)
// entry-server.jsx loaded via vite.ssrLoadModule()
```

### Production mode

Pre-built bundles are used. Express serves static files from `ui/dist/client/` and loads the compiled SSR bundle:

```ts
const { render } = await import('../ui/dist/server/entry-server.js')
app.use(express.static('ui/dist/client'))
```

---

## State Management and Hydration

The Redux store uses a factory pattern so the server can seed it with data:

```ts
// store.ts
export function createAppStore(preloadedState?) {
  return configureStore({ reducer: { auth, app, cart, products }, preloadedState })
}
```

**Server** → builds `preloadedState` from `client_blueprint.json` and env vars, renders, then serializes the final store state into the HTML.

**Client** → reads `window.__PRELOADED_STATE__`, creates a store with the same state, and hydrates — React produces an identical DOM tree so no re-render occurs.

---

## Routing

| Context | Router | Behavior |
|---------|--------|----------|
| Server | `StaticRouter` | Stateless, uses `location={url}` from the request |
| Client | `BrowserRouter` | Takes over after hydration, uses the History API |

Routes are defined once in `App.jsx` and work in both contexts. The Express catch-all `app.get("*", ...)` ensures every path is handled by SSR.

---

## Build Pipeline

```
# Build the client bundle (JS/CSS/assets for the browser)
npm run build:client   →  ui/dist/client/

# Build the SSR bundle (Node-compatible, no DOM)
npm run build:ssr      →  ui/dist/server/entry-server.js

# Compile the Express backend
npm run build          →  dist/
```

**`vite.config.ts`** key settings:

```ts
{
  plugins: [react()],
  resolve: { alias: { '@': '/ui/src' } },
  ssr: { noExternal: ['react-router-dom'] }
}
```

`noExternal: ['react-router-dom']` bundles the router into the SSR output so it is available in the Node process without requiring a separate install.

---

## Full Request-to-Interaction Flow

```
Browser Request
      │
      ▼
Express server.ts (port 5612)
      │
      ├─ Dev:  vite.ssrLoadModule('entry-server.jsx')
      └─ Prod: import('ui/dist/server/entry-server.js')
      │
      ▼
render(url, env, clientData)
      │  creates Redux store
      │  wraps App in StaticRouter
      │  calls renderToString()
      │
      ▼
Inject into index.html template
      │  <!--app-html-->        → rendered markup
      │  <!--preloaded-state--> → window.__PRELOADED_STATE__
      │  <!--env-->             → window.__ENV__
      │
      ▼
Complete HTML sent to browser
      │
      ▼
Browser parses HTML — page is immediately visible (no JS needed)
      │
      ▼
entry-client.jsx runs
      │  reads window.__PRELOADED_STATE__
      │  creates matching Redux store
      │  calls hydrateRoot()
      │
      ▼
React attaches event listeners to existing DOM (no re-render)
      │
      ▼
BrowserRouter takes over — full SPA navigation from here
```

---

## Key Files Reference

| File | Role |
|------|------|
| `src/server.ts` | Express server, SSR handler, dev/prod switching |
| `ui/index.html` | HTML template with `<!--app-html-->` and other injection points |
| `ui/src/entry-server.jsx` | `render()` — server-side React to string |
| `ui/src/entry-client.jsx` | `hydrateRoot()` — client-side attach |
| `ui/src/App.jsx` | Shared route definitions |
| `ui/src/store.ts` | `createAppStore(preloadedState)` factory |
| `ui/src/EnvContext.jsx` | Provides `window.__ENV__` to the React tree |
| `ui/vite.config.ts` | Build config for client and SSR bundles |
| `ui/package.json` | `build:client` and `build:ssr` scripts |
