---

description: "Task list for Presentation Link Login Redirect"
---

# Tasks: Presentation Link Login Redirect

**Input**: Design documents from `/specs/013-presentation-login-redirect/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/presentation-view-auth.md, quickstart.md

**Tests**: Not requested; validation is manual per quickstart.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Confirm the working branch is `013-presentation-login-redirect` and that `ui/src/utils/` exists (create the directory if missing).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared helpers both stories rely on.

- [X] T002 [P] Create `ui/src/utils/safeRedirect.ts` exporting `sanitizeRedirect(raw: string | null): string | null`. Return the value only if it starts with a single `/` and not `//` or `/\`, contains no scheme, backslash, or control characters; otherwise return `null`.
- [X] T003 [P] Create `src/middleware/browserLoginRedirect.ts` exporting `browserLoginRedirect` (Express middleware). It wraps `authMiddleware` from `src/middleware/auth.middleware.ts`: call `authMiddleware` with a proxied `res` so that, when it would send a 401 and the request is a browser navigation (`req.headers["sec-fetch-mode"] === "navigate"`, or, when that header is absent, `Accept` includes `text/html`), respond instead with `res.redirect(302, "/login?redirect=" + encodeURIComponent(req.originalUrl))`. Non-navigation requests and non-401 outcomes (including 500 and successful `next()`) pass through unchanged.

**Checkpoint**: Helpers exist; no behaviour changed yet.

---

## Phase 3: User Story 1 - Logged-out visitor opens a presentation link (Priority: P1) 🎯 MVP

**Goal**: A logged-out browser opening a presentation link sees the login page and, after login, lands on the presentation.

**Independent Test**: Quickstart steps 1–3 (private window, open link, log in, presentation opens; wrong password then correct).

- [X] T004 [US1] In `src/controllers/presentation.controller.ts`, import `browserLoginRedirect` and replace `@Middlewares(authMiddleware)` with `@Middlewares(browserLoginRedirect)` on `viewPresentation` (`@Get("{id}/view")`) only. Leave the other routes on `authMiddleware`. Remove the `authMiddleware` import only if it becomes unused.
- [X] T005 [US1] In `ui/src/Pages/Login/Login.tsx`, update the `useEffect` that runs when `user` is set (currently `navigate(decodeURIComponent(redirect ?? '/dashboard'), { replace: true })`): compute `const target = sanitizeRedirect(redirect) ?? '/dashboard'` (do NOT `decodeURIComponent` again, `useSearchParams` already decodes). If `target` starts with `/api/`, call `window.location.replace(target)`; otherwise `navigate(target, { replace: true })`. Import `sanitizeRedirect` from `@/utils/safeRedirect` (or the relative path used elsewhere in the file).
- [ ] T006 [US1] Run the app (`npm run dev`) and verify quickstart steps 1–3 and 6 (logged out → login → presentation; failed login keeps the destination; signed-in user opens directly).

**Checkpoint**: Story 1 works end to end.

---

## Phase 4: User Story 2 - Programmatic callers keep current behaviour (Priority: P2)

**Goal**: API/XHR callers still receive the JSON 401 and nothing is redirected.

**Independent Test**: Quickstart steps 4 and 7.

- [ ] T007 [US2] Verify with curl that `Accept: application/json` (and a request with `Sec-Fetch-Mode: cors`) to `/api/v1/presentations/<ID>/view` and to `/api/v1/presentations` with no cookie return `401 {"message":"No token provided"}`, and that `Accept: text/html` on `view` returns `302` with `Location: /login?redirect=%2Fapi%2Fv1%2Fpresentations%2F<ID>%2Fview`. Fix `src/middleware/browserLoginRedirect.ts` if not.
- [ ] T008 [US2] Open the dashboard presentation list in the browser and confirm list/upload/delete still work and an expired session still produces the existing app behaviour (axios interceptor in `ui/src/api/axiosInstance.ts` unchanged).

**Checkpoint**: Stories 1 and 2 both pass.

---

## Phase 5: User Story 3 - Already signed-in visitor (Priority: P3)

**Goal**: Signed-in visitors open presentations directly.

**Independent Test**: Quickstart step 6.

- [ ] T009 [US3] While signed in, open `/api/v1/presentations/<ID>/view` directly and confirm the file streams with no login step; open a non-existent id and confirm the existing 404 JSON.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T010 Verify open-redirect protection (quickstart step 5): `/login?redirect=https%3A%2F%2Fevil.example` and `/login?redirect=%2F%2Fevil.example` both land on `/dashboard` after login.
- [X] T011 Run `npx tsc --noEmit` in the repo root and in `ui/` and fix any type errors in the touched files.
- [ ] T012 Run the full quickstart.md checklist once more and tick it off.

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 (Phase 3) → US2/US3 verification → Polish.
- T002 and T003 are independent ([P]). T004 depends on T003; T005 depends on T002. T006 depends on T004 and T005.
- US2 and US3 are verification-only and depend on US1's code being in place.

## Parallel Example

```text
T002 ui/src/utils/safeRedirect.ts   ||   T003 src/middleware/browserLoginRedirect.ts
T004 presentation.controller.ts     ||   T005 Login.tsx
```

## Implementation Strategy

MVP = Phases 1–3 (T001–T006): the server redirect plus the safe login redirect deliver the whole requested behaviour. US2/US3 and polish are verification passes; fix only if a check fails.
