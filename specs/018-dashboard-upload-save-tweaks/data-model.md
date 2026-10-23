# Data Model: Dashboard Upload & Save Improvements

No database schema changes. The existing `uploaded_files`, `presentations` and `newsletter-articles` documents are used as they are. The only new state is client-side state for the upload batch.

## Persisted (unchanged)

| Entity | Collection | Notes for this feature |
|---|---|---|
| Uploaded File | `uploaded_files` | `{ filename, mimetype, extension, path, size, createdAt }`. One document is created per successful file in a batch. |
| Presentation | `presentations` | Only admin and procurement can create one (enforced by the server). Members keep read access. |
| Newsletter Article | `newsletter-articles` | `{ title, subject, html, published }`. It can be saved many times in one editing session. |

## Client state: Upload Batch (FileManagement)

```text
UploadBatch
  items: UploadItem[]          # in selection order
  active: boolean              # true from first request until last settles → overlay visible, beforeunload armed

UploadItem
  name: string                 # File.name
  size: number                 # File.size (bytes)
  loaded: number               # bytes sent, from onUploadProgress
  status: "queued" | "uploading" | "processing" | "done" | "failed"
  error?: string               # server message or network error, shown when failed
```

**Derived values**

- Per-file percent = `round(loaded / size * 100)`.
- Batch percent = `round(Σ effectiveLoaded / Σ size * 100)`, where `effectiveLoaded` is `size` for `done` and `failed` items and `loaded` for the others (see research R3).
- Summary = the number of `done` items and the number of `failed` items.

**State transitions (per item)**

```text
queued ──start──▶ uploading ──loaded==size──▶ processing ──2xx success──▶ done
                     │                            │
                     └──────── error / success:false / non-2xx ───────────▶ failed
```

The batch finishes when every item is `done` or `failed`. At that point the overlay closes, the file list refetches, and a toast shows the summary.

## Client state: Newsletter form

No new fields. The existing `submitting` flag disables both save buttons, and the existing `editingArticle` is set after the first Save of a new article.
