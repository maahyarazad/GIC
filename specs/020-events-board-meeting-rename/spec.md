# Feature Specification: Board Meetings Wording and Blurred Rows for Visitors on the Events Page

**Feature Branch**: `020-events-board-meeting-rename`

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: "in the EventsPage; rename every Event word to Board meeting and also make the event rows blurry for non logged user"

## Context

The public Events page (`/events`) lists upcoming and past club gatherings as rows (cards). The page calls them "Events" throughout: the hero title, the section labels and headings, the type line on each row ("Upcoming · Members Event"), the empty-state message and the error message. These gatherings are board meetings, and the page should say so.

Today any visitor can read every row's details: city, date, title, description and status. Visitors should still see that the page lists rows, as a teaser, but board meeting details should reach signed-in members only.

## Clarifications

### Session 2026-10-23

- Q: Should visitors who aren't signed in only see the real board meeting details blurred, or should the page not send them those details at all (showing blurred placeholder rows instead)? → A: B. Send visitors no real details. They see generic placeholder rows, blurred, and real details reach signed-in members only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The page talks about Board Meetings, not Events (Priority: P1)

A visitor or member opens the Events page. Every piece of wording that said "Event" or "Events" now says "Board Meeting" or "Board Meetings". This covers the hero, the section labels and headings, the type line on each row, the empty state, and any message the page shows.

**Why this priority**: It is the core wording change, it applies to everyone who opens the page, and it can ship on its own.

**Independent Test**: Open `/events` signed out and signed in. Search the visible page text and every message the page can show for "event" (any case). It appears nowhere, and "Board Meeting(s)" appears where it used to be.

**Acceptance Scenarios**:

1. **Given** any user opens the Events page, **When** the hero renders, **Then** its title reads "Board Meetings".
2. **Given** the upcoming section, **When** it renders, **Then** its label reads "Board Meetings & Gatherings" and its heading reads "Upcoming Board Meetings".
3. **Given** the past section is shown, **When** it renders, **Then** its heading reads "Past Board Meetings".
4. **Given** a row, **When** it renders, **Then** its type line reads "Upcoming · Members Board Meeting" or "Past · Members Board Meeting".
5. **Given** a signed-in member and no upcoming board meetings, **When** the page finishes loading, **Then** the empty message reads "No upcoming board meetings are scheduled yet."
6. **Given** loading the list fails, **When** the error message appears, **Then** it reads "Failed to fetch board meetings".
7. **Given** a signed-in member confirms attendance from this page, **When** the confirmation dialog or any resulting message appears (already attending, fully booked), **Then** it says "board meeting" instead of "event".

---

### User Story 2 - Visitors see blurred placeholder rows (Priority: P1)

A visitor who is not signed in opens the Events page. The hero, section headings and "Request Access" button are clear. Below them the visitor sees blurred rows, so they can tell the page lists board meetings, but these rows are generic placeholders. No real board meeting detail (city, date, title, description, status) reaches the visitor's browser, so none can be recovered from the page source or network traffic. Clicking a blurred row takes the visitor to the Contact form, as today. A signed-in member sees the real rows, clear.

**Why this priority**: Equal to Story 1. The user asked for it, and it makes board meeting details members-only.

**Independent Test**: Open `/events` signed out. The rows are blurred, and neither the page source nor the network responses contain any real board meeting's title, date, city or description. Sign in and reload: the real rows show clear.

**Acceptance Scenarios**:

1. **Given** a visitor who is not signed in, **When** the page loads, **Then** blurred placeholder rows are shown in place of real board meetings.
2. **Given** a visitor, **When** the page loads, **Then** the browser receives no real board meeting details from any source.
3. **Given** a visitor, **When** the page loads, **Then** the hero, section labels, headings and "Request Access" button are not blurred.
4. **Given** a visitor, **When** they click a blurred row, **Then** they are taken to the Contact form with the name field focused, as today.
5. **Given** a visitor, **When** they try to select a blurred row's text or move through it with a screen reader, **Then** no placeholder text is exposed to them.
6. **Given** a signed-in member, **When** the page loads, **Then** the real rows show clear and behave as they do today.
7. **Given** sign-in status is still being determined, **When** the page first appears, **Then** neither real details nor clear rows are shown until it is known that the user is a signed-in member.
8. **Given** a member signs out while on the page, **When** the page updates, **Then** the real rows are removed and replaced with blurred placeholder rows.

---

### Edge Cases

- A board meeting's title or description entered by an administrator contains the word "event": it is shown to members as entered. The rename covers the page's own wording, not stored content.
- There are no real board meetings: visitors still see the same blurred placeholder rows, so the page reveals nothing about how many board meetings exist. Members see the empty-state message.
- Loading fails for a visitor: nothing needs loading for visitors, so no error message is shown to them.
- Narrow screens: the blurred rows keep the normal row layout at every width.
- A visitor who has reduced motion or high contrast turned on: the rows are still blurred, and no animated transition is needed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Events page MUST replace every visible occurrence of "Event" or "Events" in its own wording with "Board Meeting" or "Board Meetings", keeping the original case style and singular or plural form.
- **FR-002**: The wording change MUST cover the hero title, section labels, section headings, each row's type line, the empty-state message, the load-error message, and the attendance confirmation dialog and messages shown from this page.
- **FR-003**: Board meeting titles, descriptions and other content entered by administrators MUST NOT be changed.
- **FR-004**: For a visitor who is not signed in, the page MUST show blurred placeholder rows instead of real board meetings.
- **FR-005**: No real board meeting detail (title, description, date, time, city, attendance or capacity status) MUST be delivered to a visitor who is not signed in, whether in the page, in its source or in any response the visitor's browser receives.
- **FR-006**: Placeholder rows MUST contain only generic text that reveals nothing about real board meetings, including how many exist.
- **FR-006a**: Visitors MUST see exactly 3 placeholder rows under "Upcoming Board Meetings"; the Past section and the empty-state message MUST be hidden for visitors.
- **FR-007**: Placeholder row text MUST NOT be selectable or announced by assistive technology.
- **FR-008**: The hero, section labels, headings and "Request Access" button MUST NOT be blurred.
- **FR-009**: Clicking a blurred row MUST take the visitor to the Contact form with the name field focused, as today.
- **FR-010**: For a signed-in member, the real rows MUST show clear and behave as they do today.
- **FR-011**: Real details and clear rows MUST NOT appear before it is known that the user is a signed-in member.
- **FR-012**: When a member signs out on the page, the real rows MUST be removed and replaced with blurred placeholder rows without a reload.
- **FR-013**: The page address (`/events`), the navbar link and the dashboard's own wording MUST stay unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the Events page, signed out and signed in, the word "event" (any case) appears 0 times in the page's own visible wording and messages.
- **SC-002**: When signed out, inspecting the page source and every network response finds 0 real board meeting titles, dates, cities or descriptions.
- **SC-003**: For a signed-in member, 0 rows are blurred and every real board meeting is listed.
- **SC-004**: A visitor can still reach the Contact form from a row in 1 click.
- **SC-005**: Across 10 reloads of the page while signed out, no real detail or clear row ever appears, even briefly.

## Assumptions

- "EventsPage" means the public `/events` page only. The navbar link label, the page address, the dashboard's Events section and emails are out of scope and keep their current wording.
- The shared attendance dialog and messages also appear in the dashboard. They change only when shown from the Events page, and the dashboard keeps "event".
- The Events page is the only user of the publicly available board meeting list, so it can stop being served to visitors without affecting other pages.
- The existing "Members Only · By Invitation" tag and "Request Access" button are enough to tell visitors why rows are blurred, so no new message or overlay is added.
- Placeholder layout (3 upcoming rows, Past section hidden) was the recommended default for a clarification question that was not answered before planning; change FR-006a if a different layout is wanted.
- "Board Meeting" is used in title case in headings and labels and in lower case in sentences ("No upcoming board meetings…").
