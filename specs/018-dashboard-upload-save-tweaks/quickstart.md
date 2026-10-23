# Quickstart: validating feature 018

## Prerequisites

- Server: `npm run dev` from the repo root. This regenerates the tsoa routes, which is required after the middleware changes.
- UI: `cd ui && npm run dev`.
- Three accounts: one `admin`, one `procurement`, one `user` (member).
- Test files: a few small images or PDFs, one file of about 30–45 MB to make progress visible, and one file over 50 MB.
- Optionally, use DevTools → Network → throttling "Fast 4G" so the progress bars are easy to watch.

## 1. Presentations lock-down (US1)

1. Sign in as the **member**. The sidebar has no "Manage Presentations" entry.
2. Open `/dashboard?tab=manage_presentations&eventId=<any>`. The page lands on Country Intelligence and the URL changes to `tab=country_intelligence`.
3. As the member, in the DevTools console, run:
   `fetch('<api>/api/v1/presentations', { method: 'POST', credentials: 'include', body: new FormData() })`. The response is **403**, and no new record appears in the `presentations` collection.
4. As the member, open Events and then an event that has presentations. The presentations modal still lists and opens them.
5. Sign in as **admin** and then **procurement**. Each can open Manage Presentations and upload a PDF with the progress bar showing (no regression).

See [contracts/presentations-api.md](./contracts/presentations-api.md).

## 2. Newsletter Save / Save and Close (US2)

1. As admin, go to Newsletter and edit an article. The header shows **Cancel · Save · Save and Close**.
2. Change the subject and press **Save**. A success toast appears and the editor stays open. Press Save 4 more times; it stays open each time.
3. Press **Save and Close**. The list view shows the new subject.
4. Click **New Article**, fill it in, press **Save** twice, and then **Save and Close**. The list has exactly **one** new article.
5. Clear the title and press each button. A validation toast appears, the editor stays open, and nothing is saved.
6. Stop the server and press **Save and Close**. An error toast appears, the editor stays open, and the edits are still there.
7. Press Save and watch both buttons: they are disabled and show "Saving…" until the save finishes.

See [contracts/dashboard-ui.md](./contracts/dashboard-ui.md).

## 3. File Management multi-upload (US3)

1. As admin, open File Management and click **Upload Files**. The picker allows selecting several files.
2. Select 10 files, including the 30–45 MB file. The overlay appears straight away. The progress of the file currently uploading rises steadily and does not stall for more than 3 seconds while data is being sent. The batch bar rises in proportion to bytes sent. Each file passes through Processing… and then Uploaded.
3. While the overlay is showing, the grid and upload button cannot be clicked. Try to close the tab and the browser shows a leave-page warning.
4. When the batch finishes, the overlay closes, a toast reports "10 uploaded", and all 10 files appear in the grid without a manual refresh.
5. Select 3 small files plus the file over 50 MB. The large file is marked Failed with a reason, the other 3 upload, and the toast reports "3 uploaded, 1 failed".
6. Select a single file. The same overlay flow runs.
7. Open the picker and cancel. No overlay appears and no request is sent.
8. Signed in as the member, run
   `fetch('<api>/api/v1/files', { method: 'POST', credentials: 'include', body: new FormData() })` in the console. The response is **403** (the endpoint was unguarded before this feature).
9. As admin, upload an image from the Blog editor. It still works through `/files`.

See [contracts/files-api.md](./contracts/files-api.md) and [data-model.md](./data-model.md).
