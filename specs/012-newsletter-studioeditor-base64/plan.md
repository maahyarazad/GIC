# Implementation Plan: Newsletter StudioEditor with base64 images, full-width

**Branch**: `012-newsletter-studioeditor-base64` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-newsletter-studioeditor-base64/spec.md`

## Summary

Replace the newsletter's Quill editor with the GrapesJS Studio SDK React component
(`StudioEditor` from `@grapesjs/studio-sdk/react` + its stylesheet), using the **email project
type** (`project: { type: 'web' }` — email/MJML type was reverted; it crashed with `Parsing failed. Check your mjml.` on plain/legacy HTML). Configure images to embed as **base64 data URLs** via a
self-handled `onUpload` (no upload endpoint; `onDelete` is a no-op), and use `storage: { type:
'self' }` with autosave (`autosaveChanges: 100`, `autosaveIntervalMs: 10000`) whose `onLoad` seeds
the editor from the existing article `html` and whose `onSave` exports HTML back into that `html`
field — **no DB schema change**. Widen the newsletter editing UI to **full screen width**.
Frontend-only; the editor is loaded client-side (lazy + `Suspense`) so SSR is unaffected. The
`licenseKey` comes from `VITE_GRAPESJS_LICENSE_KEY`, defaulting to `DEMO_LOCALHOST_KEY`.

## Technical Context

**Language/Version**: TypeScript React (Vite SSR client).

**Primary Dependencies**: NEW `@grapesjs/studio-sdk` (+ `grapesjs` peer). Existing: React, Vite, axios, Bootstrap. REMOVED (from newsletter): `quill` usage via `QuillEditor`.

**Storage**: Unchanged. Article `html` string in Mongo via the existing `/newsletter-articles` API; now may contain base64 image data URLs (larger payloads; within the 25 MB `express.json` limit).

**Testing**: Manual QA via quickstart (no wired UI test runner); feature files must typecheck.

**Target Platform**: Web dashboard (admin/procurement).

**Project Type**: Web application; change is confined to `ui/`.

**Performance Goals**: Editor loads lazily (not in the SSR/initial bundle). Base64 images make HTML heavier — acceptable per the explicit requirement.

**Constraints**: Must be client-only (Studio SDK touches `window`/DOM) — load with `React.lazy` + `Suspense` like the current `QuillEditor`, and guard against SSR. License key via `import.meta.env.VITE_GRAPESJS_LICENSE_KEY` (default `DEMO_LOCALHOST_KEY`), not hard-coded. Import the SDK stylesheet (`@grapesjs/studio-sdk/style`); no `sass`. Content model stays a single HTML string — no project JSON persisted, no backend change.

**Scale/Scope**: One editor component swapped in `Newsletter.tsx`, a new `StudioNewsletterEditor` wrapper component, a dependency added, and CSS for full-width. `QuillEditor` is removed from the **newsletter only** — it is **kept** because `Blog.tsx` still uses it (so the `quill` dependency and `ui/src/Components/QuillEditor/*` stay).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is an unfilled template — no ratified gates. Proceeding under
observed conventions: client-only heavy components are lazy-loaded with `Suspense` (as `QuillEditor`
is); editors expose `value`/`onChange`; styles imported as CSS. **Result: PASS.** Re-checked after
Phase 1 — still PASS.

## Project Structure

### Documentation (this feature)

```text
specs/012-newsletter-studioeditor-base64/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── editor-contract.md
└── tasks.md            # created by /speckit-tasks (not here)
```

### Source Code (repository root)

```text
ui/
├── package.json                                         # ADD @grapesjs/studio-sdk (+ grapesjs)
└── src/
    └── Components/
        ├── Dashboard/Newsletter/
        │   ├── Newsletter.tsx                           # swap QuillEditor → StudioNewsletterEditor
        │   └── Newsletter.css                           # full-width editing layout
        └── StudioEditor/
            ├── StudioNewsletterEditor.tsx               # NEW: client-only StudioEditor wrapper (email type, value/onChange, base64 assets, self storage + autosave)
            └── StudioNewsletterEditor.css               # NEW: full-width editor container
# KEEP ui/src/Components/QuillEditor/* (still used by Blog.tsx); only stop importing it in Newsletter.tsx
```

**Structure Decision**: Frontend-only. A new `StudioNewsletterEditor` wrapper adapts the Studio SDK
`StudioEditor` to the same `{ value, onChange }` contract `Newsletter.tsx` already expects from
`QuillEditor`, so the host component barely changes. The wrapper is lazy-loaded (client-only) and
owns the base64 asset config and the HTML import/export. Full-width styling lives with the newsletter
section and the editor container.

## Complexity Tracking

> No constitution violations to justify (no gates defined). Table intentionally omitted.
