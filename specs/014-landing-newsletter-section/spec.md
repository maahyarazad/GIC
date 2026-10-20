# Feature Specification: Landing Page Newsletter Section

**Feature Branch**: `014-landing-newsletter-section`

**Created**: 2026-10-20

**Status**: Draft

**Input**: User description: "Add a new section in the Landing page, driven by the website blueprint JSON (section named Newsletter), listing newsletter articles as cards like the Blog. Only authorized users can view the newsletters; unauthorized users see a blurred view, and clicking it takes them to the Contact / Membership Application page."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Member browses newsletters on the landing page (Priority: P1)

A signed-in member scrolls the landing page and finds a "Newsletter" section showing cards for the latest newsletters (title, date, short preview) styled like the Blog cards. Clicking a card opens that newsletter.

**Why this priority**: Delivers the feature's core value to the audience it is meant for.

**Independent Test**: Sign in, open the landing page, confirm cards appear and a card opens the full newsletter.

**Acceptance Scenarios**:

1. **Given** a signed-in user and at least one sent newsletter, **When** they open the landing page, **Then** the Newsletter section shows one card per newsletter, newest first, in the same visual style as Blog cards.
2. **Given** a signed-in user, **When** they click a card, **Then** the full newsletter is displayed.
3. **Given** there are no sent newsletters, **When** a user opens the landing page, **Then** the section shows a friendly empty message (or is hidden).

---

### User Story 2 - Visitor sees a blurred teaser and is invited to apply (Priority: P1)

A visitor who is not signed in sees the same section but the cards are blurred and their readable content is not available to them. Clicking anywhere on a blurred card takes them to the Contact page's Membership Application.

**Why this priority**: Core of the access model and the membership-conversion goal.

**Independent Test**: Open the landing page logged out; confirm cards are blurred, the newsletter text cannot be read (including via page source or network inspection), and a click lands on the Membership Application.

**Acceptance Scenarios**:

1. **Given** a visitor who is not signed in, **When** they open the landing page, **Then** the Newsletter section shows blurred cards with a clear prompt that membership is required.
2. **Given** the blurred cards, **When** the visitor clicks a card, **Then** they are taken to the Contact page at the Membership Application.
3. **Given** a visitor, **When** they inspect the page or network responses, **Then** no newsletter body content is present.

---

### User Story 3 - Section content is controlled from the website blueprint (Priority: P2)

The site owner edits the website blueprint to add a "Newsletter" entry (heading, intro text, number of cards, etc.). The landing page section reflects those values and is shown only when the entry exists.

**Why this priority**: Matches how other landing sections are managed, but the section works with sensible defaults first.

**Independent Test**: Add/remove the Newsletter entry in the blueprint and confirm the section appears/disappears and shows the configured text.

**Acceptance Scenarios**:

1. **Given** the blueprint has a Newsletter entry, **When** the landing page loads, **Then** the section shows the configured heading and intro.
2. **Given** the blueprint has no Newsletter entry, **When** the landing page loads, **Then** no Newsletter section is shown.

---

### Edge Cases

- Newsletters that were never sent (drafts) are never shown to anyone on the landing page.
- A session that expires while on the page: subsequent clicks behave as for a visitor.
- Very long titles are truncated cleanly on cards; the section is usable at phone width.
- The newsletter list cannot be loaded: the section shows a short, non-technical message and the rest of the landing page is unaffected.
- A newsletter opened by a visitor via a direct link is not shown; they are sent to login/membership application.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The landing page MUST include a Newsletter section whose presence and text (heading, intro, card count) come from the website blueprint entry named "Newsletter".
- **FR-002**: The section MUST list sent newsletters as cards, newest first, visually consistent with the Blog cards.
- **FR-003**: Signed-in users MUST be able to open a card and read the full newsletter.
- **FR-004**: Visitors who are not signed in MUST see the cards blurred, with a prompt indicating membership is required.
- **FR-005**: Newsletter body content MUST NOT be delivered to visitors who are not signed in; blurring MUST be presentation only, not the sole protection. Only non-sensitive teaser information (title and date) may be shown.
- **FR-006**: Clicking a blurred card MUST take the visitor to the Contact page's Membership Application.
- **FR-007**: Draft (unsent) newsletters MUST NOT appear in the section.
- **FR-008**: A failure to load newsletters MUST NOT break the rest of the landing page.
- **FR-009**: The section MUST be responsive and keyboard accessible (cards focusable and activatable by keyboard).

### Key Entities

- **Newsletter article**: A published newsletter with title, subject, send date and body.
- **Newsletter section settings** (blueprint): heading, intro text, maximum number of cards shown.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A signed-in user can go from landing page to reading a newsletter in one click.
- **SC-002**: 100% of newsletter body content is absent from responses and page content served to visitors who are not signed in.
- **SC-003**: A visitor reaches the Membership Application in one click from the Newsletter section.
- **SC-004**: The landing page remains usable (other sections render) in 100% of cases where the newsletter list fails to load.
- **SC-005**: The section is usable at phone width with no horizontal scrolling.

## Assumptions

- "Authorized users" means any signed-in user (member); no finer role distinction.
- Only newsletters that have been sent are public-facing candidates.
- "Contact Membership Application" is the existing Membership Application form on the Contact page.
- Cards show title, send date and a short preview; the full newsletter opens on its own page for signed-in users.
- The blueprint entry is maintained by the site owner; the owner adds the Newsletter entry to the blueprint file.
- The existing admin-only newsletter management is unchanged.
