---

description: "Task list for Footer Newsletter Subscription and Admin-Added Subscribers"
---

# Tasks: Footer Newsletter Subscription and Admin-Added Subscribers

**Input**: Design documents from `/specs/015-footer-newsletter-subscribe/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/newsletter-subscribers.md, quickstart.md

**Tests**: Not requested; validation is manual per quickstart.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Confirm branch is `015-footer-newsletter-subscribe` and read `src/controllers/newsletter.controller.ts`, `src/middleware/ratelimiter.middleware.ts` and `src/middleware/adminauth.middleware.ts` for the patterns used below.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Protect the subscriber admin routes and add shared types. Everything else depends on this.

- [X] T002 Add `adminAuthMiddleware` (import from `../middleware/adminauth.middleware`, `Middlewares` from `tsoa`) to `GET /` (`getSubscribers`), `PUT {id}` (`updateSubscriber`) and `DELETE {id}` (`deleteSubscriber`) in `src/controllers/newsletter.controller.ts`. Do not touch `POST /`, `GET email/{email}` or `PUT email/{email}`.
- [X] T003 [P] In `src/types/newsletterSubscriber.types.ts` add `export type SubscriberType = "internal" | "external"`, an optional `type?: SubscriberType` on `NewsletterSubscriber`, `BulkAddSubscribersRequest { emails: string[] }` and `BulkAddSubscribersResult { added: number; reactivated: number; duplicates: number; invalid: string[] }`.
- [X] T004 [P] In `src/middleware/ratelimiter.middleware.ts` add `export const subscribeLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, handler: (_req, res) => res.status(429).json({ success: false, message: "Too many attempts. Please try again later." }) })`.
- [X] T005 Add `app.set("trust proxy", 1);` near the top of `src/server.ts` (right after the `app` is created, before any middleware), with a one-line comment that it is required so rate limits use the real client IP behind the reverse proxy. Tell the user to confirm the deployment is behind exactly one proxy.

**Checkpoint**: Admin routes require a token; limiter and types exist.

---

## Phase 3: User Story 1 - Visitor subscribes from the footer (Priority: P1) 🎯 MVP

**Goal**: A footer Newsletter box that subscribes any visitor.

**Independent Test**: Quickstart steps 1–2.

- [X] T006 [US1] In `ui/src/Components/Footer/Footer.tsx` un-comment the `{/* Newsletter */}` block (the `ft-nl` input + `FaArrowRight` button + `ft-validation` div) so it renders, keeping the existing `handleSubmit`. Verify the `inputRef`, `validationMessageRef`, `email` state, `show` toast and `FaArrowRight` import it needs exist and are not unused/commented; add any missing import.
- [X] T007 [US1] In the same `handleSubmit` catch block show the server's message: use `error?.response?.data?.message ?? error.message` (the axios interceptor in `ui/src/api/axiosInstance.ts` may already normalise errors; check it and use whichever field carries the server message) so "already subscribed" and the 429 message reach the toast. Keep the success path as is.
- [ ] T008 [US1] Check `ui/src/Components/Footer/Footer.scss`/`.css` styles for `.ft-nl` and `.ft-validation` render correctly on dark/light and phone width; fix only if broken. Verify quickstart steps 1–2.

**Checkpoint**: Footer subscription works.

---

## Phase 4: User Story 2 - Subscription cannot be abused (Priority: P1)

**Goal**: Public `POST /newsletter` is rate limited per IP.

**Independent Test**: Quickstart step 3.

- [X] T009 [US2] In `src/controllers/newsletter.controller.ts` add `@Middlewares(subscribeLimiter)` (import from `../middleware/ratelimiter.middleware`) to `createSubscriber` (`@Post("/")`).
- [ ] T010 [US2] Run `npm run tsoa:routes`, start the server and verify with the curl loop in quickstart step 3 that attempts 6+ return 429 with the message and that no subscriber is created for them; verify `X-Forwarded-For` variation behaves independently when trust proxy is on.

**Checkpoint**: Stories 1 and 2 pass.

---

## Phase 5: User Story 3 - Admin adds external subscribers (Priority: P2)

**Goal**: Admin bulk-adds emails via a dashboard modal.

**Independent Test**: Quickstart steps 4–5 and 7.

- [X] T011 [US3] In `src/controllers/newsletter.controller.ts` add `@Post("admin/bulk")` with `@Middlewares(adminAuthMiddleware)`, declared BEFORE any `{id}` route, taking `@Body() body: BulkAddSubscribersRequest`. Validate: `emails` is an array with 1–200 entries, else `this.setStatus(400)` + `createErrorResponse`. Normalise (trim, lowercase), de-duplicate, split valid (same regex as the footer: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, max length 254) from `invalid`. Load existing with one `NewsletterSubscriberModel.find({ email: { $in: valid } }).lean()`; `insertMany` the missing as `active: true`; `updateMany` inactive existing to `active: true`; count active existing as `duplicates`. Return `createSuccessResponse<BulkAddSubscribersResult>({ added, reactivated, duplicates, invalid }, "Subscribers processed")`. Wrap in try/catch returning 500 like the other handlers.
- [ ] T012 [US3] Run `npm run tsoa:routes` and verify with curl (quickstart steps 4–5): 401 without a cookie, 403 for a non-admin, correct counts for a mixed list, >200 rejected.
- [X] T013 [P] [US3] In `ui/src/Components/Dashboard/NewsletterSubscribers/NewsletterSubscribers.tsx` add a header "Add subscribers" button (`className="dashboard-btn"`, in the `dash-header` row, right-aligned) and a small `AddSubscribersInput` component (textarea, placeholder "name@example.com, other@example.com", shows "N valid email(s)") that writes the raw text to a ref and calls `setModalDisabled(!hasValid)`. Follow the `TestEmailInput` + `handleSendTest` pattern in `ui/src/Components/Dashboard/Newsletter/Newsletter.tsx` (`useModal()` from `@/Providers/ModalContext`, `openModal({ variant: "default", title: "Add subscribers", content, confirmText: "Add", disabled: true, onConfirm })`).
- [X] T014 [US3] In `onConfirm` split the text on `/[\s,;]+/`, filter empties, `POST /newsletter/admin/bulk { emails }` via `axiosInstance`, then show a toast summary (`Added X, re-activated Y, already subscribed Z, invalid W`) and refetch the list (`fetchNewsletterSubscribers`). Show an error toast on failure and on a >200 paste ("Add up to 200 emails at a time") before calling the API.

**Checkpoint**: Admin can add subscribers.

---

## Phase 6: User Story 4 - Admin sees Internal vs External (Priority: P2)

**Goal**: Type column derived from the users collection.

**Independent Test**: Quickstart step 6.

- [X] T015 [US4] In `src/controllers/newsletter.controller.ts` `getSubscribers`, after loading `docs`, query `UserModel.find({ email: { $in: docs.map(d => d.email) } }).select("email").lean()` (import `UserModel` as `src/controllers/event.controller.ts` does), build a `Set` of lowercase emails, and map each subscriber with `type: set.has(email) ? "internal" : "external"` (extend `mapNewsletterSubscriber` in `src/mappers/newsletter.mapper.ts` to accept/pass `type`, or add it after mapping). Skip the user query when there are no docs.
- [X] T016 [US4] In `NewsletterSubscribers.tsx` add a "Type" column (`field: "type"`, width `8%`, not sortable/filterable) rendering a small badge: "Internal" / "External" (reuse the `newsletter-badge` classes from `ui/src/Components/Dashboard/Newsletter/Newsletter.css`, or add `.subscriber-type--internal/--external` styles). Also fix the existing "Updated At" cell which renders `createdAt`.
- [ ] T017 [US4] Verify quickstart step 6 (known user email → Internal, case-insensitive; others External).

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T018 Run `npx tsc --noEmit` at the repo root and in `ui/`; fix errors in touched files. Run `npm run tsoa:routes`.
- [ ] T019 Re-verify that the dashboard list/edit/delete still work for an admin after T002 (the UI calls the same endpoints with the cookie) and that the member-profile toggle (`email/{email}` routes) is unaffected.
- [ ] T020 Run the full quickstart.md once more.

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1/US2 (P1) → US3/US4 (P2) → Polish.
- T003 and T004 are independent ([P]); T002 and T005 touch different files too. T009 depends on T004; T011 on T002, T003; T013 can start any time after T003 (UI only); T014 depends on T011, T013; T015 depends on T003; T016 depends on T015.
- T009, T011 and T015 edit the same controller file, so run them sequentially.

## Parallel Example

```text
T003 types  ||  T004 limiter
T013 modal UI (NewsletterSubscribers.tsx)  ||  T011 bulk endpoint (controller)
```

## Implementation Strategy

MVP = Phases 1–4 (T001–T010): the working, rate-limited footer subscription plus the admin-route protection. Then US3 (bulk add) and US4 (type column), then polish. Call out to the user that Phase 2 changes who can call three existing endpoints.
