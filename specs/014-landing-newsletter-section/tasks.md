---

description: "Task list for Landing Page Newsletter Section"
---

# Tasks: Landing Page Newsletter Section

**Input**: Design documents from `/specs/014-landing-newsletter-section/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/newsletter-public.md, quickstart.md

**Tests**: Not requested; validation is manual per quickstart.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Confirm branch is `014-landing-newsletter-section`; create folders `ui/src/Pages/Newsletter/` and confirm `ui/src/Pages/Home/` exists.

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 [P] Create `src/middleware/optionalAuth.ts` exporting `optionalAuth(req, res, next)`: read `req.cookies?.token`; if present and `jwt.verify(token, process.env.JWT_SECRET)` succeeds set `req.user = decoded`; on any failure or missing token just call `next()` without rejecting. Reuse the `AuthRequest` type from `src/middleware/auth.middleware.ts`.
- [X] T003 [P] Add `NewsletterTeaser` (`{ id: string; title: string; sentAt: string; preview?: string }`) and `NewsletterPublicDetail` (`{ id, title, subject, sentAt, html }`) to `src/types/newsletterArticle.types.ts`.
- [X] T004 [P] Create `ui/src/api/newsletterPublic.ts` with `getNewsletterTeasers(limit?: number)` → `GET /newsletter-articles/public` and `getNewsletterArticle(id)` → `GET /newsletter-articles/public/{id}` using `axiosInstance` from `ui/src/api/axiosInstance.ts` (baseURL already `/api/v1/`); return `res.data`.

**Checkpoint**: Helpers exist; no behaviour changed.

---

## Phase 3: User Story 1 - Member browses newsletters on the landing page (Priority: P1) 🎯 MVP

**Goal**: Signed-in users see Blog-style newsletter cards on the landing page and can open one.

**Independent Test**: Quickstart steps 4 (and 1 for the authorized API shape).

- [X] T005 [US1] In `src/controllers/newsletterArticle.controller.ts` add `@Get("public")` with `@Middlewares(optionalAuth)` and `@Query() limit = 6` (clamp 1–24), declared BEFORE `@Get("{id}")`. Query `NewsletterArticleModel` for `sentAt: { $ne: null }`, sort `sentAt` desc, projection excluding `html` unless needed for the preview. Return `createSuccessResponse({ items, authorized }, ...)` where `authorized = !!req.user`; each item `{ id, title, sentAt }` plus, only if authorized, `preview` = tag-stripped `html` first 160 chars. Never return `html`/`subject`. (Needs `@Request() req` from tsoa.)
- [X] T006 [US1] In the same controller add `@Get("public/{id}")` with `@Middlewares(authMiddleware)` (import from `../middleware/auth.middleware`), before `@Get("{id}")`: return `{ id, title, subject, sentAt, html }` for an article with `sentAt` set; 404 with `createErrorResponse` otherwise.
- [X] T007 [P] [US1] Create `ui/src/Pages/Home/NewsletterSection.tsx` + `NewsletterSection.css`: props `{ config }` from `siteData.newsletter` (`eyebrow`, `title`, `subtitle`, `limit`, `ctaLabel`, all optional with defaults). Fetch teasers via `getNewsletterTeasers(config.limit)` in `useEffect`; show a loader, a short error message on failure, and an empty message when none. Render a grid of cards reusing the Blog card look (copy the `bp-card` styles from `ui/src/Pages/Blog/BlogPosts.css` into `.nl-card` classes). Each card shows title, formatted `sentAt` (`en-GB`, same as Blog) and `preview`. For authorized users clicking `navigate('/newsletter/' + id)`; cards are `role="link"` `tabIndex=0` with Enter/Space support.
- [X] T008 [P] [US1] Create `ui/src/Pages/Newsletter/NewsletterDetail.tsx` (+ `NewsletterDetail.css`): read `:id` from `useParams`, call `getNewsletterArticle(id)`, show title/date and the `html` inside `<iframe sandbox="" srcDoc={html}>` with auto-height (use `sandbox="allow-same-origin"` only if needed for measuring height; never `allow-scripts`). Show loader, not-found message, and a back link to `/`.
- [X] T009 [US1] In `ui/src/App.jsx` import `NewsletterDetail` and add `<Route path="/newsletter/:id" element={<ProtectedRoute><NewsletterDetail /></ProtectedRoute>} />` above the `*` route.
- [X] T010 [US1] In `ui/src/Pages/Home/Home.tsx` import `NewsletterSection` and render `{siteData?.newsletter && <NewsletterSection config={siteData.newsletter} />}` as a new `.sec` block after the existing experts section, matching the surrounding section markup (alternate `var(--bgp)` / `var(--bg)` background).
- [ ] T011 [US1] Verify quickstart step 4: signed in, cards readable with preview, click opens the newsletter in the iframe.

**Checkpoint**: Story 1 works end to end.

---

## Phase 4: User Story 2 - Visitor sees a blurred teaser and is invited to apply (Priority: P1)

**Goal**: Logged-out visitors see blurred cards with no body data and are routed to the Membership Application.

**Independent Test**: Quickstart steps 1–3.

- [X] T012 [US2] In `NewsletterSection.tsx` use `state.auth.user` (Redux, as in `Home.tsx`) to detect visitors. For visitors render each card with the `.nl-card--locked` class (CSS `filter: blur(6px)`, `user-select: none`, `pointer-events` kept on the card) and placeholder text instead of `preview`; overlay a "Members only" prompt using `config.ctaLabel` (default "Apply for membership"). Title is blurred too. Clicking/Enter on any locked card calls `navigate('/contact')`.
- [ ] T013 [US2] Verify quickstart steps 1–3: `curl` the public list as anonymous (no `preview`/`html`, drafts absent), `curl` public/{id} returns 401, and View Source / Network on the landing page contain no newsletter body text; click goes to `/contact` Membership Application.

**Checkpoint**: Stories 1 and 2 both pass.

---

## Phase 5: User Story 3 - Section content is controlled from the website blueprint (Priority: P2)

**Goal**: Section presence and text come from the blueprint's `newsletter` entry.

**Independent Test**: Quickstart step 5.

- [ ] T014 [US3] Document the expected blueprint shape by adding a `newsletter` example entry to `site-data.json` at the repo root (`{ "eyebrow": "Member Insights", "title": "Newsletter", "subtitle": "Industry intelligence for Club members.", "limit": 6, "ctaLabel": "Apply for membership" }`); if `site-data.json` is not the live blueprint source, leave it and tell the user the shape instead.
- [X] T015 [US3] Ensure `NewsletterSection.tsx` clamps `limit` to 1–24 and falls back to defaults for any missing field, and that `Home.tsx` renders nothing when `siteData.newsletter` is absent. Verify quickstart step 5.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T016 Verify failure and responsive behaviour (quickstart steps 6–7): API down shows a short message with the rest of Home intact; phone width has no horizontal scroll; Tab/Enter activates cards.
- [X] T017 Run `npx tsc --noEmit` at the repo root and in `ui/`; fix errors in touched files. Run `npm run tsoa:routes` so the new routes are generated.
- [ ] T018 Run the full quickstart.md once more.

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → US3 → Polish.
- T002, T003, T004 are independent ([P]). T005 depends on T002, T003; T006 on T003; T007 on T004; T008 on T004; T009 on T008; T010 on T007.
- US2 (T012) edits the same file as T007, so run after US1. US3 touches the same section/Home files, so run last.

## Parallel Example

```text
T002 optionalAuth.ts  ||  T003 types  ||  T004 ui api client
T007 NewsletterSection.tsx  ||  T008 NewsletterDetail.tsx   (after T004)
```

## Implementation Strategy

MVP = Phases 1–4 (T001–T013): both P1 stories, which together are the access model (members read, visitors see blurred teasers and are sent to apply). US3 adds blueprint tuning and defaults; polish verifies failure and mobile behaviour.
