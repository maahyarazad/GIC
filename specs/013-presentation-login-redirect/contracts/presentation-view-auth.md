# Contract: `GET /api/v1/presentations/{id}/view` unauthenticated behaviour

| Caller | Condition | Response |
|--------|-----------|----------|
| Browser navigation (`Sec-Fetch-Mode: navigate`, or `Accept` includes `text/html` when absent) | No/invalid/expired session | `302 Location: /login?redirect=%2Fapi%2Fv1%2Fpresentations%2F{id}%2Fview` |
| API/XHR (any other Accept, e.g. axios) | No token | `401 {"message":"No token provided"}` (unchanged) |
| API/XHR | Expired / invalid token | `401` as today (`Token expired` / `Invalid token`) |
| Any | Valid session | Unchanged: streams file (200) or `404` JSON |

No presentation bytes are sent on any non-200 path.

## Login page `redirect` parameter
- Accepted: value that, after decoding once, matches `^/(?![/\\])` (single leading slash, no scheme/host).
- Targets starting with `/api/` are opened with a full page load; other paths use in-app navigation.
- Rejected values fall back to `/dashboard`.
