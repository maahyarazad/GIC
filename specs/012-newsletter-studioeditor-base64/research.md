# Phase 0 Research: Newsletter StudioEditor with base64 images

Decisions resolving the Technical Context. Format: **Decision / Rationale / Alternatives considered**.
Sources consulted: Studio SDK README (jsdelivr `@grapesjs/studio-sdk@1.1.1`), the Studio SDK asset
docs (`app.grapesjs.com/docs-sdk/configuration/assets/overview`), and the "converting to Grapes"
blog (`grapesjs.com/blog/converting-to-grapes`).

## 0. Premise correction (Quill, not GrapesJS)

- **Finding**: The newsletter currently uses **Quill** via `ui/src/Components/QuillEditor/QuillEditor.tsx`, loaded in `Newsletter.tsx` as `const QuillEditor = lazy(() => import(...))` and used as `<QuillEditor value={form.html} onChange={...} />`. There is no GrapesJS in the repo or git history.
- **Decision**: Treat "replace GrapesJS" as "replace the current Quill editor." Build a Studio SDK wrapper exposing the same `{ value, onChange }` contract so `Newsletter.tsx` changes minimally.

## 1. Studio SDK React integration

- **Decision**: `import StudioEditor from '@grapesjs/studio-sdk/react'` and `import '@grapesjs/studio-sdk/style'`; render `<StudioEditor options={{ licenseKey, project: { type: 'web', default: { pages: [...] } } }} onReady={(editor) => ...} />`. Wrap it in a new `StudioNewsletterEditor` component, lazy-loaded with `Suspense` (client-only) exactly as `QuillEditor` is today.
- **Rationale**: README confirms these imports and the `options`/`licenseKey`/`project` shape. Lazy + `Suspense` keeps the heavy, `window`-dependent editor out of SSR, matching the existing pattern.
- **Alternatives considered**: Vanilla `createStudioEditor` into a ref'd div — more wiring than the official React component; the `/react` entry exists for exactly this.

## 2. Loading existing HTML and exporting HTML (RESOLVED — HTML string model)

- **Decision**: Keep the **single HTML string** content model (`form.html`) — confirmed by stakeholder. The Studio SDK is configured with `storage.type: 'self'`:
  - **`onLoad`** returns a project object seeded from the current `form.html` (a single email page whose body is that HTML), so legacy Quill-authored articles open for editing.
  - **`onSave`** (fired by autosave) exports email-ready HTML from the editor and passes it up via the wrapper's `onChange`, which updates `form.html`. No project JSON is persisted; no DB schema change; the send/preview flow is unchanged.
  - Autosave config from the stakeholder: `autosaveChanges: 100`, `autosaveIntervalMs: 10000`.
- **HTML export**: for the `email` project type, export the compiled/inlined HTML the recipient will see (email clients need inline styles). Confirm the exact export call against the installed version's `dist/index.d.ts` at implementation time (`editor.runCommand('gjs-get-inlined-html')` is the documented approach; email/MJML projects also expose an MJML→HTML compile). This is an implementation detail, non-blocking for design.
- **Rationale**: The existing pipeline stores one HTML string in `form.html`, consumed by save, the send endpoint, and the `dangerouslySetInnerHTML` preview. HTML in / HTML out means no backend change.
- **Alternatives considered**: Store Studio project JSON instead of HTML — rejected by stakeholder (would require schema + send-pipeline changes, out of scope).

## 3. Images as base64 (no upload) (RESOLVED — base64 wins)

- **Decision**: Use `assets: { storageType: 'self', onUpload, onDelete }` (the stakeholder's config shape) but make the handlers **offline/base64**, confirmed by stakeholder (base64 wins over the pasted template's upload URL):
  - **`onUpload`** encodes each file to a base64 data URL with `FileReader.readAsDataURL` and returns `[{ src: <dataUrl>, name, mimeType, size }]` — **no `fetch`, no network call**.
  - **`onDelete`** is a no-op (nothing is stored server-side; removing an image just drops the inline data URL from the HTML).
- **Rationale**: FR-003 requires images embedded as base64 with no asset-upload endpoint. The asset docs confirm that with no storage "assets will be added as data urls," and `onUpload` must "return an array with the uploaded assets," each needing at least `src`. A `FileReader`-based handler is deterministic and offline.
- **Caveat (email type)**: many email clients block or strip base64-inlined images; this is the stakeholder's explicit choice and is captured as an edge case, not a blocker.
- **Alternatives considered**: `onUpload` posting to an endpoint (the pasted template / blog example) — rejected by stakeholder, contradicts FR-003.

## 4. Full-width UI

- **Decision**: While the newsletter editor is open, break the editing area out of the constrained dashboard column to full viewport width (e.g. a full-width container / `100%`-width editor host with a tall fixed height), and give the `StudioEditor` container an explicit height (the SDK needs a sized parent). Keep the list view as-is.
- **Rationale**: The visual builder needs space; the request is explicit. GrapesJS/Studio requires its container to have a defined height or it collapses.
- **Alternatives considered**: Leaving it in the narrow column — fails the requirement and cramps the builder.

## 5. Project type: email (RESOLVED — email type)

- **Decision**: Use `project: { type: 'email' }` — confirmed by stakeholder. The email project type gives email-oriented blocks and email-safe output. The content model stays a single HTML string (decision 2): `onLoad` seeds an email page from `form.html`, `onSave` exports HTML back into `form.html`.
- **Rationale**: Resolves FR-007 explicitly. Email type produces output better suited to email clients than the generic web type, while the self-storage handlers keep the existing HTML-string pipeline intact (no schema change).
- **Note**: The email type's internal model is MJML-like; we never persist that model — only the exported HTML — so the send/preview pipeline is unchanged. Legacy Quill HTML is loaded as the email page body.

## 6. License key

- **Decision**: Supply `licenseKey` from `import.meta.env.VITE_GRAPESJS_LICENSE_KEY`, defaulting to `DEMO_LOCALHOST_KEY` (the value from the stakeholder's config) when the env var is unset. `DEMO_LOCALHOST_KEY` / any value works on localhost.
- **Open**: FR-008 — a valid license key/plan is required for production (non-localhost) domains. Needs a real key from the stakeholder before production deploy. Non-blocking for local development.

## 7. Dependency / SSR notes

- **Decision**: Add `@grapesjs/studio-sdk` (and its `grapesjs` peer if required by install) to `ui/package.json`. Add `VITE_GRAPESJS_LICENSE_KEY` to the client env. Ensure the wrapper is only imported via `React.lazy` so Vite keeps it out of the SSR/entry bundle.
- **Rationale**: Matches the repo's existing lazy-editor pattern and avoids `window is not defined` during SSR.
- **Alternatives considered**: Importing StudioEditor statically in `Newsletter.tsx` — risks SSR crash and bloats the main bundle; rejected.

## 8. QuillEditor retention (NEW finding)

- **Finding**: `QuillEditor` is imported by **both** `Newsletter.tsx` and `Blog.tsx` (`ui/src/Components/Dashboard/Blog/Blog.tsx`).
- **Decision**: Remove `QuillEditor` **only from the newsletter view**; keep the `ui/src/Components/QuillEditor/*` component and the `quill` dependency because `Blog.tsx` still uses it. FR-009's "delete if unused elsewhere" clause does **not** apply.

## Open questions (non-blocking for design)

- Confirm the exact content-export API for the installed SDK version (decision 2) — verify against `dist/index.d.ts` during implementation.
- Obtain a production license key (decision 6, FR-008) — before production deploy only.
