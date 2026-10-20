# Phase 1 Data Model: Newsletter StudioEditor with base64 images

This feature is **frontend-only** and introduces **no new persisted entities** and **no schema
changes**. The data model below documents the existing entity whose content now originates from the
Studio SDK, plus the in-memory shapes the editor wrapper exchanges with its host.

## Persisted entity (unchanged)

### Newsletter Article

The existing article document, stored via the `/newsletter-articles` API in MongoDB. Its schema is
**unchanged**; only the provenance of the `html` field changes.

| Field       | Type            | Notes                                                                                     |
| ----------- | --------------- | ----------------------------------------------------------------------------------------- |
| `title`     | string          | Unchanged.                                                                                |
| `subject`   | string          | Unchanged.                                                                                |
| `html`      | string          | Now holds **Studio-SDK-exported email HTML**, which may contain `data:image/*;base64,...` image `src`es. Previously held Quill HTML. |
| `createdAt` | Date            | Unchanged (server-managed).                                                               |
| `updatedAt` | Date            | Unchanged (server-managed).                                                               |

**Validation / rules**
- `html` is still a single string consumed as-is by save, the send endpoint, and the
  `dangerouslySetInnerHTML` preview — no new validation.
- Legacy articles authored in Quill must still load (their HTML becomes the page body).
- The empty-content sentinel `"<p><br></p>"` (used by the current submit guard) is treated as empty;
  the Studio wrapper emits `""` for empty content so the guard keeps working.
- `html` payload must stay within the server's 25 MB `express.json` limit even with base64 images.

> **Not persisted:** the Studio SDK "project" JSON (the editor's internal email/MJML model) is
> **never** saved. Only exported HTML round-trips. This keeps the content model a single HTML string.

## In-memory shapes (editor ↔ host contract)

These are runtime shapes, not stored documents. See [contracts/editor-contract.md](./contracts/editor-contract.md)
for the full wrapper contract.

### `StudioNewsletterEditor` props (host-facing)

| Prop       | Type                       | Notes                                                            |
| ---------- | -------------------------- | ---------------------------------------------------------------- |
| `value`    | `string`                   | Current article HTML to load (seeds the editor via `onLoad`).    |
| `onChange` | `(html: string) => void`   | Called with exported HTML on each autosave/change; empty → `""`. |

> Same `{ value, onChange }` contract `Newsletter.tsx` already uses for `QuillEditor`, so the host
> component barely changes. (The old `onImageUpload` prop is **not** needed — images are base64 via
> the SDK asset handler.)

### Studio SDK asset object (returned by `onUpload`)

| Field      | Type     | Notes                                               |
| ---------- | -------- | --------------------------------------------------- |
| `src`      | string   | **Required.** `data:<mimeType>;base64,<...>` URL.   |
| `name`     | string   | Original file name (optional, for the asset panel). |
| `mimeType` | string   | e.g. `image/png` (optional).                        |
| `size`     | number   | Byte length (optional).                             |

`onUpload({ files })` returns `Array<asset>`; **no network request** is made. `onDelete({ assets })`
is a no-op.

### Studio SDK storage project (self storage)

| Hook                  | Direction | Behavior                                                                               |
| --------------------- | --------- | -------------------------------------------------------------------------------------- |
| `onLoad()`            | in        | Returns `{ project }` built from `value` (one page whose body is the article HTML). |
| `onSave({ project })` | out       | Exports email HTML from the editor and calls host `onChange(html)`; nothing sent to a server. |

Autosave config: `autosaveChanges: 100`, `autosaveIntervalMs: 10000`.

## State transitions

```text
open article (value=html) ──onLoad──▶ editor shows page (legacy Quill HTML or prior export)
        │
   user edits / inserts image (FileReader→base64 data URL, no upload)
        │
   autosave (every 100 changes or 10s) ──onSave──▶ export HTML ──onChange──▶ form.html updated
        │
   user submits form ──▶ existing /newsletter-articles save (html string, unchanged pipeline)
```
