# Research: Email Log Service

All Technical Context items were resolved from the codebase; no open questions remain.

## 1. Where to wrap nodemailer

- **Decision**: Add `src/services/emailLogService.ts` as the only module that imports `nodemailer`. It owns the SMTP account config (`SMTP_ACCOUNTS`, moved out of `emailService.ts`), creates the transport, and exposes one function, `sendLoggedEmail(params, meta)`, which writes the log record and calls `transporter.sendMail`. `sendRawEmailWithAttachments` in `src/services/emailService.ts` keeps its signature and delegates to it.
- **Rationale**: Every email in the app already goes through `sendRawEmailWithAttachments` (the only `createTransport`/`sendMail` call in `src/`). Callers (`emailOtp`, `sendDynamicEmailToUser`, `sendDynamicEmailDoc`, `sendMassDynamicEmailDoc`, `sendMassEmail`) and their 9 importers do not change, which meets FR-005 and SC-004.
- **Alternatives considered**: Logging inside `sendRawEmailWithAttachments` without a new module (rejected: the user asked for a separate service, and keeping nodemailer in one file makes FR-001 checkable with a grep). A nodemailer plugin (`transporter.use("compile")`) (rejected: it doesn't see the send result, so it can't record the outcome).

## 2. Recording the email kind and bulk run id

- **Decision**: Add two optional fields to `SendRawEmailParams`: `kind?: string` and `runId?: string`. The template-based senders pass the template name (`otp_verification`, the `doc` name, `param.template_name` or the looked-up `template.name`). `sendMassEmail` takes an optional `kind` and makes one `runId` (`crypto.randomUUID()`) per call, shared by every recipient's record. `sendMassDynamicEmailDoc` passes `kind: doc.name ?? "newsletter"`, and the newsletter test send passes `kind: "newsletter_test"`. When no kind is given, the default is `"raw"` for a single send and `"bulk"` for `sendMassEmail`.
- **Rationale**: `sendRawEmailWithAttachments` doesn't know which template was used, so the callers inside `emailService.ts` have to pass it down. Callers outside the service keep the same API.
- **Alternatives considered**: Inferring the kind from the subject (rejected: subjects are templated and change). Making `kind` required (rejected: it would change every external caller).

## 3. Write order and failure isolation (FR-003, FR-006, SC-005)

- **Decision**: (1) Insert a `pending` record and `await` it inside `try/catch`. A failure is logged with `console.error` and sending continues without a record id. (2) Create the transport and call `sendMail` inside `try`, so config errors (for example a missing SMTP env value) are also recorded as `failed`. (3) Update the record to `sent` (with `messageId`) or `failed` (with `error`, trimmed to 500 chars, the same as the existing recommendation-letter error handling) and `finishedAt`, *without* awaiting (`void ….catch(console.error)`). (4) Return the nodemailer response or re-throw the original error unchanged.
- **Rationale**: A pending record written before the send covers the "server stops mid-send" edge case. Only the single-document insert sits on the caller's path (a few ms on the same Mongo connection), well inside the 50 ms budget. The final update runs after the caller already has its result.
- **Alternatives considered**: One write after the send (rejected: a crash mid-send leaves no trace). Writing everything without awaiting (rejected: then there's no record id to update, and an `upsert` keyed on a client id adds complexity for no gain).

## 4. What is stored (FR-007)

- **Decision**: Store the to, cc and bcc addresses as lower-cased arrays, `replyTo`, the sender account key and the resolved `from` address, the subject, the kind and runId, attachment `{ filename, contentType, size }`, the status, messageId, error and the timestamps. Do *not* store the html or text bodies, template variables, attachment content or SMTP credentials. `size` is `content.length` when the content is a Buffer or string; for path-based attachments it is left empty, and no file is read.
- **Rationale**: Covers everything the detail view needs (spec User Story 4, scenario 4) without storing OTP codes, personal data or PDFs.

## 5. Retention (FR-009)

- **Decision**: Use a TTL index on `createdAt` with `expires: "365d"` in the Mongoose schema. `src/db.ts` connects with `autoIndex: true`, so the index is built on startup.
- **Alternatives considered**: A cron cleanup job (rejected: no scheduler exists in the codebase, and TTL is built into MongoDB).

## 6. Admin list endpoint (FR-008, FR-010, FR-011)

- **Decision**: Add a new tsoa controller `src/controllers/emailLog.controller.ts` with `GET /api/v1/email-logs` behind `adminOnlyMiddleware` (admin only, so procurement users get 403). It follows the `ContactUsController.getAllContactUsSubmissions` query style: `filters` JSON (`contains` / `startsWith` / `endsWith` / `equals`, with an allow-list and regex-escaping), `limit` (clamped to 1..100), `skip`, `sortBy` (allow-list) and `sortOrder`. Three extra query params: `status` (`pending|sent|failed`), `from` and `to` (ISO datetimes, `from` inclusive and `to` exclusive). The `recipient` filter field matches any of `to`, `cc` or `bcc` through `$or`. There is no detail endpoint, because each list row already holds the full record.
- **Rationale**: Reuses the established pattern, which the existing grid client code already speaks. `adminOnlyMiddleware` already exists for admin-only data.
- **Alternatives considered**: `adminAuthMiddleware` (rejected: it also lets procurement in, which conflicts with clarification Q1). A separate `GET /{id}` endpoint (rejected: it isn't needed for the detail view).

## 7. Dashboard section and "click a row" detail

- **Decision**: Add `ui/src/Components/Dashboard/EmailLogs/EmailLogs.tsx` using `GenericDataGrid`, registered in `ui/src/Pages/Dashboard/Dashboard.tsx` as menu item `email_logs` (title "Email Logs", `accessControl: ["admin"]`, and added to `isValidMenuItem` and `componentMap`). Above the grid it has a status `<select>` and two `<input type="date">` fields (From, To). The client turns local dates into ISO boundaries (`from` = local 00:00 of From, `to` = local 00:00 of the day after To), and if From > To it shows a toast instead of fetching. The detail view opens through `useModal().openModal` (the same pattern as the Contact Us "View" button), from a View button (`FaEye`) in each row.
- **Rationale**: `GenericDataGrid` has no row-click prop. A View button per row is the established way to open a record in this dashboard, and it meets FR-010 ("clicking a row opens a detail view") without changing the shared grid component.
- **Alternatives considered**: Adding an `onRowClick` prop to `GenericDataGrid` (rejected for now: it changes a component shared by about 10 sections, and the View button matches the existing UX).

## 8. Testing

- **Decision**: Manual and curl validation per [quickstart.md](quickstart.md). The repo has no automated test runner (`package.json` has no test script), the same as previous features.
