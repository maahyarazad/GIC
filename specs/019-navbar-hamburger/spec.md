# Feature Specification: One Navbar Hamburger for Landing Menu and Dashboard Sidebar

**Feature Branch**: `019-navbar-hamburger`

**Created**: 2026-10-23

**Status**: Draft

**Input**: `NAVBAR_HAMBURGER_BLUEPRINT.md` (repo root): "There is one button. What it opens depends on the current route."

## Context

On narrow screens, the dashboard currently has two menu buttons. The navbar hamburger opens a mobile menu that, inside the dashboard, holds only the avatar. A separate in-page ☰ button opens the dashboard sidebar. Once open, the sidebar covers the navbar, which hides the hamburger. On landing pages, the hamburger appears only below the tablet width, so on mid-size desktops the links can overflow before it shows. Neither panel closes with Escape.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The navbar hamburger opens the dashboard sidebar (Priority: P1)

A signed-in user on a phone or tablet opens the dashboard. The only menu button is the navbar hamburger. Tapping it slides the dashboard sidebar in below the navbar, and the hamburger turns into a close (X) icon. Choosing a section or tapping the hamburger again closes the sidebar. Leaving the dashboard and coming back starts with the sidebar closed.

**Why this priority**: Two competing buttons, and a hamburger that opens a nearly empty menu, are the main usability problems on mobile.

**Independent Test**: At a width of 390px, open `/dashboard`. Check that there is exactly one menu button, that it toggles the sidebar, and that the sidebar never covers that button.

**Acceptance Scenarios**:

1. **Given** the dashboard at or below the sidebar breakpoint, **When** the page loads, **Then** the sidebar is hidden, the navbar hamburger is visible, and there is no in-page open or close button.
2. **Given** the sidebar is closed, **When** the user taps the hamburger, **Then** the sidebar slides in below the navbar and the hamburger shows its open (X) state.
3. **Given** the sidebar is open, **When** the user taps the hamburger again, **Then** the sidebar closes.
4. **Given** the sidebar is open, **When** the user chooses a section, **Then** that section loads and the sidebar closes.
5. **Given** the sidebar was open, **When** the user leaves the dashboard and returns, **Then** the sidebar starts closed.
6. **Given** the dashboard above the sidebar breakpoint, **When** it loads, **Then** the sidebar is always visible and the hamburger is not shown.
7. **Given** the dashboard on a narrow screen, **When** it loads, **Then** the user's avatar is still visible in the navbar and links to the dashboard.

---

### User Story 2 - The landing hamburger also appears when the links don't fit (Priority: P2)

On a landing page, the hamburger shows below the tablet width as it does today. It also shows on wider screens whenever the navbar links don't fit in their space. In that case the links are hidden and become available from the hamburger menu, and the bar never shows clipped or overlapping links.

**Why this priority**: This stops layout breakage on mid-size desktops and in long languages. It is less urgent than the dashboard's duplicate buttons.

**Independent Test**: At about 1100–1300px wide, with the German locale or extra links, slowly narrow the window. The links switch to the hamburger as soon as they would overflow, and switch back when they fit again, without flickering at the boundary.

**Acceptance Scenarios**:

1. **Given** a landing page wide enough for the links, **When** it renders, **Then** the links show inline and the hamburger is hidden.
2. **Given** a landing page wider than the tablet width where the links no longer fit, **When** the window is narrowed, **Then** the links are hidden and the hamburger appears.
3. **Given** the compact state with the menu open, **When** the window widens enough for the links to fit, **Then** the bar returns to inline links and the menu closes.
4. **Given** a width right at the fit boundary, **When** the window is resized by a few pixels back and forth, **Then** the bar does not flicker between the two states.
5. **Given** the menu is open, **When** the user chooses a link or section, **Then** it navigates or scrolls there and the menu closes.

---

### User Story 3 - Keyboard and outside-click closing (Priority: P3)

Whichever panel is open, the landing menu or the dashboard sidebar, pressing Escape or clicking outside it closes it. Opening a panel moves keyboard focus into it, and closing it with Escape returns focus to the hamburger. The hamburger tells assistive technology whether it is expanded.

**Why this priority**: Accessibility and polish. The blueprint lists this as a known loose end.

**Independent Test**: Use the keyboard only to open each panel, check where focus lands, press Escape, and check that focus returns to the hamburger.

**Acceptance Scenarios**:

1. **Given** either panel is open, **When** the user presses Escape, **Then** it closes and focus returns to the hamburger.
2. **Given** either panel is open, **When** the user clicks outside both the panel and the hamburger, **Then** the panel closes.
3. **Given** a panel opens, **When** it finishes opening, **Then** focus is on its first item.
4. **Given** the hamburger, **When** it is read by a screen reader, **Then** it is announced as a button with an accurate expanded or collapsed state and a label.

---

### Edge Cases

- The window is resized across the breakpoint while the dashboard sidebar is open. Above the breakpoint the sidebar is in-flow and visible, and the open flag must not leave stale overlay styles behind. Going back below the breakpoint, the sidebar starts closed.
- Server-side rendering: the first paint must not flash an open menu or sidebar, and the hamburger must render the same markup on the server and the client.
- Logged out on a landing page: the hamburger menu includes Sign-in. Logged in: it includes the avatar.
- The dashboard's navbar has no links, so it never enters the compact state on wide screens.
- File Management's upload overlay is open on mobile while the sidebar opens. The sidebar must stay above the overlay and stay usable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The navbar MUST show a single hamburger button, and what it toggles MUST depend on the route: the landing mobile menu on non-dashboard routes, and the dashboard sidebar on `/dashboard…` routes.
- **FR-002**: The open state of the dashboard sidebar MUST be shared between the navbar and the dashboard page, so either can read or change it.
- **FR-003**: The dashboard MUST NOT render its own open or close sidebar buttons.
- **FR-004**: At or below the sidebar breakpoint, the sidebar MUST be positioned below the navbar so the hamburger stays visible and clickable while the sidebar is open.
- **FR-005**: The sidebar MUST close when the user picks a section at or below the breakpoint, and when the dashboard unmounts.
- **FR-006**: Inside the dashboard, the hamburger MUST be visible only where the sidebar is off-canvas.
- **FR-007**: The hamburger's visual state (bars or X) MUST reflect the open state of the panel it controls.
- **FR-008**: On landing routes, the navbar MUST switch to the compact (hamburger) state whenever its links do not fit, at any width, with hysteresis to prevent flicker. It MUST return to inline links, closing the menu, when they fit again.
- **FR-009**: The landing menu MUST close when the user chooses a link or section, which keeps the existing navigate and scroll behaviour.
- **FR-010**: Both panels MUST close on Escape and on a click outside the panel and the hamburger.
- **FR-011**: Opening a panel MUST move focus to its first focusable item, and closing it with Escape MUST return focus to the hamburger.
- **FR-012**: The hamburger MUST be a real button with `aria-expanded`, `aria-controls` and an accessible label.
- **FR-013**: The breakpoint and navbar-height values MUST each be defined once per language (one SCSS variable and one TS constant), and every rule that depends on them MUST use those definitions.
- **FR-014**: The user's avatar MUST stay visible in the navbar on dashboard routes at every width.

### Key Entities

- **Dashboard sidebar state**: a single open/closed flag shared app-wide. It is closed by default, including in server-rendered state.
- **Landing menu state**: an open/closed flag local to the navbar.
- **Compact state**: a derived flag that is true when the landing links do not fit their space.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On every dashboard page at ≤ 1024px, exactly 1 menu-toggle control is present (currently 2–3).
- **SC-002**: When opened at 390px, 768px or 1024px, the dashboard sidebar does not cover the hamburger at any of those widths.
- **SC-003**: On landing pages, navbar links never overflow or overlap other navbar content at any width from 320px to 1920px, in either locale.
- **SC-004**: When the window is resized by ±10px around the fit boundary, the navbar changes state at most once in each direction.
- **SC-005**: Both panels can be opened, used and closed with the keyboard alone.

## Assumptions

- The blueprint describes the behaviour to adopt. Its specific numbers and visuals (an 800px breakpoint, an 80px navbar, a full-height slide-out landing menu with a background image, and the `@animated-burgers/burger-rotate` icon) come from a different navbar layout. GIC keeps its own 70px navbar, its 1024px tablet breakpoint, its drop-down `.mob-nav` styling and its existing CSS hamburger (see research R1, R2 and R6).
- Dashboard sidebar breakpoint: the sidebar becomes off-canvas at ≤ 1024px, the same width at which the landing hamburger appears, so the button's visibility rule is the same on every route (see research R1).
- The hamburger stays at the right of the navbar, where GIC has it today.
