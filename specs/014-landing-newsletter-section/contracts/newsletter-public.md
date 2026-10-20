# Contract: public newsletter endpoints

## `GET /api/v1/newsletter-articles/public?limit=6`
Auth: optional (`optionalAuth`). Returns sent articles only, newest first.
- 200 `{ success, data: { items: NewsletterTeaser[], authorized: boolean } }`
- Anonymous: `items[].preview` omitted; no `html`, no `subject`.
- Authorized: `preview` included. `html` is never included.

## `GET /api/v1/newsletter-articles/public/{id}`
Auth: required (`authMiddleware`).
- 200 `{ success, data: { id, title, subject, sentAt, html } }` for sent articles.
- 401 without a session; 404 if not found or `sentAt` is null.

Existing admin routes unchanged.
