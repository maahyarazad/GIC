# Research: Landing Page Newsletter Section

1. **Reuse the admin endpoint?** — No. `GET /api/v1/newsletter-articles` is `adminAuthMiddleware`-only and returns `html`. Calling the production URL as-is would 401 for members. **Decision**: new public read endpoints in the same controller (`api/v1/newsletter-articles/public`, `…/public/{id}`), declared before `{id}` so routing doesn't capture them.
2. **Blur and data leakage** — CSS blur on real content is trivially bypassed (DevTools/network). **Decision**: list endpoint returns only `_id`, `title`, `sentAt`, and a short plain-text `preview` for signed-in callers (omitted/empty for anonymous). Anonymous cards render placeholder text blurred. Detail endpoint requires auth (401 otherwise).
3. **Who is "authorized"?** — Any valid JWT session. **Decision**: `optionalAuth` middleware reads the `token` cookie, sets `req.user` when valid, never rejects; detail uses existing `authMiddleware`.
4. **Which articles?** — Only `sentAt != null`, sorted by `sentAt` desc. Drafts excluded.
5. **Blueprint** — Section config read from `siteData.newsletter` (`title`, `eyebrow`, `subtitle`, `limit`, `ctaLabel`); absent ⇒ no section. Owner edits the blueprint JSON; code supplies defaults for missing fields.
6. **Rendering HTML** — Articles are email HTML with inline styles. **Decision**: `<iframe sandbox srcDoc>` (no scripts), auto-height. Avoids XSS and style bleed.
7. **Click for visitors** — `navigate('/contact')` (Contact page contains "Membership Application"); card is a `role="link"` with keyboard activation.
8. **Preview text** — Derived server-side by stripping tags from `html`, first ~160 chars; only for authorized callers.
