# Contract: Presentations API (`/api/v1/presentations`)

| Route | Before | After |
|---|---|---|
| `POST /` (upload) | `authMiddleware` (any signed-in role) | `adminAuthMiddleware` (`admin`, `procurement`) |
| `GET /?eventId=` (list) | `authMiddleware` | unchanged; members still read |
| `GET /{id}/view` | `browserLoginRedirect` | unchanged |
| `DELETE /{id}` | `adminOnlyMiddleware` | unchanged |

A member calling `POST /` now gets **403** `{ message: "Forbidden: Admins only" }`, and the server stores nothing: no file write and no database insert, because the middleware rejects the request before the controller runs.
