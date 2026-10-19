# Contract: StudioNewsletterEditor (UI component)

The feature's only external interface is a **React component contract** inside `ui/`. There are no
new HTTP endpoints. This document specifies the wrapper component `StudioNewsletterEditor`, the
Studio SDK options it configures, and the behavioral guarantees that satisfy the functional
requirements.

## Component: `StudioNewsletterEditor`

Location: `ui/src/Components/StudioEditor/StudioNewsletterEditor.tsx`
Loaded by `Newsletter.tsx` via `React.lazy` + `Suspense` (client-only, like `QuillEditor`).

### Props

```ts
interface StudioNewsletterEditorProps {
  value: string;                      // article HTML to load
  onChange: (html: string) => void;   // receives exported email HTML; "" when empty
}
```

- Drop-in for the newsletter's current `<QuillEditor value onChange />` usage.
- MUST NOT require an `onImageUpload` prop (images are handled internally as base64).

### Behavioral guarantees (map to FRs)

| # | Guarantee | FR |
| - | --------- | -- |
| C1 | Renders the Studio SDK `StudioEditor`; Quill is not rendered in the newsletter view. | FR-001, FR-009 |
| C2 | On open, loads `value` into the editor (legacy Quill HTML included) and, on change/autosave, calls `onChange` with exported email HTML. Empty content yields `""`. | FR-002 |
| C3 | Inserting an image encodes it to a `data:*;base64,*` URL with `FileReader`; **no asset-upload request** is issued. | FR-003 |
| C4 | The editor host fills the full screen width with an explicit height; no horizontal page scroll. | FR-004 |
| C5 | Imported only via `React.lazy`; never evaluated during SSR (no `window` access at module top level). | FR-005 |
| C6 | Imports `@grapesjs/studio-sdk/style` so the editor renders correctly. | FR-006 |
| C7 | Exports email-ready HTML (inline styles) suitable for email clients. | FR-007 |
| C8 | `licenseKey` read from `import.meta.env.VITE_GRAPESJS_LICENSE_KEY`, default `DEMO_LOCALHOST_KEY`; never other-hard-coded. | FR-008 |

## Studio SDK `options` contract

The wrapper renders `<StudioEditor options={...} />` with the shape below (derived from the
stakeholder's config, reconciled with FR-003 base64 and the HTML-string content model).

```ts
options = {
  licenseKey: import.meta.env.VITE_GRAPESJS_LICENSE_KEY ?? 'DEMO_LOCALHOST_KEY',

  project: { type: 'web' },   // email/MJML type reverted — crashed on plain/legacy HTML

  assets: {
    storageType: 'self',
    // base64, NO network — satisfies FR-003
    onUpload: async ({ files }) => {
      const toDataUrl = (file) => new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve({ src: r.result, name: file.name, mimeType: file.type, size: file.size });
        r.readAsDataURL(file);
      });
      return Promise.all([...files].map(toDataUrl));   // → [{ src: 'data:...;base64,...' }, ...]
    },
    onDelete: async () => { /* no-op: nothing stored server-side */ },
  },

  storage: {
    type: 'self',
    // seed from the article HTML (value) — legacy Quill HTML loads as the email body
    onLoad: async () => ({ project: /* email project whose page body is `value` */ }),
    // export email HTML and push it up via onChange — no server call
    onSave: async () => { onChange(/* exported inlined email HTML, or "" when empty */); },
    autosaveChanges: 100,
    autosaveIntervalMs: 10000,
  },
};
```

### Divergences from the pasted template (intentional)

| Template field | Pasted value | This feature | Why |
| -------------- | ------------ | ------------ | --- |
| `assets.onUpload` | `fetch('ASSETS_UPLOAD_URL', …)` | base64 via `FileReader`, no fetch | FR-003: no upload endpoint |
| `assets.onDelete` | `fetch('ASSETS_DELETE_URL', …)` | no-op | nothing stored server-side |
| `storage.onSave` | throws / `fetch('PROJECT_SAVE_URL')` | export HTML → `onChange` | keep HTML-string model, no backend |
| `storage.onLoad` | throws / `fetch('PROJECT_LOAD_URL')` | build project from `value` | seed from existing `form.html` |
| `project.type` | `'email'` | `'web'` | email/MJML type reverted — it crashed (`Parsing failed. Check your mjml.`) on plain/legacy HTML; web type round-trips plain HTML (FR-007) |
| autosave fields | `100` / `10000` | `100` / `10000` | adopted as-is |
| `licenseKey` | `'DEMO_LOCALHOST_KEY'` | env var, default `DEMO_LOCALHOST_KEY` | FR-008: not hard-coded |

> The exact export API (`editor.runCommand('gjs-get-inlined-html')` vs an email/MJML compile call)
> is confirmed against the installed SDK's `dist/index.d.ts` during implementation; the contract is
> "`onChange` receives email-ready HTML."
