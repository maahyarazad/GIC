# Feature Specification: Events – Direct Attendance Confirmation

**Feature Branch**: `004-events-direct-attendance`

**Created**: 2026-10-09

**Status**: Draft

**Builds on**: [003-board-meeting-requests](../003-board-meeting-requests/spec.md) (merged in PR #27)

**Input**: User description: "Events: Members (who already have an account) can confirm their attendance directly by clicking on or selecting the event and will receive confirmation immediately without needing approval. (A confirmation must also be sent again via email at the same time.) Change the boardroom naming to Events."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Member confirms attendance instantly (Priority: P1)

A signed-in member (any role) opens an upcoming event, either in Dashboard → Events or on the public Events page (formerly "Boardroom"), and confirms. The attendance is confirmed immediately. There is no pending state and no admin approval. An on-screen success message says the attendance is confirmed. At the same moment a confirmation email from info@german-industry-club.com goes to the member, and the GIC leadership is notified as before.

**Why this priority**: This is the change the client asked for. It replaces feature 003's request → approve → invite flow.

**Independent Test**: With one upcoming event that has free seats, sign in as a member, select the event and confirm. The member's attendance is stored as *Confirmed*. A success snackbar appears. The card shows *Attending*. The member receives the confirmation email and info@ (with the leadership CC) receives the notification.

**Acceptance Scenarios**:

1. **Given** an upcoming event with free seats that the member is not attending, **When** they select it and confirm, **Then** an attendance with status *Confirmed* is stored, a success snackbar "Your attendance is confirmed" appears, and the card shows an *Attending* badge.
2. **Given** a new confirmed attendance, **When** it is stored, **Then** a confirmation email with the event's title, date/time (GST), venue, location, description and reference is sent from info@ to the member at the same time.
3. **Given** a new confirmed attendance, **When** it is stored, **Then** the leadership notification is sent from info@ to info@ with the five leadership addresses in CC (as in feature 003, with the wording "attendance confirmed").
4. **Given** the email server fails, **When** the member confirms, **Then** the attendance is still confirmed and the snackbar still shows. Each email's failure is recorded and visible to admins, who can resend the confirmation.
5. **Given** an event the member already attends, **When** they select it again, **Then** nothing new is stored or sent and an info snackbar says they are already attending.
6. **Given** an event whose confirmed attendees equal its capacity, **When** a member who is not attending views it, **Then** the card shows *Fully booked*. Selecting it shows an info snackbar and stores nothing.
7. **Given** one seat left and two members confirming at the same moment, **Then** exactly one is confirmed and the other is told the event is fully booked.
8. **Given** a past event, **Then** it appears under *Past* and cannot be selected for attendance.
9. **Given** the member cancels the confirmation dialog, **Then** nothing is stored or sent.

---

### User Story 2 - "Boardroom" becomes "Events" everywhere users see it (Priority: P1)

Every user-facing "Boardroom" / "Board Meeting" label becomes "Events" / "Event": the public page and its URL, the main navigation link, the Dashboard admin section, the cards, the snackbars and the email templates.

**Why this priority**: The client requested it. It ships together with Story 1 because both touch the same screens and emails.

**Independent Test**: Browse the site as a visitor and as admin. Look at the navigation, the public page, the Dashboard menu and the emails. No "Boardroom" or "Board Meeting" wording remains. `/boardroom` redirects to `/events`.

**Acceptance Scenarios**:

1. **Given** a visitor, **When** they open the main navigation, **Then** the link reads "Events" and leads to `/events`.
2. **Given** an old link to `/boardroom`, **When** it is opened, **Then** the browser lands on `/events`.
3. **Given** a visitor (not signed in) on `/events`, **When** they select an upcoming event, **Then** they are sent to the Contact page with the *Full Name* field focused, so they can request access. The "Request Access" button also leads to Contact.
4. **Given** an admin, **When** they open the Dashboard, **Then** the admin section is titled "Manage Events" with the tabs *Events* and *Attendees*. An old `?tab=board_meetings` link opens it.
5. **Given** any of the three event emails, **Then** subjects and bodies say "event" instead of "board meeting".

---

### User Story 3 - Admin sees attendees (Priority: P2)

In Dashboard → Manage Events → Attendees, an admin sees every confirmed attendance, newest first and filterable by event. Each row shows the member's name, email and phone, the confirmation time, the reference and the delivery status of both emails. A failed confirmation email can be resent. The Events tab shows each event's confirmed count against its capacity.

**Why this priority**: Without approval, the admin's role becomes oversight. Members can confirm without it.

**Acceptance Scenarios**:

1. **Given** confirmed attendances, **When** the admin opens Attendees, **Then** they are listed with requester details, time, reference and email statuses. There are no Approve/Decline actions.
2. **Given** an attendance whose confirmation email failed, **When** the admin clicks *Resend confirmation*, **Then** the email is sent again and the status updates.
3. **Given** an event with confirmed attendees, **When** the admin lowers its capacity below the confirmed count, **Then** the change is refused with a field error.

### Edge Cases

- Double click or two tabs at once for the same member and event → exactly one attendance and one pair of emails.
- The event is deleted while the member has it open → "Event not found" and the list refreshes.
- The event is edited after confirmations → no automatic re-notification (unchanged from 003).
- Pending, approved and declined requests stored by feature 003 → migrated once (see Assumptions).
- HTML in names or event fields → escaped in emails (unchanged from 003).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Any signed-in user (user, admin, procurement) MUST be able to confirm attendance at an upcoming event that has a free seat, by selecting it and confirming. No admin approval is involved.
- **FR-002**: The confirmation MUST be shown to the member immediately (snackbar and *Attending* badge) in the same interaction.
- **FR-003**: On each new attendance the system MUST, at the same time, send a confirmation email to the member and the leadership notification (to info@, with the configured CC), both from info@german-industry-club.com.
- **FR-004**: The attendance MUST be stored and acknowledged regardless of email outcome. Each email's outcome MUST be recorded, and a failed confirmation email MUST be resendable by an admin.
- **FR-005**: The system MUST store at most one attendance per user per event.
- **FR-006**: The system MUST never confirm more attendees than an event's capacity, including under concurrent confirmations.
- **FR-007**: The approval workflow (pending/approved/declined statuses, approve/decline/invitation actions and endpoints) MUST be removed.
- **FR-008**: All user-facing "Boardroom" and "Board Meeting" wording MUST become "Events" / "Event". The public page MUST move to `/events` and `/boardroom` MUST redirect there.
- **FR-009**: Members MUST see the events they are attending in the Dashboard Events tab ("My Events").
- **FR-010**: Event management (create, edit, delete) and the attendee list MUST remain admin-only on both the server and the UI.
- **FR-011**: Existing 003 data MUST be migrated without loss. Events and email outcomes are kept.

### Key Entities

- **Event**: the former Board Meeting. It has a title, description, start date/time (GST), venue, location, image and capacity. It also tracks a count of confirmed seats.
- **Event Attendance**: the former Board Meeting Request. It has a reference, the event, the user, a requester snapshot, a status (*confirmed*, or *cancelled* for migrated declines) and email outcomes (leadership notification, confirmation).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A member confirms attendance in 2 interactions (select + confirm) and sees the confirmation in under 2 seconds.
- **SC-002**: The confirmation email is attempted within 1 minute of 100% of new attendances, and its outcome is recorded.
- **SC-003**: 0 events with more confirmed attendees than capacity.
- **SC-004**: 0 occurrences of "Boardroom" or "Board Meeting" in user-facing UI text, navigation or email templates.
- **SC-005**: 0 attendances requiring an admin action before the member is confirmed.

## Assumptions

- "Members (who already have an account)" means any signed-in user. Visitors who select an event are sent to the Contact page with the *Full Name* field focused (client decision, 2026-10-09).
- A confirmation dialog stays, retitled "Confirm attendance". "Directly" means without approval, and the dialog protects against accidental clicks that email the leadership.
- The leadership notification from 003 stays, reworded from "request" to "attendance confirmed".
- Members cannot cancel their own attendance in this feature. The confirmation email asks them to reply if they can no longer attend. Admin removal of an attendee is also out of scope.
- Migration of 003 data: *approved* becomes *confirmed* (already invited). *pending* becomes *confirmed* in request order while seats remain, and they receive the confirmation email. Pending requests beyond capacity, and *declined* requests, become *cancelled* and are reported to the admin. Past events are migrated without emails.
- The admin section is titled "Manage Events" rather than "Events", because admins also see the member "Events" tab.
