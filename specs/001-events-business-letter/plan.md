# Implementation Plan: Event Categories & Business Letter Requests

**Branch**: `001-events-business-letter` | **Date**: 2026-10-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-events-business-letter/spec.md`

## Summary

Two independent changes in the GIC Dashboard:

1. **Events** — split the Dashboard Events grid into "Upcoming Events" and "Past Events" by local calendar day, and replace the third-party fallback image with the GIC logo blurred at `4px` (≈"20%") on a dark background. Client-only change in `Events.tsx` / `Events.scss`.
2. **Request a Business Letter** — new Dashboard tab for all roles. Members submit a validated form (Formik + Yup) → new authenticated tsoa controller persists a `BusinessLetterRequest` (Mongoose) with a `BL-YYYYMMDD-XXXXXX` reference → notification email sent asynchronously to the four GIC leadership addresses using the existing DB-stored template `6ac4970fe31c56f3436780a0`, looked up by id (HTML source in `contracts/`). Members list their own requests and download an on-demand `pdf-lib` PDF summary streamed via `Readable`.

## Technical Context

**Language/Version**: TypeScript 5.9 (Node, server via `tsx`/`tsc`); React 19 + TypeScript/JSX (Vite 7) in `ui/`

**Primary Dependencies**: Express 4, tsoa 6, Mongoose 9 / MongoDB driver 7, nodemailer 8, pdf-lib 1.17, jsonwebtoken; UI: react-router-dom 6, Redux Toolkit, Formik + Yup, axios, Bootstrap 5. **No new dependencies.**

**Storage**: MongoDB — new collection `businessletterrequests`; new document in `emailtemplates`. No files written to disk (PDF generated per request).

**Testing**: No automated test runner in repo (research R13). Validation = `npm run build` (tsoa + tsc), `ui` build, and manual/curl scenarios in [quickstart.md](./quickstart.md).

**Target Platform**: Linux server under PM2 (SSR Express app on `PORT`, default 5173); modern desktop/mobile browsers.

**Project Type**: Web application — Express/tsoa API in `src/` + React SPA/SSR client in `ui/src/`.

**Performance Goals**: Form submit responds < 1s (email send is non-blocking); PDF download < 1s for a single-page document; history query uses `{userId, createdAt}` index.

**Constraints**: Users access only their own requests (404 for others); user text is plain text everywhere (HTML-escaped in email); pdf-lib standard fonts are WinAnsi-only (non-Latin chars replaced by `?`); recipients never exposed to the client; POST rate-limited 5/min/IP.

**Scale/Scope**: Tens of requests per month; 3 roles; 1 new controller (3 endpoints), 1 model, 1 config, 1 dashboard component, 1 email template; 2 files modified for Events.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template — no ratified principles exist, so there are no formal gates to violate. In their place the plan is checked against the repository's de-facto conventions:

| Convention (observed in repo) | Plan complies? |
|---|---|
| Controllers via tsoa decorators under `api/v1`, envelopes via `createSuccessResponse`/`createErrorResponse` | ✅ `BusinessLetterController` |
| Auth via `@Middlewares(authMiddleware)`, identity from JWT cookie, never from body | ✅ `req.user.userId`; email from user record |
| Mongoose model + `map…` DTO function in `src/models` (cf. `contactus.model.ts`) | ✅ |
| Emails via DB-stored templates + `sendDynamicEmailToUser` | ✅ template `6ac4970fe31c56f3436780a0`, by id (backwards-compatible `template_id` option) |
| Dashboard tabs via `MenuItem` / `accessControl` / `menuTitles` / `componentMap` | ✅ `business_letter` |
| Component SCSS + committed compiled CSS | ✅ |
| No new dependencies unless necessary | ✅ none added |

**Result (pre-research)**: PASS (no constitution gates defined). **Result (post-design)**: PASS — design added no new projects, layers or dependencies. Recommendation: run `/speckit-constitution` to ratify these conventions.

## Project Structure

### Documentation (this feature)

```text
specs/001-events-business-letter/
├── spec.md
├── plan.md                         # this file
├── research.md                     # Phase 0
├── data-model.md                   # Phase 1
├── quickstart.md                   # Phase 1
├── checklists/requirements.md
├── contracts/
│   ├── business-letters.api.md     # REST + dashboard UI contract
│   ├── business-letter-email.contract.md
│   └── business_letter_request.email.html   # ← email template (requested HTML file)
└── tasks.md                        # Phase 2 (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
src/
├── config/
│   └── businessLetterConfig.ts           # NEW  BUSINESS_LETTER_RECIPIENTS (4 defaults) + BUSINESS_LETTER_EMAIL_TEMPLATE_ID (default 6ac4970fe31c56f3436780a0); both env-overridable
├── controllers/
│   └── businessLetter.controller.ts      # NEW  POST /, GET /, GET /{id}/pdf  (authMiddleware; POST + strictLimiter)
├── models/
│   └── businessLetterRequest.model.ts    # NEW  schema, indexes, mapBusinessLetterRequest
├── services/
│   ├── emailService.ts                   # EDIT EmailParam.template_id? → lookup by _id (name lookup unchanged)
│   └── businessLetterPdf.ts              # NEW  buildBusinessLetterPdf(dto): Promise<Uint8Array> (pdf-lib, toWinAnsi)
├── types/
│   └── businessLetter.types.ts           # NEW  enums, request/DTO types, label maps
├── utils/
│   └── helpers.ts                        # EDIT add escapeHtml()
└── routes/routes.ts, swagger/swagger.json  # REGENERATED by tsoa (npm run build / dev)

ui/src/
├── api/
│   └── businessLetter.ts                 # NEW  create / list / downloadPdf (blob)
├── Components/Dashboard/
│   ├── BusinessLetter/
│   │   ├── BusinessLetter.tsx            # NEW  form (Formik+Yup) + history table + download
│   │   ├── BusinessLetter.scss           # NEW
│   │   └── BusinessLetter.css            # NEW  compiled
│   └── Events/
│       ├── Events.tsx                    # EDIT splitEventsByDate, two groups, GIC logo fallback
│       ├── Events.scss                   # EDIT group headings, .card-bg-image--fallback blur
│       └── Events.css                    # EDIT compiled
└── Pages/Dashboard/
    └── Dashboard.tsx                     # EDIT register business_letter tab for all roles
```

**Structure Decision**: Existing web-app layout — API in `src/`, client in `ui/src/`. New files follow the established per-domain naming (`*.controller.ts`, `*.model.ts`, `*.types.ts`, `ui/src/api/*.ts`, `Components/Dashboard/<Feature>/`).

## Design Notes

### Events (US3)

- `splitEventsByDate(events, now)` → `{ upcoming, past }` per research R2 (local-day parse of `YYYY-MM-DD`; undated → upcoming, last).
- Extract existing card JSX into a `renderEventCard(p, { showUpcomingBadge })` local function; render two `<section>`s with `<h4>` headings and empty-state `<p>`.
- `getEventImageUrl` returns `null` when no `Image`; card renders `<div className="card-bg-image card-bg-image--fallback" style={{ backgroundImage: url(gicLogo) }} />`.
- Import logo like Navbar: `import gicLogo from '../../../../public/gic-logo-main.png'`.
- SCSS: `$event-fallback-blur: 4px; .card-bg-image--fallback { background-size: contain; background-repeat: no-repeat; background-position: center; background-color: var(--bg2); filter: blur($event-fallback-blur); transform: scale(1.08); }` — the `.card` already has `overflow: hidden`.

### Business Letter backend (US1, US2)

- **POST**: validate body (manual, mirroring Yup rules; collect `details`) → load user by `req.user.userId` for `email` → pre-generate `_id` → build `reference` → `create` (retry once on duplicate key) → respond 201 with DTO → `void notifyLeadership(doc)` which escapes values, calls `sendDynamicEmailToUser({ template_id: BUSINESS_LETTER_EMAIL_TEMPLATE_ID, … })`, then `updateOne` `notification.{status,attemptedAt,error}`.
- **GET /**: `find({ userId }).sort({ createdAt: -1 }).skip().limit()` + `countDocuments`, envelope `{ items, total, page, pages }` (same paging math as ContactUs).
- **GET /{id}/pdf**: `ObjectId.isValid` → `findOne({ _id, userId })` → 404 if absent → `buildBusinessLetterPdf` → set `Content-Type`/`Content-Disposition` → `return Readable.from(Buffer.from(bytes))`.
- `req.user` is set by `authMiddleware`; read with `@Request() req` as `(req as any).user.userId` (pattern used in `user.controller.ts`).

### Business Letter frontend (US1, US2)

- Two cards in one section: **New request** form (left/top) and **My requests** table (right/bottom, stacks on mobile).
- Form fields per FR-008; letter type select (Business Recommendations / Partner Recommendations); purpose `<textarea maxLength=2000>` with counter; `neededBy` `<input type="date" min={today}>`.
- Submit button disabled while `isSubmitting` (double-submit edge case). On success: toast with reference, `resetForm()` (keeping prefilled contact), refetch list.
- Table columns: Reference · Submitted · Letter type · Needed by · Download. Empty state text: "You haven't requested any business letters yet."
- 401 handling is inherited from `axiosInstance` interceptors.

### Email template

Already stored as `emailtemplates` `_id 6ac4970fe31c56f3436780a0` (source: `contracts/business_letter_request.email.html`, based on the provided OTP template). The code reads it by id via `BUSINESS_LETTER_EMAIL_TEMPLATE_ID`; variables in [business-letter-email.contract.md](./contracts/business-letter-email.contract.md). The id lookup is the only change to `emailService.ts`, and it is additive.

## Rollout

1. Deploy server + client.
2. Email template `6ac4970fe31c56f3436780a0` already exists in production. Before release, check that its placeholders match the email contract. Leave `BUSINESS_LETTER_EMAIL_TEMPLATE_ID` unset in production.
3. Leave `BUSINESS_LETTER_RECIPIENTS` unset in production (defaults to the four leadership addresses).
4. Run quickstart scenarios A–C on production with one real request; confirm all four recipients received it.

## Complexity Tracking

No constitution violations to justify.
