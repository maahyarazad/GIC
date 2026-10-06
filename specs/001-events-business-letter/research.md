# Research: Event Categories & Business Letter Requests

All Technical Context unknowns are resolved below. Each entry: Decision / Rationale / Alternatives considered.

## R1. Which "event section" and which "default image"

- **Decision**: Dashboard → Events (`ui/src/Components/Dashboard/Events/Events.tsx`). The "default image" is the `fallback` URL in `getEventImageUrl` (currently a German Emirates Club background hosted on `german-emirates-club.com`).
- **Rationale**: It is the only events view with a default image. The public Boardroom page (`ui/src/Pages/Boardroom`) uses a CSS gradient, not an image.
- **Alternatives considered**: Also changing the Boardroom page — rejected as out of scope (spec Assumptions). Its "Past/Upcoming Sessions" heading stub can reuse the same split helper later.

## R2. Past vs. upcoming classification

- **Decision**: Compare by local calendar day. Parse `event_date` date-only strings (`YYYY-MM-DD`) as local dates (`new Date(y, m - 1, d)`), not via `new Date("YYYY-MM-DD")` (which parses as UTC midnight and shifts the day in UTC− timezones and near midnight). Event is **past** if its day < today's day; otherwise (including today and missing/invalid dates) it is **upcoming**. Upcoming sorted ascending (undated last), past sorted descending. Implemented as a pure helper `splitEventsByDate(events, now)` inside the Events component file.
- **Rationale**: Matches FR-001/FR-002 and the "today counts as upcoming" edge case; pure helper is easy to verify.
- **Alternatives considered**: Server-side split in `/api/v1/events` — rejected; the endpoint is a pass-through to the external services server and is also used by Boardroom, so the response shape should not change.

## R3. "20% blurry" GIC logo fallback

- **Decision**: Fallback layer uses `ui/public/gic-logo-main.png` (imported the same way `Navbar.tsx` does) with `background-size: contain`, `background-repeat: no-repeat`, `background-color: var(--bg2)`, and a modifier class `card-bg-image--fallback` applying `filter: blur(4px); transform: scale(1.08);`. The blur constant lives in one SCSS variable (`$event-fallback-blur: 4px`).
- **Rationale**: CSS `blur()` accepts a length, not a percentage. On a ~300px-tall card, 4px is a light blur (~20% of "fully unreadable" ≈ 20px), so the logo stays recognisable as FR-004 requires. `contain` prevents the wide (1792×775) logo from being cropped by `cover`; `scale(1.08)` hides the soft halo blur creates at the edges. The blur is on the background layer only, so title and date badge (separate `z-1` elements) stay sharp (FR-005).
- **Alternatives considered**: `backdrop-filter` (blurs what's behind, wrong layer); pre-blurred PNG asset (harder to tune, extra asset); `opacity` instead of blur (not what was asked).

## R4. Notification recipients (single source of truth)

- **Decision**: New server config `src/config/businessLetterConfig.ts` exporting `BUSINESS_LETTER_RECIPIENTS`: parsed from env `BUSINESS_LETTER_RECIPIENTS` (comma-separated) when set, otherwise defaulting to the four addresses in `WEBMAIL_ALLOWLIST`.
- **Rationale**: FR-013. The existing `WEBMAIL_ALLOWLIST` is a client-side constant in `Navbar.tsx` and must not be trusted for server-side sending; recipients must not be exposed to members.
- **Alternatives considered**: Importing the Navbar constant into the server — rejected (client bundle boundary, couples webmail access to letter routing). Storing recipients in MongoDB — rejected (YAGNI; no admin UI requested).

## R5. Sending the notification email

- **Decision**: Reuse `sendDynamicEmailToUser({ template_id: BUSINESS_LETTER_EMAIL_TEMPLATE_ID, email: recipients.join(", "), data })` from `src/services/emailService.ts`, extended with an optional `template_id` (see R7). One email, all four recipients in `To`. Sent after the request is persisted, **not awaited by the HTTP response**; on resolve/reject the request's `notification.status` is updated to `sent`/`failed` (with `error` message and `attemptedAt`).
- **Rationale**: Existing templating pipeline (DB-stored template, `{{VAR}}` replacement, global `CURRENT_YEAR`). Nodemailer accepts a comma-separated `to`. Non-blocking send keeps submission fast (SC-001) and satisfies FR-015 (request never lost).
- **Alternatives considered**: Four separate sends — needless; BCC — recipients are colleagues and benefit from seeing each other (reply-all coordination). Awaiting SMTP in the request — slower and couples UX to mail server latency.

## R6. HTML injection in the email

- **Decision**: Add `escapeHtml()` to `src/utils/helpers.ts`; escape every user-supplied value before passing it as template data. For `PURPOSE`, escape then convert `\n` → `<br />`.
- **Rationale**: `replacePlaceholders` inserts values raw into HTML (FR-019).
- **Alternatives considered**: Escaping inside `replacePlaceholders` globally — rejected; existing templates (newsletter) intentionally inject HTML.

## R7. Email template source

- **Decision**: The template already exists in `emailtemplates` as `_id: ObjectId("6ac4970fe31c56f3436780a0")`. It was created by GIC from `contracts/business_letter_request.email.html`, which is based on the provided OTP template. The implementation looks it up **by `_id`**, not by name:
  - `src/config/businessLetterConfig.ts` exports `BUSINESS_LETTER_EMAIL_TEMPLATE_ID = process.env.BUSINESS_LETTER_EMAIL_TEMPLATE_ID || "6ac4970fe31c56f3436780a0"`.
  - `EmailParam` in `emailService.ts` gets an optional `template_id?: string`. When present, `sendDynamicEmailToUser` queries `{ _id: new ObjectId(template_id) }`; otherwise it keeps the existing `{ name: template_name }` lookup. `template_name` becomes optional, and exactly one of the two must be given. Existing callers are unchanged.
  - Subject and HTML come from the stored record, so admins can edit both in Email Templates.
- **Rationale**: The user asked for this record to be used. Looking it up by id keeps working even if an admin renames the template in the UI.
- **Alternatives considered**: Lookup by name (`business_letter_request`) — rejected: the stored name wasn't confirmed and can be changed in the UI. Hard-coding HTML in the service — rejected: admins couldn't edit it, and it breaks the `otp_verification` / `access_granted` pattern.
- **Environments**: The record wasn't found in the local Docker DB (`MONGO_URI_LOCAL`) on 2026-10-06, so it probably lives only in the shared cluster. For local development, either copy the document with the same `_id` into local `emailtemplates`, or set `BUSINESS_LETTER_EMAIL_TEMPLATE_ID` to a local copy's id.
- **Operational note**: An invalid id or missing record makes `sendDynamicEmailToUser` throw ("Email template not found"), so the status becomes `failed` and the request is still saved (R5, FR-014a). An invalid hex id must also be caught (ObjectId constructor throws).

## R8. Persistence

- **Decision**: Mongoose model `BusinessLetterRequest` (collection `businessletterrequests`) in `src/models/businessLetterRequest.model.ts`, mirroring `contactus.model.ts` (schema + `map…` function + interface). Index `{ userId: 1, createdAt: -1 }` for the history query; unique index on `reference`.
- **Rationale**: Same stack/pattern as ContactUs submissions.
- **Alternatives considered**: Raw `getCollection` driver — also used in repo, but Mongoose gives schema validation for free.

## R9. Reference number

- **Decision**: `BL-YYYYMMDD-XXXXXX`, where `XXXXXX` is the last 6 hex chars (uppercased) of the pre-generated `_id`. Unique index on `reference` guards collisions; on duplicate-key error regenerate `_id` and retry once.
- **Rationale**: Human-readable, sortable by day, no extra counter collection.
- **Alternatives considered**: Sequential counter collection (`BL-2026-0001`) — nicer but needs atomic `findOneAndUpdate` counter; can be swapped later without contract change.

## R10. PDF download

- **Decision**: Generate on demand with `pdf-lib` (already a dependency) — A4, Helvetica, `#C8541A` header bar with "German Industry Club – Business Letter Request", then labelled fields and wrapped purpose text, footer with reference and generation date. Endpoint returns a `Readable` (`Readable.from(bytes)`) with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="<reference>.pdf"`.
- **Rationale**: tsoa's Express `returnHandler` pipes values that are readable streams but `JSON`-serialises anything else — returning a `Buffer` would produce `{"type":"Buffer","data":[…]}`. On-demand generation always matches stored data (SC-004) and stores no files.
- **Constraint**: pdf-lib standard fonts only encode WinAnsi. German umlauts/ß are fine; other characters (e.g. Arabic) are replaced with `?` by a `toWinAnsi()` sanitiser rather than throwing. Embedding a Unicode TTF requires `@pdf-lib/fontkit` — deferred unless needed.
- **Alternatives considered**: Storing a PDF in `file_storage` at submission — duplicate source of truth; client-side PDF generation — would need a new UI dependency and can't enforce ownership.

## R11. Authorization

- **Decision**: All three endpoints use `@Middlewares(authMiddleware)`; owner is `req.user.userId`. List filters by `userId`; download does `findOne({ _id, userId })` and returns 404 (not 403) when not owned. Invalid ObjectId → 404. POST additionally uses `strictLimiter` (5/min/IP) to protect leadership inboxes from spam.
- **Rationale**: FR-018 / SC-005; 404 avoids leaking existence of other users' requests.

## R12. Frontend form

- **Decision**: New `ui/src/Components/Dashboard/BusinessLetter/BusinessLetter.tsx` using Formik + Yup (already used by `ContactUsForm`), `axiosInstance` via a new `ui/src/api/businessLetter.ts`, `useToast` for feedback, `Loader` for loading. Contact fields prefilled from `state.auth.user` (`name`, `email`, `phone`); email read-only (identity), others editable. Download via `axiosInstance.get(..., { responseType: "blob" })` + `URL.createObjectURL` (pattern from `EconomicInsights.tsx`). Styles in `BusinessLetter.scss` with committed compiled `BusinessLetter.css` (repo convention — UI has no sass build step).
- **Rationale**: Reuses existing patterns; no new dependencies.

## R13. Testing approach

- **Decision**: The repository has no automated test runner (no `test` script, no test files). Verification is via the manual/curl scenarios in `quickstart.md` plus `npm run build` (tsc + tsoa) and `cd ui && npm run build`.
- **Alternatives considered**: Introducing Jest/Vitest — out of scope for this feature; recommended as a separate initiative.

## R14. Constitution

- **Finding**: `.specify/memory/constitution.md` is the unfilled template (placeholders only). There are no ratified principles to gate against; plan applies the repo's de-facto conventions instead. Recommend running `/speckit-constitution`.
