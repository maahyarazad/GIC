# Feature Specification: Newsletter Subscribers slide-out panel

**Feature Branch**: `012-newsletter-subscribers-slide`

**Created**: 2026-10-19

**Status**: Draft

**Input**: User description: "Remove the Email Subscription menu item from the Dashboard panel. In the Newsletter section, add a new button next to the New Article button. When clicked, the button should open a slide-out panel containing the entire Email Subscription data grid. Also, rename Email Subscription to Newsletter Subscribers."

## Summary

Relocate the subscribers list from its own Dashboard menu item into the **Newsletter** section. Remove
the standalone "Email Subscribers" menu entry, add a button beside **New Article** that opens a
**slide-out panel** containing the full subscribers data grid, and label everything user-facing
**Newsletter Subscribers** (replacing "Email Subscription"/"Email Subscribers"). No backend or data
changes — the same subscribers grid and its existing `/newsletter` data source are reused.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open the subscribers panel from Newsletter (Priority: P1)

An admin/procurement user in the Newsletter section clicks the **Newsletter Subscribers** button
next to **New Article**; a panel slides out containing the entire subscribers data grid (paging,
sorting, filtering intact). They close it to return to the newsletter list.

**Why this priority**: This is the whole feature — surfacing subscribers from within Newsletter. It
is the MVP.

**Independent Test**: In the Newsletter section, click the button, confirm the grid appears in the
slide-out with working paging/sort/filter, and the panel closes.

**Acceptance Scenarios**:

1. **Given** a user in the Newsletter section, **When** they click the Newsletter Subscribers button, **Then** a panel slides out showing the full subscribers data grid.
2. **Given** the panel is open, **When** they close it (close control, backdrop click, or Esc), **Then** the panel slides away and the newsletter list is shown unchanged.
3. **Given** the panel is open, **When** they page/sort/filter the grid, **Then** it behaves exactly as the grid did as a standalone menu item.

---

### User Story 2 - Menu item removed, naming updated (Priority: P1)

The standalone "Email Subscribers" item no longer appears in the Dashboard menu, and all remaining
user-facing text reads "Newsletter Subscribers".

**Why this priority**: The request explicitly requires removing the menu item and the rename; leaving
either creates a duplicate/inconsistent entry point.

**Independent Test**: Open the Dashboard menu as admin and procurement; confirm no "Email
Subscribers"/"Email Subscription" entry exists and the only subscribers access is the Newsletter
button.

**Acceptance Scenarios**:

1. **Given** an admin or procurement user, **When** they view the Dashboard menu, **Then** there is no "Email Subscribers"/"Email Subscription" menu item.
2. **Given** anywhere the feature is surfaced (button, panel heading), **When** text is shown, **Then** it reads "Newsletter Subscribers".
3. **Given** a bookmarked/deep link to the old subscribers tab, **When** it is opened, **Then** the app resolves to a valid default view without error (the removed item is no longer a valid tab).

---

### Edge Cases

- Opening the panel while the grid's first fetch is in flight: the panel shows the grid's own loading state.
- The subscribers fetch fails: the grid surfaces its existing error/empty handling inside the panel.
- Narrow/mobile widths: the slide-out remains usable (full-width or near-full-width) without horizontal page scroll.
- Rapid open/close toggling does not leave the backdrop or body scroll-lock stuck.
- Esc key and backdrop click both close the panel; focus returns to the trigger button.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The standalone "Email Subscribers" item MUST be removed from the Dashboard menu for all roles.
- **FR-002**: The Newsletter section MUST show a button adjacent to the "New Article" button that opens the subscribers panel.
- **FR-003**: Clicking the button MUST open a slide-out panel that renders the **entire** existing subscribers data grid, with paging, sorting and filtering unchanged.
- **FR-004**: The panel MUST be dismissible via an explicit close control, backdrop click, and the Esc key.
- **FR-005**: All user-facing labels for this feature (button, panel heading) MUST read "Newsletter Subscribers" (no "Email Subscription"/"Email Subscribers").
- **FR-006**: The subscribers grid MUST reuse the existing component and its current data source — no backend, API, or data-model changes.
- **FR-007**: Removing the menu item MUST NOT break tab routing: the removed key is no longer a valid tab, and the default/role landing behavior still resolves.
- **FR-008**: Access to the subscribers panel MUST remain limited to the roles that can see the Newsletter section (admin, procurement).
- **FR-009**: Opening the panel MUST NOT navigate away from the Newsletter list; closing it returns to that list unchanged.

### Key Entities *(include if feature involves data)*

- None. This is a presentation/navigation change; no entities are added or modified. The existing subscriber records and their data source are reused unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the subscribers-grid capability previously available via the menu item is reachable from the Newsletter button (same columns, paging, sorting, filtering).
- **SC-002**: The Dashboard menu shows 0 "Email Subscribers"/"Email Subscription" entries for every role.
- **SC-003**: 0 occurrences of the old label remain in user-facing text for this feature.
- **SC-004**: The panel opens and closes via all three dismiss methods (close control, backdrop, Esc) in 100% of manual checks.

## Assumptions

- The subscribers grid is the existing `NewsletterSubscribers` component, which already renders its own heading "Newsletter Subscribers" and fetches from the existing `/newsletter` endpoint; it can be rendered as-is inside the panel.
- Roles that see Newsletter today (admin, procurement) are the intended audience; no new role is introduced.
- No existing slide-out/drawer primitive exists in the codebase, so a lightweight reusable panel will be added; it should visually match the dashboard (reuse existing button and overlay styling conventions).
- "Email Subscription" and "Email Subscribers" refer to the same existing subscribers feature; both are replaced by "Newsletter Subscribers".
