---

description: "Task list for Email Log Service"
---

# Tasks: Email Log Service

**Input**: Design documents from `/specs/016-email-log-service/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/email-logs.md, quickstart.md

**Tests**: Not requested; validation is manual per quickstart.md.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [X] T001 Confirm branch is `016-email-log-service` and read `src/services/emailService.ts`, `src/models/logChange.model.ts`, `src/controllers/contactus.controller.ts` (`getAllContactUsSubmissions`), `src/middleware/adminauth.middleware.ts` (`adminOnlyMiddleware`), `ui/src/Components/Dashboard/ContactUsRequests/ContactUsRequests.tsx` and `ui/src/Pages/Dashboard/Dashboard.tsx` for the patterns used below.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The `EmailLog` model and shared types. Every story writes or reads these.

- [X] T002 [P] Create `src/types/emailLog.types.ts` exporting `EmailLogStatus = "pending" | "sent" | "failed"`, `EmailLogAttachment { filename?: string; contentType?: string; size?: number }`, the DTO `EmailLog { id: string; to: string[]; cc: string[]; bcc: string[]; replyTo: string | null; sender: "default" | "info"; from: string | null; subject: string; kind: string; runId: string | null; attachments: EmailLogAttachment[]; status: EmailLogStatus; messageId: string | null; error: string | null; createdAt: string; finishedAt: string | null }`, and `EmailLogSortKey = "createdAt" | "subject" | "kind" | "status" | "sender"`. Keep it free of mongoose/node imports so `ui/` can import it.
- [X] T003 Create `src/models/emailLog.model.ts` following `logChange.model.ts`: an `EmailLogDocument` interface and schema with fields exactly as in data-model.md (`to`/`cc`/`bcc` as `[{ type: String, lowercase: true, trim: true }]` with `[]` defaults; `sender` enum `["default","info"]`; `kind` default `"raw"`; `status` enum with default `"pending"`; attachments as a sub-array of `{ filename, contentType, size }` with `_id: false`). Use `timestamps: { createdAt: true, updatedAt: false }` and `versionKey: false`. Add the indexes `schema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 })`, `{ status: 1, createdAt: -1 }`, `{ kind: 1, createdAt: -1 }`, `{ to: 1 }` and `{ runId: 1 }, { sparse: true }`. Export `EmailLogModel = models.EmailLog || model<EmailLogDocument>("EmailLog", EmailLogSchema, "email_log")` and a `mapEmailLog(doc): EmailLog` (from T002) that turns `_id` into `id`, dates into ISO strings and missing optionals into `null`.
- [X] T004 Add `export * from "./emailLog.model";` to `src/models/index.ts`.

**Checkpoint**: Model compiles (`npx tsc --noEmit`).

---

## Phase 3: User Story 1 - Every outgoing email leaves a record (Priority: P1) 🎯 MVP

**Goal**: Every send goes through one wrapper that records recipients, sender, subject, kind, attachments and the outcome.

**Independent Test**: Quickstart steps 1, 2 and 5.

- [X] T005 [US1] Create `src/services/emailLogService.ts`. Move `SMTP_ACCOUNTS` (and its `dotenv.config()` import) here from `src/services/emailService.ts` and export `sendLoggedEmail(params: SendRawEmailParams)`. To avoid a circular import, move the `EmailSender`, `EmailAttachment` and `SendRawEmailParams` types here too and re-export them from `emailService.ts` (`export type { … } from "./emailLogService"`) so the existing importers keep working. Add `kind?: string` and `runId?: string` to `SendRawEmailParams`. The behavior of `sendLoggedEmail`: (1) normalize `to`/`cc`/`bcc` to lower-cased trimmed arrays; build attachment metadata (`size` = `content.length` for a Buffer or string, otherwise undefined; never read `path`); `await EmailLogModel.create({...pending})` inside try/catch, and on error `console.error("Email log insert failed:", err)` and continue with no id. (2) Inside `try`, build the transport exactly as the current code does (`host`, `port`, `secure: false`, `auth` from the account), build the same `mailOptions` (`from`, `to`, `cc`, `replyTo`, `subject`, `html`, `text`, `attachments`, `bcc`; `text` default `""`, `bcc` default `[]`, `sender` default `"default"`), `await transporter.sendMail(...)`, `console.log("Email sent:", response.messageId)`. (3) On success, if there is an id, call `void EmailLogModel.updateOne({_id}, {$set:{status:"sent", messageId, finishedAt:new Date()}}).catch(e => console.error("Email log update failed:", e))` and return the response. (4) On error, run the same non-awaited update with `status:"failed"` and `error: String(err?.message ?? err).slice(0, 500)`, keep `console.error("SMTP send error:", error)`, and `throw error` unchanged.
- [X] T006 [US1] In `src/services/emailService.ts` remove the `nodemailer` import and the `createTransport`/`sendMail` code. `sendRawEmailWithAttachments(params)` becomes `return sendLoggedEmail(params)`. Leave every other function signature unchanged.
- [X] T007 [US1] Pass `kind` through each template-based sender in `src/services/emailService.ts`: in `emailOtp` → `kind: "otp_verification"`; in `sendDynamicEmailToUser` → `kind: template.name ?? param.template_name ?? "raw"`; in `sendDynamicEmailDoc` → `kind: doc`.
- [ ] T008 [US1] Run `grep -rln 'from "nodemailer"' src` and make sure it lists only `src/services/emailLogService.ts`. Run `npx tsc --noEmit`. Then follow quickstart steps 1, 2 and 5 (OTP record, recommendation letter with attachment metadata, failure record with an unchanged API error).

**Checkpoint**: Every single send is logged; callers behave as before.

---

## Phase 4: User Story 2 - Bulk sends are traceable per recipient (Priority: P1)

**Goal**: One record per newsletter recipient, sharing a run id.

**Independent Test**: Quickstart step 3.

- [X] T009 [US2] In `src/services/emailService.ts` add `kind?: string` to `SendMassEmailParams`. In `sendMassEmail` create `const runId = randomUUID()` (`import { randomUUID } from "crypto"`) once per call and pass `kind: kind ?? "bulk"` and `runId` to every `sendRawEmailWithAttachments` call. In `sendMassDynamicEmailDoc` pass `kind: (doc as any).name ?? "newsletter"` to `sendMassEmail` (`EmailTemplate.name` is required in the type, but newsletter articles are passed in as `any` without it).
- [X] T010 [US2] In `src/controllers/newsletterArticle.controller.ts`, in the test-send `sendMassEmail({...})` call (around the `"Test email sent successfully"` response), add `kind: "newsletter_test"`.
- [ ] T011 [US2] Follow `specs/016-email-log-service/quickstart.md` step 3: the record count for the run equals the active subscriber count, and the "sent" count equals the server log's success total.

**Checkpoint**: Newsletter runs are traceable per recipient.

---

## Phase 5: User Story 3 - Logging never breaks email (Priority: P2)

**Goal**: A logging failure never blocks or alters a send.

**Independent Test**: Quickstart step 4.

- [X] T012 [US3] Review `sendLoggedEmail` in `src/services/emailLogService.ts`. Make sure that no logging call can throw into the send path: the insert is wrapped, the updates are `void …catch`, and the metadata building (`attachments`, normalizing addresses) sits inside the same try as the insert or can't throw on `undefined` / odd inputs (for example a string `cc`, or attachments without content). Fix whatever isn't covered.
- [X] T013 [US3] Follow `specs/016-email-log-service/quickstart.md` step 4 (force inserts to fail with the `collMod` validator, send an OTP, confirm it's delivered and `Email log insert failed` is logged, then undo).

**Checkpoint**: US1–US3 done; the backend logging is complete.

---

## Phase 6: User Story 4 - Admin browses the email logs in the dashboard (Priority: P2)

**Goal**: An admin-only "Email Logs" dashboard section with filters and a detail view.

**Independent Test**: Quickstart steps 6 and 7.

- [X] T014 [US4] Create `src/controllers/emailLog.controller.ts`: `@Route("api/v1/email-logs") @Tags("Email Logs") class EmailLogController extends Controller` with `@Get("/") @Middlewares(adminOnlyMiddleware) getEmailLogs(@Query("filters") filtersJson?: string, @Query() status?: string, @Query() from?: string, @Query() to?: string, @Query() limit: number = 20, @Query() skip: number = 0, @Query() sortBy: EmailLogSortKey = "createdAt", @Query() sortOrder: "asc" | "desc" = "desc")`, following `getAllContactUsSubmissions`:
  - Parse `filters` and return 400 `Invalid filters JSON` on bad JSON.
  - Allowed fields are `recipient`, `subject`, `kind` and `runId`. Build regexes with `escapeRegExp` (copy the helper) for `contains`/`startsWith`/`endsWith`, and an exact value for `equals`. `recipient` becomes `{ $or: [{to: cond}, {cc: cond}, {bcc: cond}] }`.
  - `status`: if set and not in `["pending","sent","failed"]`, return 400 `Invalid status`. Otherwise add `{status}`.
  - `from`/`to`: parse with `new Date`. If either is invalid, or both are set and `from >= to`, return 400 `Invalid date range`. Otherwise add `createdAt: { $gte: from, $lt: to }` (only the bounds that are set).
  - Combine all parts with `$and`. Clamp `limit` to 1..100 and `skip` to >= 0. Use an allow-list for `sortBy` with a fallback to `createdAt`, and add `_id` as a tie-break in the sort.
  - Run `EmailLogModel.find(filter).sort(sort).skip(skip).limit(limit).lean()` and `countDocuments(filter)` in `Promise.all`.
  - Return `createSuccessResponse({ logs: docs.map(mapEmailLog), total, page: Math.floor(skip/limit)+1, limit })`. On unexpected errors, set status 500 and return `createErrorResponse("Failed to fetch email logs")`.
  - Add no other routes (the section is read-only).
- [ ] T015 [US4] Run `npm run tsoa:routes && npm run tsoa:spec` to regenerate `src/routes/` and `src/swagger/`. Check the curl calls in quickstart step 6 (200 / filtered / 400 / 403 procurement / 401).
- [X] T016 [P] [US4] Create `ui/src/Components/Dashboard/EmailLogs/EmailLogs.tsx` (default export `EmailLogs`), modeled on `ContactUsRequests.tsx` (the same `axiosInstance`, `useToast`, `useModal`, `debounce`, `GenericDataGrid`, `PaginationModel` / `SortModel` / `FilterModel` wiring, and the same response-reading style). Use `EmailLog` from `../../../../../src/types/emailLog.types`.
  - State: `rows`, `total`, `loading`, `paginationModel` `{page:1,pageSize:20}`, `sortModel` `{field:"createdAt",sort:"desc"}`, `filterModel`, `status` (`""` = all), `fromDate` and `toDate` (`yyyy-mm-dd` strings).
  - Fetch: GET `/email-logs` (match the base-path convention that ContactUsRequests uses for `/contact-us`) with `limit`, `skip=(page-1)*pageSize`, `sortBy`, `sortOrder`, `filters` (JSON, mapping the To column's filter field to `recipient`), `status` (omitted when `""`), `from = new Date(fromDate+"T00:00:00").toISOString()`, and `to` = local midnight of the day after `toDate`, as an ISO string. If `fromDate > toDate`, call `show("From date must be on or before To date", "error")` (use the toast signature ContactUsRequests uses) and don't fetch. Reset to page 1 when `status`, `fromDate`, `toDate` or the filters change.
  - Toolbar above the grid: a Status `<select>` (All/Pending/Sent/Failed) and From/To `<input type="date">`, using the existing dashboard form classes.
  - Columns: Sent at (`createdAt`, sortable, `toLocaleString()`); To (`to`, filterable, `to.join(", ")`); Subject (sortable, filterable); Kind (sortable, filterable); Sender (sortable); Status (sortable, a coloured badge per status); View (a `FaEye` button `className="dashboard-btn--icon"` that calls `openModal({ variant: "default", title: \`Email - ${row.subject}\`, content: <dl> of every EmailLog field (cc/bcc/replyTo/from/runId/messageId/finishedAt, attachments as "name (contentType, N KB)", error in a `whiteSpace: "pre-wrap"` block), cancelText: "Close", onCancel: () => {} })`).
  - The grid has no row-click prop. Per research #7, the View button is the row's detail action.
- [X] T017 [P] [US4] Only if T016 needs styles the existing dashboard CSS doesn't cover (the toolbar layout and status badge colours), create `ui/src/Components/Dashboard/EmailLogs/EmailLogs.css`, import it in `EmailLogs.tsx`, and use the existing theme CSS variables for light/dark.
- [X] T018 [US4] In `ui/src/Pages/Dashboard/Dashboard.tsx` import `EmailLogs`, add `"email_logs"` to the `MenuItem` union, add `email_logs: ["admin"]` to `accessControl`, `email_logs: "Email Logs"` to `menuTitles`, `email_logs: <EmailLogs />` to `componentMap` (after `email_management`), and `"email_logs"` to the `isValidMenuItem` list.
- [ ] T019 [US4] Follow `specs/016-email-log-service/quickstart.md` step 7 (admin menu entry, filters combine, page reset, the From>To toast, the View modal fields, procurement can't see it and `?tab=email_logs` falls back).

**Checkpoint**: All stories are done.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T020 Run `npx tsc --noEmit` at the repo root and the UI type-check/build in `ui/` (`npm run build` or the project's lint script); fix any errors from the new files.
- [ ] T021 Run `specs/016-email-log-service/quickstart.md` step 8 (the TTL index exists with `expireAfterSeconds: 31536000`), then re-run steps 1–7 as a final pass. Note in the PR any check that couldn't be run locally (for example the SMTP failure).

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T004)** → the user stories.
- **US1 (T005–T008)** depends on Foundational. **US2 (T009–T011)** depends on T005–T006 (the `kind`/`runId` params). **US3 (T012–T013)** depends on T005. **US4 (T014–T019)** needs only Foundational for its code, but needs US1 to have real data to check.
- Within US4: T014 → T015, and T016/T017 → T018 → T019. T016 can start as soon as T002 exists.
- **Polish (T020–T021)** comes after every story.

## Parallel Opportunities

- T002 and T003 can be drafted together. T003 imports the T002 types, so finish T002 first if one agent does both.
- Once Foundational is done: backend US1 (T005–T007) in parallel with the UI work in T016/T017.
- T014 (controller) in parallel with T016 (UI), since they're different files and the contract is fixed in contracts/email-logs.md.

```text
Agent A: T005 → T006 → T007 → T009 → T010 → T012
Agent B: T014 → T015
Agent C: T016 → T017 → T018
```

## Implementation Strategy

1. **MVP = Phases 1–3 (US1)**: every email is logged, verifiable with mongosh. You can ship here.
2. Add US2 (run ids) and US3 (hardening); these are small and backend only.
3. Add US4 (the admin endpoint and dashboard section).
4. Polish: type-check and the full quickstart pass.
