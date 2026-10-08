# Feature Specification: Board Meeting Requests & Local Events

**Feature Branch**: `003-board-meeting-requests`

**Created**: 2026-10-08

**Status**: Draft

**Input**: User description: "Implement The new events section business logic - any type of user role clicks on the event card will trigger a request and we store it in the database that this user is requested to join the board meeting and an email will send via info@german-industry-club.com and put const DEFAULT_RECIPIENTS = [ricco.deutscher@…, philip.hoelzer@…, jan.hussing@…, thomas.hochberger@…, office6@german-emirates-club.com] in the cc and user also get a receipt email that your request has been sent to board meeting and also triggers a snack bar notification on the application as a success - so remove all the requests that goes to services.german-emirates-club and implement the new business logic. Then there should be a new section for admin users so they can see the Board Meeting requests - and when they approve it the invitation email will trigger. This should be a local event table where admin can manage the events, isolated from services.german-emirates-club.com, so admin can modify, delete and create events (location, time and venue, and there will be no QR code) since the board meeting will be less than 10 people. SMTP_INFO_USER credentials are in .env."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Request to join a board meeting (Priority: P1)

A signed-in member (any role) opens Dashboard → Events, sees the upcoming board meetings as cards and clicks one. After confirming, a join request is stored, the GIC leadership is notified by email from info@german-industry-club.com, the member receives a receipt email, and a success snackbar appears. The card and the member's "My Requests" list show the request as *Pending*.

**Why this priority**: This is the core business flow that replaces the external services-platform registration.

**Independent Test**: With one meeting created directly in the database, sign in as a member, click the card, confirm; a request record exists, the success snackbar shows, the notification email (to info@ with the five leadership addresses in CC) and the receipt email are delivered.

**Acceptance Scenarios**:

1. **Given** an upcoming meeting the member has not requested, **When** they click its card and confirm, **Then** a request with status *Pending* is stored, a success snackbar "Your request has been sent to the board meeting" appears, and the card shows a *Requested* badge.
2. **Given** a new request, **When** it is stored, **Then** one email is sent from info@german-industry-club.com to info@german-industry-club.com with the five leadership addresses in CC, containing the requester's name, email, phone and the meeting's title, date/time, venue and location; replying goes to the requester.
3. **Given** a new request, **When** it is stored, **Then** the requester receives a receipt email from info@ confirming the request has been sent to the board meeting.
4. **Given** the email server fails, **When** the member requests, **Then** the request is still stored and the success snackbar still shows; the failure is recorded on the request and visible to admins.
5. **Given** a meeting the member already requested, **When** they click the card again, **Then** no new request or email is created and an info snackbar shows the existing status.
6. **Given** a meeting whose start time has passed, **When** the member views it, **Then** it appears under *Past* and cannot be requested.
7. **Given** the member clicks the card and cancels the confirmation, **Then** nothing is stored or sent.

---

### User Story 2 - Admin manages board meetings (Priority: P1)

An admin opens Dashboard → Board Meetings and creates, edits and deletes meetings with a title, date, time, venue, location, optional description, optional image and a seat capacity (default 10). Meetings are stored in GIC's own database; nothing is read from or written to services.german-emirates-club.com, and no QR codes exist.

**Why this priority**: Without locally managed meetings there is nothing for members to request (Story 1 depends on data this story creates).

**Independent Test**: Sign in as admin, create a meeting, edit its venue, see the change on the member Events tab, delete it and see it disappear.

**Acceptance Scenarios**:

1. **Given** an admin, **When** they submit the meeting form with title, date, time, venue and location, **Then** the meeting is saved and appears in the admin list and in members' Events tab.
2. **Given** missing or invalid fields (empty venue, bad date/time, capacity outside 1–50), **When** the admin submits, **Then** field errors are shown and nothing is saved.
3. **Given** an existing meeting, **When** the admin edits it, **Then** members see the updated details on next load.
4. **Given** a meeting with requests, **When** the admin deletes it, **Then** a confirmation states how many requests will be removed, and after confirming the meeting and its requests are deleted.
5. **Given** a non-admin user, **When** they call any management endpoint, **Then** the request is refused (403) and the menu item is not shown.

---

### User Story 3 - Admin approves or declines requests (Priority: P2)

In Dashboard → Board Meetings → Requests, an admin sees every request (newest first, filterable by meeting and status) with requester details, request time, status and email delivery status. Approving a request sends the member an invitation email from info@ with the meeting's title, date/time, venue and location. Declining marks the request declined.

**Why this priority**: Completes the loop; requests are still captured and leadership notified without it.

**Independent Test**: With one pending request, approve it as admin; the status becomes *Approved*, the member receives the invitation email, and the member's My Requests shows *Approved*.

**Acceptance Scenarios**:

1. **Given** a pending request, **When** the admin approves it, **Then** its status becomes *Approved*, the approver and time are recorded, and the invitation email is sent to the requester.
2. **Given** a pending request, **When** the admin declines it, **Then** its status becomes *Declined* and no email is sent.
3. **Given** a meeting whose approved count equals its capacity, **When** the admin approves another request, **Then** approval is refused with "Meeting is full" until capacity is raised.
4. **Given** an approved request whose invitation email failed, **When** the admin clicks *Resend invitation*, **Then** the invitation is sent again and the delivery status updates.
5. **Given** a request that is no longer pending, **When** an admin tries to approve or decline it, **Then** the action is refused (409) and the list refreshes.

### Edge Cases

- Two clicks in quick succession on the same card → exactly one request and one pair of emails.
- Meeting deleted while a member has the Events tab open → requesting returns "Meeting not found" and the list refreshes.
- Meeting edited after invitations were sent → no automatic re-notification (admin informs attendees).
- Member's account email changes after requesting → emails use the email captured on the request.
- Requester name or meeting fields containing HTML → rendered as text in emails, never as markup.
- Request made by an admin for themselves → treated like any member's request.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Events in the Dashboard Events tab and on the Boardroom page MUST come only from GIC's own database; no GIC client or server code path may call services.german-emirates-club.com (API, SSO redirect, uploads or QR).
- **FR-002**: Any signed-in user (user, admin, procurement) MUST be able to request to join an upcoming meeting by clicking its card and confirming.
- **FR-003**: The system MUST store at most one request per user per meeting, capturing the requester's name, email and phone (from their account) at request time.
- **FR-004**: On a new request the system MUST send, from info@german-industry-club.com, a notification to info@german-industry-club.com with the five configured leadership addresses in CC, and a receipt email to the requester.
- **FR-005**: The request MUST be stored and acknowledged with a success snackbar regardless of email outcome; each email's delivery outcome MUST be recorded on the request.
- **FR-006**: Members MUST see their own requests and each one's status (Pending / Approved / Declined) in the Events tab.
- **FR-007**: Admins MUST be able to create, edit and delete meetings with title, date, time, venue, location, optional description, optional image and capacity.
- **FR-008**: Admins MUST be able to list, filter, approve and decline requests; approval MUST send an invitation email from info@ to the requester; a failed invitation MUST be resendable.
- **FR-009**: Approval MUST be refused when the meeting's approved count has reached its capacity.
- **FR-010**: Meeting management and request decisions MUST be restricted to the admin role on both the server and the UI.
- **FR-011**: Meetings MUST NOT generate or display QR codes.
- **FR-012**: Meeting times MUST be entered and displayed in Gulf Standard Time (Asia/Dubai).
- **FR-013**: All user-supplied values inserted into emails MUST be HTML-escaped.

### Key Entities

- **Board Meeting**: a locally managed event — title, description, start date/time, venue, location, image, capacity, created/updated by.
- **Board Meeting Request**: one user's request to join one meeting — reference, requester snapshot, status (pending / approved / declined), decision (who, when), email delivery outcomes (leadership notification, receipt, invitation).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A member can request to join a meeting in 2 clicks (card + confirm) from the Events tab and sees confirmation in under 2 seconds.
- **SC-002**: 100% of stored requests have a recorded outcome for both the leadership notification and the receipt email within 1 minute.
- **SC-003**: An admin can create a meeting in under 1 minute and approve a request in 1 click plus confirmation.
- **SC-004**: 0 network requests from GIC (browser or server) to services.german-emirates-club.com while using the Events tab, the Boardroom page or the Board Meetings admin section.
- **SC-005**: 0 duplicate requests per user per meeting, including under rapid repeated clicks.

## Assumptions

- "Admin users" means the `admin` role only; `procurement` users can request but cannot manage meetings or decide requests.
- The notification "to" address is info@german-industry-club.com itself, with the five leadership addresses in CC.
- A confirmation dialog before sending the request is acceptable (it prevents accidental clicks emailing the leadership).
- Declining sends no email; the member sees *Declined* in My Requests.
- Existing services-platform events and registrations are not migrated; admins create meetings fresh. The My Events (registrations + QR) section from feature 002 is removed and replaced by My Requests.
- The Boardroom page shows meetings only to signed-in users (its lock overlay already covers it for visitors) and uses the same request flow.
- Meeting images are optional and are chosen from GIC's own File Management uploads (served from `/uploads`); without an image the card shows the GIC logo fallback.
- Email bodies use templates stored in GIC's email templates collection so admins can adjust wording.
