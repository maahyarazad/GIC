# Quickstart: validating footer subscription and admin-added subscribers

Prereqs: `npm run dev`; an admin login; one user email known to exist in `users`.

1. **Footer** — public page footer: invalid email → "Invalid Email"; valid new email → success toast, field cleared, row appears in the admin list.
2. **Duplicate / re-activate** — resubmit the same email → "already subscribed"; deactivate it in the admin list, resubmit → re-activated.
3. **Rate limit** — `for i in 1..7: curl -s -X POST localhost:<port>/api/v1/newsletter -H 'Content-Type: application/json' -d '{"email":"t'$i'@example.com"}'` → attempts 6+ return 429 with the message and store nothing. From another IP/header (`X-Forwarded-For` when trust proxy is on) the limit is independent.
4. **Auth** — without cookie: `GET /api/v1/newsletter`, `PUT /…/<id>`, `DELETE /…/<id>`, `POST /…/admin/bulk` → 401; as a non-admin user → 403.
5. **Admin add** — Newsletter Subscribers → "Add subscribers": paste `a@x.com, b@x.com, bad, a@x.com`; confirm → summary added 2, invalid `bad`, duplicate counted once; both appear as External.
6. **Type column** — add the known user's email → Internal; others External; change letter case → still Internal.
7. **Cap** — paste more than 200 emails → rejected with a clear message.

See [contracts/newsletter-subscribers.md](contracts/newsletter-subscribers.md).
