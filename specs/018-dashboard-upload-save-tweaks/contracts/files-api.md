# Contract: Files API (`/api/v1/files`)

Only the auth guard and the missing-file response change. Request and response shapes stay the same, so `Blog.tsx` keeps working without changes.

## POST `/api/v1/files` — upload one file

| | Before | After |
|---|---|---|
| Auth | none | `adminAuthMiddleware`: `token` cookie with role `admin` or `procurement` |
| Body | `multipart/form-data`, field `file` | unchanged |
| Size limit | 50 MB (multer, global) | unchanged |

**Responses**

| Status | Body | When |
|---|---|---|
| 201 | `{ success: true, message: "File created successfully", data: { fileId, extension } }` | stored |
| 400 | `{ success: false, code: "NO_FILE" }` | no `file` part (**new**; this used to throw a 500) |
| 200 | `{ success: false, code: "UPLOAD_ERROR", message: "Unsupported file type" }` | unknown MIME type (existing behaviour, kept) |
| 401 / 403 | `{ message }` | no token, expired token, or a member role |
| 413 / 500 | multer limit error or `{ success: false, code: "UPLOAD_ERROR" }` | file larger than 50 MB, or a write failure |

The client treats any non-2xx status **or** `success: false` as a failed item and uses the `message` field (or the HTTP error text) as the reason.

**Progress**: The client reads progress from the request's upload-progress events (`loaded`, `total`). No other progress endpoint exists (see research R1).

## DELETE `/api/v1/files/{id}`

Auth changes from none to `adminAuthMiddleware`. Everything else is unchanged.

## GET `/api/v1/files`

Unchanged.
