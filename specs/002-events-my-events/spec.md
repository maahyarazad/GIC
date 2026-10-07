# Feature Specification: Event Card Layout & My Events

**Feature Branch**: `002-events-my-events`

**Created**: 2026-10-06

**Status**: Draft

**Input**: User description: "In the Events inside the dashboard update the aspect ratio of each event card to 16:9 and also move the date to the left of the card - add a section to Events and name it My Events where shows the registered records and if the data is being fetched from SERVICES_SERVER_ORIGIN_DEV OR PROD add the proper end point to fetch the data and the QR code. The service is running, you can send requests to test it."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See my registrations and their QR codes (Priority: P1)

A signed-in member opens Dashboard → Events and sees a **My Events** section listing every registration they made for a GIC event (newest event first). Each entry shows the event title, date, location, the registration reference and when they registered. They can open the entry's QR code (the entry pass checked at the door) and download it.

**Why this priority**: Members currently have no way to find their registration or entry QR inside GIC; they depend on the confirmation email.

**Independent Test**: Sign in as a member who registered for a GIC event on the services platform; open Events; the registration appears under My Events; "Show QR" displays the QR image and "Download" saves it as a PNG.

**Acceptance Scenarios**:

1. **Given** a member with GIC event registrations, **When** they open Events, **Then** My Events lists each registration (one entry per registration record, even if several are for the same event) with title, date, reference and registered-on date.
2. **Given** a member with no GIC registrations, **When** they open Events, **Then** My Events shows "You haven't registered for any events yet." and the rest of the page works normally.
3. **Given** a listed registration whose QR exists, **When** the member clicks "Show QR", **Then** a dialog shows the QR image with the reference and a Download button.
4. **Given** a registration whose QR file does not exist on the services platform, **When** the member clicks "Show QR", **Then** the dialog says the QR code is not available yet, without an error toast.
5. **Given** two members, **When** member A requests the QR for member B's reference (e.g. by editing the request), **Then** the request is refused (404) and no image is returned.
6. **Given** the services platform is unreachable, **When** the member opens Events, **Then** My Events shows an inline error with a Retry action, and the Upcoming/Past groups still render if they loaded.

---

### User Story 2 - 16:9 event cards with the date on the left (Priority: P2)

Every event card in the Events tab (My Events, Upcoming, Past) has a 16:9 shape, and the event date is shown as a calendar block (day, month, year stacked) docked on the left side of the card instead of a small badge in the top-left corner.

**Why this priority**: Visual refresh of an existing view; low risk; benefits from the shared card built for Story 1.

**Independent Test**: Open Events at desktop, tablet and phone widths; every card's width:height is 16:9; each dated card shows the date block on its left edge; undated cards show no block and the title uses the full width.

**Acceptance Scenarios**:

1. **Given** any event card at any breakpoint, **When** it renders, **Then** its outer box keeps a 16:9 ratio (no fixed min-height stretching it).
2. **Given** an event with a date, **When** the card renders, **Then** the date block sits on the left, full card height, readable over image, video or GIC-logo fallback backgrounds.
3. **Given** a long title, **When** the card renders, **Then** the title is clamped (ellipsis) instead of overflowing the 16:9 box.
4. **Given** the Upcoming badge or the blurred logo fallback from feature 001, **When** cards render, **Then** both still behave as before.

### Edge Cases

- Member's email in GIC differs only in letter case from the email on the registration → still matched.
- Registration for an event that is no longer a GIC event (config removed/archived, or a non-GIC event) → not shown in My Events.
- Registration reference containing unexpected characters in the QR request → rejected with 400 before any upstream call.
- Paid events: payment status is shown when the services platform reports one; the QR may be missing until payment completes (Scenario 1.4).
- Session token without `user_profile` (older token shapes) → identity resolved from the user record, not the token.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Events tab MUST show a "My Events" section above "Upcoming Events" and "Past Events" for all roles that can see Events.
- **FR-002**: My Events MUST list only registrations whose email equals (case-insensitively) the signed-in user's account email AND whose event is a GIC event published by the services platform.
- **FR-003**: Each entry MUST show event title, event date (and time/location when present), registration reference, registered-on date, and payment status when present.
- **FR-004**: Entries MUST be ordered by event date descending (undated last), then registered-on descending.
- **FR-005**: The QR code MUST be retrievable only for a registration owned by the signed-in user; the event is taken from the stored registration, never from the client.
- **FR-006**: The QR dialog MUST offer a PNG download named `<reference>.png`.
- **FR-007**: All services-platform calls MUST go through the GIC server, which picks the DEV or PROD services origin by environment and authenticates with the external access token; the browser never calls the services platform's API directly.
- **FR-008**: Every event card in the Events tab MUST have a 16:9 aspect ratio at all breakpoints.
- **FR-009**: The event date MUST appear as a calendar block on the left side of the card.
- **FR-010**: My Events failures MUST NOT block rendering of Upcoming/Past events, and vice versa.

### Key Entities

- **My Event Registration**: one registration record of the user for a GIC event — reference, event (page slug, title, date, time, location, image), attendee name, registered-on, payment status.
- **Event QR**: PNG image identified by (event page, reference), stored on the services platform.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A member can find their registration and display its QR in at most 2 clicks from the Dashboard Events tab.
- **SC-002**: 0 cases of a member retrieving another member's registration or QR.
- **SC-003**: My Events loads in under 2 seconds when the services platform responds normally.
- **SC-004**: 100% of event cards measure 16:9 (±1px) at 375px, 768px, 1280px and 1920px viewport widths.

## Assumptions

- "Move the date to the left of the card" means a vertical date block docked on the card's left edge (replacing the top-left badge). Confirm with `/speckit-clarify` if a date column *outside* the card was meant.
- My Events is a section inside the existing Events tab, not a new Dashboard tab.
- Registrations are made on the services platform (existing SSO flow); this feature only reads them.
- The services platform's existing endpoints (`/api/registration`, `/api/registration-config`, `/api/qr`) are used as-is; no change to the services repository is required.
- A member has at most ~100 GIC registrations; no pagination UI is needed.
