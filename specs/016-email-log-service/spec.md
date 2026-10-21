# Feature Specification: Email Log Service

**Feature Branch**: `016-email-log-service`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "add email_log service that wraps the nodeMailer and keep the log of every email in the database"

## Clarifications

### Session 2026-10-21

- Q: Which dashboard roles should be able to open the Email Logs section? → A: Admin only; procurement users do not see it.
- Q: Should admins be able to act on a log record, or only look at it? → A: Read-only grid; clicking a row opens a detail view. No resend.
- Q: Besides the grid's usual text filters on each column, does the Email Logs section need a date-range filter and an outcome dropdown? → A: Yes: text column filters plus an outcome dropdown and a from/to date filter.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Every outgoing email leaves a record (Priority: P1)

Whenever the platform sends an email (OTP codes, event and business letter notifications, tender notifications, contact-us replies, recommendation letters, newsletters), a record of that email is kept: who it went to, from which sender account, the subject, what kind of email it was, when it was sent, and whether delivery to the mail server succeeded or failed.

**Why this priority**: Today the only trace of a sent email is a console line that disappears. Without a durable record, the team cannot answer "did this member get their email?" or find out why an email did not arrive.

**Independent Test**: Trigger any email flow (for example request an OTP), then confirm a record exists for that email with the correct recipient, subject, kind and a "sent" outcome.

**Acceptance Scenarios**:

1. **Given** any feature sends an email successfully, **When** the send completes, **Then** one record exists with the recipients, sender account, subject, email kind, send time and outcome "sent", plus the mail server's message identifier.
2. **Given** the mail server rejects or cannot be reached, **When** a send fails, **Then** a record exists with outcome "failed" and the failure reason, and the calling feature still receives the error exactly as before.
3. **Given** an email with CC, BCC, reply-to or attachments, **When** it is sent, **Then** the record lists the CC, BCC and reply-to addresses and the attachment file names.

---

### User Story 2 - Bulk sends are traceable per recipient (Priority: P1)

When a newsletter goes to all active subscribers, each recipient's email is recorded on its own, so the team can see exactly which subscribers received it and which failed, and can tell all records of one newsletter run apart from another run.

**Why this priority**: Newsletters are the highest-volume email; a run where some recipients fail is the most likely support question.

**Independent Test**: Send a newsletter to a small list that includes one undeliverable address, then confirm there is one record per recipient, all sharing the same run identifier, with the bad address marked "failed".

**Acceptance Scenarios**:

1. **Given** a newsletter is sent to N active subscribers, **When** the run completes, **Then** there are N records, one per recipient, all carrying the same run identifier.
2. **Given** some recipients in a run fail, **When** the run completes, **Then** the failed recipients' records show "failed" with the reason, and the successful ones show "sent".

---

### User Story 3 - Logging never breaks email (Priority: P2)

If the record cannot be saved (for example the database is briefly unavailable), the email is still sent and the feature behaves exactly as it does today. The logging problem is reported in the server logs only.

**Why this priority**: Emails like OTP codes are on the critical path for sign-in and registration; a record-keeping problem must never block them.

**Independent Test**: Make record-saving fail on purpose and send an OTP; confirm the email arrives, the request succeeds, and a logging error appears in the server logs.

**Acceptance Scenarios**:

1. **Given** saving the record fails, **When** an email is sent, **Then** the email is still delivered and the caller gets the same result as without logging.
2. **Given** saving the record is slow, **When** an email is sent, **Then** the caller is not noticeably delayed.

---

### User Story 4 - Admin browses the email logs in the dashboard (Priority: P2)

An admin opens a new "Email Logs" section in the dashboard and sees the email records in a data grid, newest first, with paging, sorting and column filters, so they can answer "did this member get their email?" without database access.

**Why this priority**: The records are only useful to the team if they can be looked up easily; this is the everyday way to use them.

**Independent Test**: Sign in as an admin, open Email Logs, filter by a recipient address that was just sent an OTP, and confirm the record appears with the right subject, kind and outcome. Sign in as a procurement user and confirm the section is not shown and the records cannot be fetched.

**Acceptance Scenarios**:

1. **Given** an admin in the dashboard, **When** they open Email Logs, **Then** they see a grid of email records, newest first, with paging.
2. **Given** the grid, **When** the admin types in the recipient, subject or kind column filters, picks an outcome (pending, sent, failed) from the dropdown, sets a from/to date range, or sorts by a column, **Then** the grid shows only records matching all active filters, in that order.
3. **Given** a from/to date range where the start date is after the end date, **When** the admin applies it, **Then** they see a clear message and the grid is not refreshed with that range.
4. **Given** the grid, **When** the admin clicks a row, **Then** a detail view shows the full record: to, cc, bcc and reply-to addresses, sender account, subject, kind, run identifier, attachment names and sizes, outcome, message identifier or failure reason, and start and finish times.
5. **Given** a procurement user or a non-admin, **When** they use the dashboard or call the records directly, **Then** the section is not shown and the records are refused.

---

### Edge Cases

- An email with several "to" addresses produces one record listing all of them (only bulk runs split into one record per recipient).
- The server stops in the middle of a send: the record shows that the attempt started but has no final outcome, so it can be found and looked into later.
- Email bodies can contain secrets (OTP codes) and personal data, so the message body and template variables are not stored; only the subject, the kind of email and the metadata are kept.
- Attachment contents (PDF letters) are not stored, only file names and sizes.
- A send attempt that fails before reaching the mail server (for example a missing sender account setting) is still recorded as "failed".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All outgoing email MUST go through one shared email-sending service; no feature may send email to the mail server any other way.
- **FR-002**: The service MUST keep one record per send attempt, with: recipients (to, cc, bcc), reply-to, sender account (default or info), subject, email kind (the template name, or a named kind when no template is used), attachment file names and sizes, start time, finish time, outcome, the mail server's message identifier when sent, and the failure reason when failed.
- **FR-003**: The outcome of a record MUST be one of: "pending" (attempt started), "sent" (mail server accepted it), or "failed".
- **FR-004**: Bulk sends MUST create one record per recipient, and all records of one run MUST share a run identifier.
- **FR-005**: The service MUST return the same result and raise the same errors to callers as the current sending code, so no calling feature changes behavior.
- **FR-006**: A failure to save or update a record MUST NOT stop the email from being sent or change what the caller receives; it MUST be written to the server logs.
- **FR-007**: Records MUST NOT contain message bodies, template variables, attachment contents or SMTP credentials.
- **FR-008**: Records MUST be searchable by recipient address, email kind, outcome, run identifier and time range.
- **FR-009**: Records MUST be removed automatically 12 months after they are created.
- **FR-010**: The dashboard MUST have an "Email Logs" section that lists the records in a data grid, newest first, with server-side paging, sorting and column filters, following the existing dashboard grid sections. Clicking a row MUST open a detail view of that record. Besides text filters on the recipient, subject and kind columns, the section MUST offer an outcome dropdown (all, pending, sent, failed) and a from/to date filter on the send time; all active filters combine.
- **FR-012**: The Email Logs section MUST be read-only: records cannot be edited, deleted or resent from the dashboard.
- **FR-011**: Only users with the admin role MUST be able to see the Email Logs section and read the records; procurement users and everyone else MUST be refused.

### Key Entities

- **Email Log**: One email send attempt. Holds the recipients, sender account, subject, email kind, attachment names and sizes, optional run identifier, outcome, mail server message identifier or failure reason, and start and finish times.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of emails the platform sends (in every flow listed in User Story 1) have a matching record.
- **SC-002**: For any member's email address, an admin can find out from the dashboard within 1 minute whether and when a given kind of email was sent to them, and whether it failed.
- **SC-003**: After a newsletter run, the number of records for that run equals the number of recipients, and the "sent" count matches the success total the run reports.
- **SC-004**: No existing email flow changes its behavior or its error handling (verified by running each flow before and after the change).
- **SC-005**: Sending an email takes no more than 50 ms longer on average than before.

## Assumptions

- Scope is the server-side service, the stored records, and an admin-only dashboard section to browse them.
- Message bodies are not stored, for privacy (OTP codes, personal data) and size (newsletters). If the team needs to see exactly what was sent, the template name and send time identify the template used.
- 12 months retention is a reasonable default for operational email records and can be changed later.
- "Sent" means the mail server accepted the email; delivery to the recipient's inbox, bounces and opens are not tracked.
- Existing records-keeping conventions (like the existing change log) are followed, and existing data is not migrated: logging starts when the feature ships.
