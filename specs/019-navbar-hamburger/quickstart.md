# Quickstart: validating feature 019

## Prerequisites

- `npm run dev` at the repo root, which serves the SSR app, and `cd ui && npm run dev` if you also use the Vite dev server.
- A signed-in account with any role, and the logged-out state.
- DevTools device toolbar set to responsive. Check the widths **390, 768, 1024, 1100, 1280 and 1440px**, in light and dark themes and in EN and DE.

## 1. Dashboard: one button (US1)

1. At 390px, open `/dashboard`. Exactly one menu button exists: the navbar hamburger. There is no ☰ in the content and no × in the sidebar. The avatar is visible in the bar.
2. Tap the hamburger. The sidebar slides in **below** the navbar and the icon becomes an X. Tap it again and the sidebar closes.
3. Open the sidebar and choose a section. The section loads and the sidebar closes.
4. Open the sidebar, navigate to `/`, then return to `/dashboard`. The sidebar is closed.
5. Repeat steps 1–3 at 768px and 1024px.
6. At 1100px and 1440px, the sidebar is always visible, there is no hamburger, and there is no compact mode (the dashboard has no links).
7. With the sidebar open at 390px, resize to 1200px. The sidebar shows in-flow with no overlay leftovers. Resize back to 390px and the sidebar is closed. With the File Management upload overlay showing, the sidebar opens above it.

See [contracts/navbar-ui.md](./contracts/navbar-ui.md).

## 2. Landing compact mode (US2)

1. At 1440px on `/` in EN, the links are inline and there is no hamburger.
2. Narrow the window slowly from 1440px to 1025px, in EN and then DE. The moment the links would clip or touch the logo or `.nav-right`, the links disappear and the hamburger appears. No overlap is visible at any width.
3. Hover around that width and drag ±10px. The bar switches at most once in each direction (no flicker).
4. While compact, open the menu and widen the window until the links fit. The menu closes and the links return.
5. In the menu, choose a section button on `/`: the page scrolls smoothly and the menu closes. From `/blog`, choose a section: the app goes to `/` and scrolls. Choose a link: it navigates and the menu closes.
6. Hard-reload at 1440px and at 900px with JavaScript throttled. There is no flash of an open menu, and the server-rendered layout at 900px already shows the hamburger.

## 3. Keyboard and outside click (US3)

1. Tab to the hamburger. The screen reader or accessibility tree reports a "button", "collapsed", and a label. Press Enter: it is "expanded" and focus moves to the first menu link (landing) or sidebar item (dashboard).
2. Press Escape. The panel closes and focus is back on the hamburger.
3. Open each panel and click elsewhere on the page. It closes. Clicking inside the panel doesn't close it, except when a link or item is chosen.

## 4. Regression checks

- Theme toggle, webmail icon (for allow-listed users), Sign-in and avatar navigation all still work.
- `cd ui && npm run build` succeeds, and SSR renders `/` and `/dashboard` without hydration warnings in the console.
