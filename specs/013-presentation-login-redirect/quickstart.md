# Quickstart: validating the login redirect

Prerequisites: `npm run dev` running; a presentation id `<ID>` and a test user.

1. **Logged out, browser** — in a private window open `http://localhost:<port>/api/v1/presentations/<ID>/view`. Expect the login page, URL containing `?redirect=%2Fapi%2Fv1%2Fpresentations%2F<ID>%2Fview`.
2. **Login returns to presentation** — sign in; expect the presentation to open (not the SPA 404, not `/dashboard`).
3. **Wrong password** — fail once, then succeed; still lands on the presentation.
4. **API caller unchanged** — `curl -i -H 'Accept: application/json' http://localhost:<port>/api/v1/presentations/<ID>/view` → `401 {"message":"No token provided"}`; and `curl -i -H 'Accept: text/html' …` → `302` to `/login?redirect=…`.
5. **Open redirect blocked** — visit `/login?redirect=https%3A%2F%2Fevil.example` and `/login?redirect=%2F%2Fevil.example`, sign in; expect `/dashboard`.
6. **Signed in** — open the link directly; presentation opens with no login step.
7. **Dashboard presentation list** still works (axios calls unaffected).

See [contracts/presentation-view-auth.md](contracts/presentation-view-auth.md).
