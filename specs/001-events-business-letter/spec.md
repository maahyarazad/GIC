# Feature Specification: Event Categories & Business Letter Requests

**Feature Branch**: `001-events-business-letter`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "In the event section categorize the events into two categories A) past events and B) future events and change the default image to the GIC logo and make it 20% blurry. Add another section to the Dashboard for all roles and name it Request a Business Letter; in this section they can submit their request by filling the form and also can see their past requests and download it. Upon request submission the new request should be sent to the four GIC webmail allow-list addresses, using an email template based on the provided OTP template, delivered as an HTML file."

## Clarifications

### Session 2026-10-06

- Q: Should the form ask who the letter is addressed to (name and organisation)? → A: No. The "Addressed to" and "Organisation" fields are removed from the form; only the optional address remains.
- Q: Which letter types can members request? → A: Business Recommendations and Partner Recommendations only (no "Other").

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit a business letter request (Priority: P1)

A signed-in club member (any role: member, procurement, admin) opens the Dashboard, chooses "Request a Business Letter", fills in a short form describing the letter they need (type of letter, who it is addressed to, purpose, date needed by), and submits it. The GIC leadership team immediately receives an email with all request details so they can prepare the letter.

**Why this priority**: This is the new capability with direct business value — members currently have no in-app way to ask GIC for a business letter, and the leadership team needs to be notified to act on it.

**Independent Test**: Sign in as a member, submit the form, and confirm (a) a success confirmation with a reference number is shown and (b) each of the four GIC recipients receives the notification email containing the request details.

**Acceptance Scenarios**:

1. **Given** a signed-in user of any role, **When** they open the Dashboard menu, **Then** a "Request a Business Letter" entry is visible and opens the request section.
2. **Given** the request form is open, **When** the user submits it with all required fields filled, **Then** the request is saved, a confirmation with a unique reference number is shown, and the form is cleared.
3. **Given** a request was just submitted, **When** the notification is sent, **Then** ricco.deutscher@, philip.hoelzer@, jan.hussing@ and thomas.hochberger@german-industry-club.com each receive an email that shows the reference number, requester name, email, phone, company, letter type, addressee address, purpose, needed-by date and submission date.
4. **Given** the user leaves a required field empty or enters a needed-by date in the past, **When** they try to submit, **Then** the submission is blocked and the problem field is highlighted with a clear message.
5. **Given** the notification email fails to send, **When** the user submits, **Then** the request is still saved and shown in their history, and the failure is recorded for administrators; the user is not asked to resubmit.

---

### User Story 2 - View and download past requests (Priority: P2)

In the same section, the user sees a list of all business letter requests they have submitted (newest first) and can download any of them as a PDF document summarising the request.

**Why this priority**: Gives members a record of what they asked for and a document they can keep or forward; depends on Story 1 producing requests.

**Independent Test**: With at least two submitted requests, open the section, verify both appear newest first with reference, date, letter type and needed-by date, and download one — the PDF opens and matches the submitted details.

**Acceptance Scenarios**:

1. **Given** a user has submitted requests, **When** they open the section, **Then** their requests are listed newest first showing reference number, submission date, letter type and needed-by date.
2. **Given** a user has no requests yet, **When** they open the section, **Then** an empty-state message invites them to submit their first request.
3. **Given** a listed request, **When** the user clicks Download, **Then** a PDF named after the reference number is downloaded containing every submitted detail.
4. **Given** two different users, **When** each opens the section, **Then** each sees only their own requests and cannot download another user's request (even by guessing its identifier).

---

### User Story 3 - Events split into Upcoming and Past (Priority: P3)

In the Dashboard "Events" section, events are shown in two clearly labelled groups: **Upcoming Events** (future, including today) and **Past Events**. Events that have no image of their own show the GIC logo, slightly blurred, instead of the current third-party placeholder.

**Why this priority**: Improves readability and brand consistency of an existing section; low risk and independent of the business letter work.

**Independent Test**: Open Dashboard → Events with a mix of past and future events, verify the two groups, their ordering, and that an event without an image shows the blurred GIC logo.

**Acceptance Scenarios**:

1. **Given** events dated before today and on/after today, **When** the Events section loads, **Then** future/today events appear under "Upcoming Events" (soonest first) and earlier events appear under "Past Events" (most recent first).
2. **Given** one of the groups has no events, **When** the section loads, **Then** that group shows a short "No upcoming events" / "No past events" message instead of disappearing silently.
3. **Given** an event has no image, **When** its card renders, **Then** the GIC logo is shown as the card background at 20% blur, the logo remains recognisable, and the title and date stay sharp and readable.
4. **Given** an event has its own image or video, **When** its card renders, **Then** its own media is shown unblurred, exactly as today.
5. **Given** a past event card, **When** displayed, **Then** it does not carry the "upcoming" badge.

---

### Edge Cases

- Event with no date: shown under Upcoming Events (at the end), since it cannot be confirmed as past.
- Event happening today: counts as Upcoming for the whole day.
- User submits the same request twice by double-clicking: only one request is created (submit is disabled while sending).
- Very long free-text purpose: limited to 2,000 characters with a visible counter.
- User's profile has no phone/company: those fields are editable in the form and optional.
- Free-text containing HTML/script: displayed and emailed as plain text, never executed.
- Session expires while filling the form: user is asked to sign in again; nothing is half-saved.
- Email delivery partially fails (one recipient bounces): the remaining recipients still receive it; the request remains saved.

## Requirements *(mandatory)*

### Functional Requirements

**Events section**

- **FR-001**: The Dashboard Events section MUST display events in two labelled groups: "Upcoming Events" (event date today or later, or no date) and "Past Events" (event date before today).
- **FR-002**: Upcoming events MUST be ordered soonest first; past events MUST be ordered most recent first.
- **FR-003**: An empty group MUST show a short empty-state message.
- **FR-004**: When an event has no image of its own, its card MUST show the GIC logo as the background with a 20% blur effect; events with their own image or video MUST be unchanged.
- **FR-005**: Card titles and date badges MUST remain unblurred and legible over the blurred logo.
- **FR-006**: The existing "upcoming" badge behaviour (events within the next 30 days) MUST apply only to cards in the Upcoming group.

**Request a Business Letter section**

- **FR-007**: The Dashboard MUST show a "Request a Business Letter" menu entry for every role (member, procurement, admin).
- **FR-008**: The section MUST provide a request form with: letter type (Business Recommendations or Partner Recommendations), addressee address (optional), purpose/details (max 2,000 characters), needed-by date, preferred language (English or German), and the requester's contact details (name, email, phone, company) pre-filled from their profile.
- **FR-009**: The letter type MUST be one of the two listed types; no free-text "Other" type is offered.
- **FR-010**: The system MUST validate required fields and reject needed-by dates in the past, both in the form and on the server.
- **FR-011**: On successful submission the system MUST store the request linked to the signed-in user, assign a unique human-readable reference number, and show it to the user.
- **FR-012**: On successful submission the system MUST send one notification email to the four GIC recipients (ricco.deutscher, philip.hoelzer, jan.hussing, thomas.hochberger @german-industry-club.com) containing all request details, using a branded template derived from the existing OTP email design.
- **FR-013**: The recipient list MUST be maintained in one place on the server so it can be changed without touching the form.
- **FR-014**: The notification email MUST use the existing stored email template record `6ac4970fe31c56f3436780a0` (Business Letter Request, already created by GIC from the delivered HTML file). Admins keep editing its wording and layout in the existing Email Templates management, and changes apply to the next notification without a redeploy.
- **FR-014a**: If that template record cannot be found, the notification MUST be treated as failed (FR-015) and the cause logged. The request itself MUST still be saved.
- **FR-015**: A failure to send the notification MUST NOT lose the request; the request MUST record whether the notification was sent.
- **FR-016**: The section MUST list the signed-in user's own past requests, newest first, with reference number, submission date, letter type and needed-by date.
- **FR-017**: Each listed request MUST be downloadable as a PDF summarising every submitted detail, named after its reference number.
- **FR-018**: Users MUST only be able to list and download their own requests.
- **FR-019**: User-entered text MUST be treated as plain text in the page, the email and the PDF.

### Key Entities

- **Business Letter Request**: A member's request for a letter from GIC. Attributes: reference number, requesting user, requester contact snapshot (name, email, phone, company), letter type, addressee address (optional), purpose, needed-by date, preferred language, notification status, submission date.
- **Event** (existing, read-only): Has a title, date, optional image/video and registration page. Categorised as upcoming or past by its date.
- **Email Template** (existing): Editable HTML template with placeholders. The Business Letter Request template already exists as record `6ac4970fe31c56f3436780a0`; this feature reads it and does not create or modify it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A member can complete and submit a business letter request in under 3 minutes.
- **SC-002**: 100% of successfully submitted requests appear in the requester's history immediately after submission.
- **SC-003**: All four GIC recipients receive the notification within 2 minutes of submission under normal mail-server conditions.
- **SC-004**: 100% of downloaded request PDFs contain all details the user submitted.
- **SC-005**: Zero cases of a user seeing or downloading another user's request.
- **SC-006**: In the Events section, 100% of events are placed in the correct group relative to today's date, and every event without an image shows the GIC logo.

## Assumptions

- "Event section" refers to the Dashboard → Events section. The public Boardroom page is out of scope.
- "Download it" means downloading a PDF copy of the submitted request. Producing and uploading the final signed letter by GIC staff is out of scope for this feature (staff respond outside the app after receiving the email). Use `/speckit-clarify` if the issued letter itself should be downloadable.
- "20% blurry" is interpreted as a soft blur that keeps the logo recognisable; the exact visual strength is set in the plan.
- Events are categorised by calendar date in the viewer's local time.
- The four notification recipients are the same addresses currently allowed to use webmail; they are not shown to members.
- Admins see only their own requests in this section; an admin overview of all requests is out of scope.
- No confirmation email is sent to the requester; the on-screen confirmation and history entry serve that purpose.
- The stored template record `6ac4970fe31c56f3436780a0` exists in the production database and contains the placeholders defined for the Business Letter Request email (reference, requester, letter details, purpose, needed-by, submitted date, current year). Other environments (e.g. local development) need the same record, either copied with the same identifier or pointed to through configuration.
