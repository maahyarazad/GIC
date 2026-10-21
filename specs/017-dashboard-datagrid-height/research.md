# Research: Dashboard Data Grid Fixed Height

## 1. How to size the grid: CSS flex chain, not a measured `calc()`

- **Decision**: Make the space under the navbar a fixed-height flex column and let the grid take the leftover space:
  `.main-content` (height `calc(100dvh - 70px)`) → `.dash-section--grid` (`flex: 1; min-height: 0`; flex column) → header, toolbar, etc. (natural height) → `.table-wrapper` (`flex: 1; min-height: 0`; flex column) → a new `.table-scroll` (`flex: 1; overflow: auto`) wrapping the `<table>`, plus `.grid-pagination` (`flex: none`).
- **Rationale**: This is exactly "100vh minus the navbar, the title and anything above the grid" (FR-001), but the browser does the subtraction. Whatever is above the grid is counted automatically, including the Email Logs toolbar, header buttons, the header count and wrapped lines (FR-002). Resizing also works for free (FR-007). The only hard-coded number is the navbar's 70px, which `Dashboard.scss` already hard-codes for the sidebar (`top: 70px; height: calc(100dvh - 70px)`).
- **Alternatives considered**: A literal `calc(100vh - Npx)` per section (rejected: N differs per section and breaks when a toolbar wraps, which FR-002 forbids). Measuring offsets in JS with `ResizeObserver` (rejected: more code, re-renders, and still needs special handling for the slide-out panel and page scroll offset).

## 2. Which sections opt in

- **Decision**: Add an explicit modifier class `dash-section--grid` to the root `div.dash-section` of the 9 grid sections. The layout rules key off that class: `.main-content:has(> .dash-section--grid)` and `.slide-menu__content:has(> .dash-section--grid)`.
- **Rationale**: The other dashboard sections (Events, Country Intelligence, Website Data, Profile and so on) must keep flowing and scrolling as today, so the change has to be opt-in. Putting the class on the section, rather than detecting `.table-wrapper`, keeps the height stable while the `Loader` or the empty state shows (spec edge cases "no jump while loading" and "empty result keeps full height"). `:has()` is supported by every browser the dashboard targets (Chrome/Edge 105+, Safari 15.4+, Firefox 121+).
- **Alternatives considered**: `:has(.table-wrapper)` alone (rejected: the section collapses while loading and jumps when the grid appears). Adding the class to `.main-content` from `Dashboard.tsx` with a per-tab list (rejected: it duplicates the knowledge of which sections have grids and misses the slide-out panel).

## 3. Sticky header and fixed paging inside the grid

- **Decision**: Change `GenericDataGrid.tsx` markup to `.table-wrapper > .table-scroll > table` + `.grid-pagination`. Give `thead th` `position: sticky; top: 0; z-index: 1`. The th elements already have an opaque `background: var(--bgp2)`, and the filter inputs live inside the same th, so they stick too. Horizontal overflow moves from `.table-wrapper` to `.table-scroll`, so wide tables still scroll sideways and the paging bar stays put.
- **Rationale**: Covers FR-003 and FR-004. Without its own scroll box, `position: sticky` would stick to the page, not the grid.
- **Alternatives considered**: A separate header table (rejected: column widths drift out of sync).
- **Note**: Wrapping the table changes nothing for grids outside an opted-in section. `.table-scroll` gets no height of its own there, so those grids look exactly as today (FR-009).

## 4. Minimum height and small screens

- **Decision**: `.dash-section--grid .table-wrapper { min-height: 20rem }`. That fits the header row with filters, 4 data rows of about 46px and the paging bar. When the window is too short, `.main-content` (already `overflow-y: auto`) scrolls. At `max-width: 600px` the grid already switches to the card layout (`thead` hidden, `tr` as cards), so there the opt-in rules are switched off and the grid keeps today's natural flow (spec FR-006, US3-3).
- **Rationale**: A fixed box of cards would show only one or two cards at a time.

## 5. Slide-out panel (Newsletter Subscribers)

- **Decision**: `.slide-menu__content` is already `flex: 1; overflow-y: auto` inside the `100vh` flex-column `.slide-menu`. Add `.slide-menu__content:has(> .dash-section--grid) { display: flex; flex-direction: column; }`, and the same `flex: 1; min-height: 0` chain then fits the grid to the panel (spec edge case).

## 6. The site footer

- **Finding**: `App.jsx` renders `<Footer />` under every route, including `/dashboard`, so the page can always scroll down to the footer.
- **Decision**: Keep it. The dashboard area (`.main-content`) fills exactly the screen below the navbar, and the footer stays below it. The spec's FR-005 and SC-002 were reworded to match.

## 7. SCSS and CSS files

- **Finding**: The components import the compiled `.css` files, which sit next to the `.scss` sources (`/*# sourceMappingURL */` from an editor Sass compiler). `sass` is not installed in `ui/`. Earlier commits (for example `311792b`) edited both `index.scss` and `index.css` by hand.
- **Decision**: Make each style change in both the `.scss` and the matching `.css` file. Leave the `.css.map` files alone.

## 8. Out of scope (noticed)

- `GenericDataGrid`'s default `rowsPerPageOptions` is `[5, 10, 25]`, while some sections start at a page size that isn't in the list (Email Logs uses 20, Member Requests 10). The select can then show a value that doesn't match. This doesn't affect the height; it's noted for a follow-up.
