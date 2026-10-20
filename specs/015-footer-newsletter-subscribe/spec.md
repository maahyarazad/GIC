# Feature Specification: Footer Newsletter Subscription and Admin-Added Subscribers

**Feature Branch**: `015-footer-newsletter-subscribe`

**Created**: 2026-10-20

**Status**: Draft

**Input**: User description: "Add newsletter subscription to the footer; it is a public POST endpoint, so protect it with a rate limiter. In the Newsletter Subscribers panel add a button that opens a dashboard modal so an admin can add new external users. Add a column showing whether a subscriber is a user from the database (internal) or not (external)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor subscribes from the footer (Priority: P1)

Any visitor enters their email address in the footer's Newsletter box and subscribes. They see a clear confirmation, or a clear message if the email is invalid, already subscribed, or they have tried too often.

**Why this priority**: It is the public entry point for growing the subscriber list.

**Independent Test**: Open any public page, enter a valid email in the footer, submit, and confirm the success message and that the address appears in the admin subscriber list.

**Acceptance Scenarios**:

1. **Given** a visitor on any page, **When** they submit a valid new email in the footer, **Then** they are subscribed and see a success message, and the field is cleared.
2. **Given** an invalid email, **When** they submit, **Then** they see "Invalid Email" and nothing is sent.
3. **Given** an email that is already subscribed and active, **When** submitted, **Then** the visitor is told it is already subscribed.
4. **Given** a previously unsubscribed email, **When** submitted, **Then** the subscription is re-activated.

---

### User Story 2 - Subscription cannot be abused (Priority: P1)

The public subscription action limits how often one visitor can use it, so scripts cannot flood the list or the mail system. A visitor who exceeds the limit sees a friendly "try again later" message; normal visitors are never affected.

**Why this priority**: The endpoint is public, so abuse protection is part of making it safe to expose.

**Independent Test**: Submit many subscription attempts in quick succession from one address and confirm the later ones are refused with a clear message, while a different visitor is unaffected.

**Acceptance Scenarios**:

1. **Given** a visitor who has reached the attempt limit, **When** they submit again, **Then** the request is refused with a "too many attempts, try again later" message and nothing is stored.
2. **Given** the limit window has passed, **When** they submit again, **Then** it works normally.
3. **Given** one visitor is limited, **When** a different visitor submits, **Then** the second visitor is not affected.

---

### User Story 3 - Admin adds external subscribers (Priority: P2)

In the Newsletter Subscribers panel an admin clicks "Add subscribers", enters one or more email addresses in a dialog, and confirms. The addresses are added as active subscribers (re-activated if they were inactive), and the admin sees how many were added, re-activated, skipped as duplicates, or invalid.

**Why this priority**: Lets the Club import contacts who are not registered users.

**Independent Test**: As admin, add two new emails and one invalid one; confirm the summary and that the new rows appear in the list.

**Acceptance Scenarios**:

1. **Given** the admin opens the dialog, **When** they enter valid new emails and confirm, **Then** they are added as active subscribers and the list refreshes.
2. **Given** a mix of valid, invalid and already-subscribed emails, **When** confirmed, **Then** valid ones are added and the dialog reports which were skipped and why.
3. **Given** a non-admin user, **When** they try to add or manage subscribers, **Then** they are refused.

---

### User Story 4 - Admin sees Internal vs External subscribers (Priority: P2)

The subscribers list has a new "Type" column. A subscriber whose email belongs to a registered user is shown as **Internal**; every other subscriber is **External**.

**Why this priority**: Helps the admin understand the audience and verify added contacts.

**Independent Test**: Subscribe one email that belongs to a registered user and one that does not; confirm Internal and External respectively.

**Acceptance Scenarios**:

1. **Given** a subscriber whose email matches a registered user (ignoring letter case), **When** the list loads, **Then** its Type is "Internal".
2. **Given** a subscriber with no matching user, **Then** its Type is "External".
3. **Given** an external subscriber later registers as a user, **When** the list loads, **Then** it now shows "Internal" without any manual change.

---

### Edge Cases

- Emails are treated case-insensitively and trimmed; very long values and obviously malformed addresses are rejected.
- The dialog accepts several emails separated by commas, spaces or new lines; duplicates within the entry are counted once.
- A very large paste is capped (maximum number per request) with a clear message.
- Visitors behind a shared network address must not be locked out by each other's activity (limits are per visitor address as seen by the server).
- The footer message must not expose other subscribers' details.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The site footer MUST show a Newsletter subscription box (email field and submit button) on every public page.
- **FR-002**: Submitting a valid email MUST create an active subscription, or re-activate an inactive one, and show a success message.
- **FR-003**: Invalid emails MUST be rejected with a clear message before or at submission.
- **FR-004**: The public subscription action MUST be rate limited per visitor, refusing excess attempts with a clear "try again later" message and storing nothing.
- **FR-005**: The Newsletter Subscribers panel MUST have an "Add subscribers" button that opens a dashboard dialog.
- **FR-006**: The dialog MUST accept one or more emails and, on confirm, add them as active subscribers, re-activating inactive ones, and report added / re-activated / duplicate / invalid counts.
- **FR-007**: Adding subscribers MUST be available to admins only.
- **FR-008**: The subscribers list MUST include a Type column showing "Internal" when the email matches a registered user (case-insensitive) and "External" otherwise.
- **FR-009**: Viewing, changing and deleting the subscriber list MUST be restricted to admins (these actions currently have no access check).
- **FR-010**: The Type value MUST be derived at read time, not stored, so it stays correct when users register.

### Key Entities

- **Newsletter subscriber**: An email address with an active flag and timestamps.
- **User**: A registered account identified by email; used only to decide Internal vs External.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A visitor can subscribe from the footer in under 15 seconds.
- **SC-002**: More than the allowed number of attempts in the limit window from one visitor are refused 100% of the time, and a different visitor is unaffected.
- **SC-003**: An admin can add 20 emails in a single action and see the outcome summary immediately.
- **SC-004**: 100% of subscribers whose email matches a registered user display Internal; all others display External.
- **SC-005**: 100% of unauthenticated or non-admin attempts to list, change, delete or add subscribers are refused.

## Assumptions

- The footer subscription UI already exists in the codebase but is switched off; this feature turns it on.
- "Admin" means the existing admin role used elsewhere in the dashboard.
- The "already subscribed" message for the public footer is acceptable as today.
- Admin-added subscribers receive no automatic welcome email.
- Sorting or filtering by Type is out of scope; it is display-only.
- The public self-service subscription toggle by email (used by member profiles) is out of scope here, but is noted as a follow-up.
