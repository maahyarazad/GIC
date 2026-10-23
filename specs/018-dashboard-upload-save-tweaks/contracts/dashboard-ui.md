# Contract: Dashboard UI behaviour

## Access map (`ui/src/Pages/Dashboard/Dashboard.tsx`)

```text
manage_presentations: ["admin", "procurement"]   # was ["user", "admin", "procurement"]
```

A member who opens `?tab=manage_presentations` (with or without `&eventId=`) gets the `country_intelligence` tab, and the URL is replaced. This uses the existing resolver behaviour.

## Newsletter form header (`Newsletter.tsx`, form view)

| Control | Type | Label (idle / busy) | Action |
|---|---|---|---|
| Cancel | `button` | "Cancel" | back to list, no save (unchanged) |
| Save | `button` | "Save" / "Saving…" | `submitArticle(form.html, { stay: true })` |
| Save and Close | `submit` (form `newsletter-form`) | "Save and Close" / "Saving…" | `submitArticle(form.html)` → list on success |

- Save and Save and Close are both `disabled` while `submitting` is true.
- On a validation or request failure, the view stays `form` and a toast shows the error.
- The Studio editor's built-in save (`onSave`) keeps its current save-and-stay behaviour.

## File Management (`FileManagement.tsx` + `UploadOverlay.tsx`)

- The upload control is `<input type="file" multiple hidden>`, labelled "Upload Files". The control is disabled while a batch is active, and its `value` is reset after each selection so the same files can be picked again.
- **UploadOverlay** props: `{ items: UploadItem[]; batchPercent: number }` (see [data-model.md](../data-model.md)).
  - It is positioned over the File Management section, covering the header and grid, and blocks pointer interaction with them. It has `role="dialog"`, `aria-modal="true"` and `aria-busy="true"`.
  - Each row shows the file name, a progress bar with `role="progressbar"` and its percentage, and a status label: Queued / Uploading / Processing… / Uploaded / Failed – {reason}.
  - The footer shows the overall bar and "N of M files".
- When the batch finishes, the overlay closes, `fetchFiles()` runs, and a toast appears: success when no file failed, otherwise a warning or error such as "3 uploaded, 1 failed: report.exe (Unsupported file type)".
- While a batch is active, a `beforeunload` handler is attached and asks the browser to confirm leaving the page.
