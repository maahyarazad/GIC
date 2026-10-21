# Feature Specification: Dashboard Data Grid Fixed Height

**Feature Branch**: `017-dashboard-datagrid-height`

**Created**: 2026-10-21

**Status**: Draft

**Input**: User description: "in the Dashboard area there is a DataGrid and it should have static height like calc(100vh - the navbar height and the title or if anything else in the top of the DataGrid) - fix this on every component that has DataGrid"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The grid fills the screen and scrolls inside itself (Priority: P1)

A dashboard user opens any section that shows a data grid. The grid takes up exactly the screen height left below the top navigation bar, the section title and anything else above the grid (toolbars, filters, buttons). When there are more rows than fit, the rows scroll inside the grid while the column headers (with their filters) and the paging controls stay visible. The grid never pushes the paging controls below the screen.

**Why this priority**: Today the grid grows with its rows, so with a large page size the paging controls and column filters scroll out of view and the user has to scroll the whole page to change page or filter. This is the whole point of the request.

**Independent Test**: Open Member Requests with a page size larger than fits on screen. The paging controls are visible without scrolling the page, the grid's last row can be reached by scrolling inside the grid, and the column headers and paging controls stay visible the whole time.

**Acceptance Scenarios**:

1. **Given** a section with more rows than fit on screen, **When** the user scrolls inside the grid, **Then** only the rows move; the column header row (including filter inputs) and the paging controls stay in place.
2. **Given** any dashboard section with a grid, **When** it loads, **Then** the bottom of the grid (paging controls) sits at the bottom of the visible screen area; scrolling the page further only reveals the site footer.
3. **Given** a section with only a few rows, **When** it loads, **Then** the grid keeps the same height (empty space stays inside the grid) and the paging controls stay at the bottom of the grid.
4. **Given** the user resizes the browser window, **When** the window becomes taller or shorter, **Then** the grid height follows the new window height.

---

### User Story 2 - Same behavior in every dashboard grid (Priority: P1)

Every dashboard section that shows a data grid behaves the same way, whatever sits above its grid (just a title, a title with a count, buttons, or a filter toolbar).

**Why this priority**: The request explicitly covers every component with a data grid; inconsistent sections would look broken.

**Independent Test**: Open each of the sections listed below and confirm User Story 1's scenarios in each one.

**Acceptance Scenarios**:

1. **Given** each of these sections: Member Requests, Member Profiles, Blog, Newsletter, Newsletter Subscribers (in the slide-out panel), File Management, Email Templates, Email Logs and Manage Sub Region, **When** opened, **Then** each one passes User Story 1's scenarios.
2. **Given** a section with extra controls above the grid (for example the Email Logs status and date filters, or an "Add" button), **When** it loads, **Then** those controls stay fully visible and the grid uses only the remaining height.
3. **Given** a section whose controls above the grid wrap onto more lines on a narrow window, **When** the window narrows, **Then** the grid shrinks to match and the paging controls stay on screen.

---

### User Story 3 - Usable on small screens (Priority: P2)

On short or narrow screens (phones, small laptops, landscape tablets), the grid stays usable: it never shrinks so far that rows can't be read.

**Why this priority**: Fixed heights can collapse on small screens; the dashboard is also used on phones.

**Independent Test**: Open a grid section at phone size (portrait and landscape) and confirm at least a few rows are visible and reachable.

**Acceptance Scenarios**:

1. **Given** a screen so short that the remaining height would be too small, **When** a grid section loads, **Then** the grid keeps a minimum height that shows at least 4 rows, and the page is allowed to scroll to reach it.
2. **Given** a narrow screen, **When** the grid has more columns than fit, **Then** horizontal scrolling keeps working inside the grid as it does today.
3. **Given** a phone-width screen where the grid shows each row as a card, **When** a grid section loads, **Then** the grid keeps today's natural layout (the cards flow down the page and the page scrolls), because a fixed-height box of cards would show only one or two at a time.

---

### Edge Cases

- The Newsletter Subscribers grid opens in the slide-out panel from the Newsletter section; it is fitted to the panel's visible height (minus the panel's own header and anything above the grid) instead of the window's.
- While the grid is loading (spinner shown instead of the grid), the section should not jump in height when the grid appears.
- An empty result (no rows) still shows the grid at full height, with the headers and paging controls in place.
- Changing the page size larger or smaller does not change the grid height, only how many rows scroll inside it.
- Browser zoom levels (90%–150%) keep the paging controls visible without page scrolling.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: In every dashboard section that shows a data grid, the grid MUST have a fixed height equal to the visible screen height minus the height of the top navigation bar, the section title, and every other element above the grid in that section, plus the section's spacing.
- **FR-002**: The height MUST follow the actual size of the elements above the grid (including when they wrap onto more lines), not a hard-coded guess per section.
- **FR-003**: Rows MUST scroll vertically inside the grid; the column header row (with its filter inputs) MUST stay visible at the top of the grid while scrolling.
- **FR-004**: The paging controls MUST stay visible at the bottom of the grid at all times.
- **FR-005**: The grid MUST NOT make the dashboard area taller than the visible screen below the navigation bar, except when the minimum height in FR-006 applies. (The site footer still sits below the dashboard and is reached by scrolling the page, as today.)
- **FR-006**: The grid MUST keep a minimum height that shows at least 4 rows; below that, the page may scroll. On phone-width screens where rows are shown as cards, the fixed height does not apply and the grid keeps today's natural layout.
- **FR-007**: The grid height MUST update when the window is resized or the elements above it change size.
- **FR-008**: The behavior MUST apply to all current dashboard grids: Member Requests, Member Profiles, Blog, Newsletter, Newsletter Subscribers (in the slide-out panel), File Management, Email Templates, Email Logs and Manage Sub Region. Any future grid gets it by default.
- **FR-009**: Existing grid behavior (sorting, filtering, paging, horizontal scrolling, row actions, light/dark themes) MUST keep working unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In all 9 dashboard grid sections, at a 1366×768 and a 1920×1080 window, the paging controls and column headers are visible without scrolling the page, for any page size.
- **SC-002**: In all 9 sections, at those two window sizes, the dashboard area exactly fills the screen below the navigation bar on first view: the grid's paging controls end at the bottom edge of the screen (within the section's normal bottom spacing), and only the site footer lies below it.
- **SC-003**: At a 375×667 phone screen, every grid section shows its rows as cards that can all be reached by scrolling the page, exactly as today; at a 1366×600 short laptop window, every grid shows at least 4 rows.
- **SC-004**: No sorting, filtering, paging or row action in any grid section stops working (checked section by section).

## Assumptions

- The site footer is shown under the dashboard today and stays there; it is not counted as "above the grid" and is reached by scrolling the page.
- "Navbar" means the dashboard's top bar; the dashboard sidebar sits beside the content and does not reduce the height.
- The change belongs in the shared data grid and the shared dashboard section layout, so all sections inherit it, with per-section adjustments only where a section's layout differs.
- Data grids outside the dashboard (if any) are out of scope.
- The minimum height of 4 rows is a reasonable default for small screens.
