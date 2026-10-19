# Quickstart: Newsletter StudioEditor with base64 images, full-width

A runnable validation guide proving the feature works end-to-end. Details live in
[data-model.md](./data-model.md) and [contracts/editor-contract.md](./contracts/editor-contract.md).

## Prerequisites

- Repo checked out on branch `012-newsletter-studioeditor-base64`.
- Node + the project's package manager installed; able to run the `ui/` dev server.
- Logged in as a role with Newsletter access (admin/procurement).
- `@grapesjs/studio-sdk` installed in `ui/` (added by this feature).

## Setup

```bash
# from repo root
cd ui
# install deps (adds @grapesjs/studio-sdk, keeps quill for Blog)
npm install
# optional: set a license key (defaults to DEMO_LOCALHOST_KEY on localhost)
echo 'VITE_GRAPESJS_LICENSE_KEY=DEMO_LOCALHOST_KEY' >> .env.local
# run the dashboard
npm run dev
```

Then open the dashboard and navigate to **Newsletter → New Article** (or edit an existing one).

## Validation scenarios

### 1. Editor swap (US1 / FR-001, FR-006, FR-009)
- Open the Newsletter compose/edit view.
- **Expect:** the Studio SDK email editor renders with its styles; the old Quill toolbar is gone.
- Confirm `Blog → New Post` still shows the Quill editor (QuillEditor retained for Blog).

### 2. Load + round-trip existing HTML (US1 / FR-002)
- Open an existing article that has HTML (including a legacy Quill-authored one).
- **Expect:** its current HTML loads as the email body.
- Make an edit, wait for autosave (≤10s or 100 changes), then submit.
- **Expect:** the saved article `html` reflects the edit and renders in the existing preview;
  the send flow is unchanged.

### 3. Base64 images, no upload (US2 / FR-003)
- Open browser DevTools → Network tab, filter XHR/Fetch.
- In the editor, insert an image from your device.
- **Expect:** the image appears in the canvas; **no** request to any asset-upload endpoint fires.
- Submit, reopen the article.
- **Expect:** the saved `html` contains a `src="data:image/...;base64,..."` and the image still
  renders (no broken server link).

### 4. Full-width UI (US3 / FR-004)
- With the editor open, observe the layout.
- **Expect:** the editor spans the full screen width with an explicit height; no horizontal page
  scroll. Narrow the window — the dashboard stays usable, still no horizontal page scroll.

### 5. SSR / initial load unaffected (FR-005)
- Hard-reload the dashboard (and, if applicable, confirm the SSR response has no editor markup and
  no `window is not defined` error in server logs).
- **Expect:** the page loads normally; the editor mounts client-side after hydration (lazy + Suspense).

## Done when

- All five scenarios pass.
- `npm run build` (or the project's typecheck/build) succeeds — feature files typecheck.
- No asset-upload network request occurs during image insertion.
