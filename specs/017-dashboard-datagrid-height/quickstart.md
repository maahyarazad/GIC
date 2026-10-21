# Quickstart: validate the fixed-height dashboard grids

## Prerequisites

- The backend running (`npm run dev` at the repo root) and the UI running (`npm run dev` in `ui/`).
- An admin account (which sees all 9 grid sections) and some rows in each section. Member Requests or Email Logs need more rows than fit on one screen.
- Browser dev tools with device emulation.

The 9 sections are listed in [data-model.md](data-model.md#opted-in-sections-9).

## 1. Desktop fill and inner scroll (US1, FR-001/003/004)

At **1920×1080** and then **1366×768**, for each of the 9 sections:
1. Open the section and pick the largest page size.
   - Expected: the paging bar ends at the bottom of the screen (minus the normal 1rem padding) without scrolling the page.
2. Scroll with the mouse over the grid rows.
   - Expected: only the rows move. The column headers, with their filter inputs, stay at the top and the paging bar stays at the bottom.
3. Pick the smallest page size, or filter down to 1–2 rows.
   - Expected: the grid keeps the same height, with empty space inside it, and the paging bar stays at the bottom.
4. Scroll the page itself down.
   - Expected: only the site footer appears below the dashboard.

## 2. Content above the grid (US2, FR-002)

1. Email Logs: the status and date toolbar is fully visible and the grid starts right below it.
2. Narrow the window to about 700px wide, so the header buttons or the Email Logs toolbar wrap onto two lines.
   - Expected: the grid gets shorter by the same amount, and the paging bar stays on screen.
3. Newsletter → "Newsletter Subscribers" (slide-out panel).
   - Expected: the grid fills the panel below the panel title and the section header, its rows scroll inside, and the paging bar sits at the bottom of the panel.

## 3. Resize and loading (FR-007, edge cases)

1. Drag the window height from about 1000px to about 700px.
   - Expected: the grid height follows the window immediately.
2. Change page, sort, or type in a filter (which shows the loader).
   - Expected: the section keeps its height and doesn't jump when the grid comes back.

## 4. Small screens (US3, FR-006)

1. **1366×600**:
   - Expected: at least 4 rows show. If the space is smaller than the minimum, the dashboard area scrolls to reach the paging bar.
2. **375×667** (phone):
   - Expected: rows show as cards, the same as before this change, and the page scrolls through them.
3. **768×1024** (tablet):
   - Expected: the ☰ button sits above the section and the grid fills the rest.

## 5. No regressions (FR-009, SC-004)

In each section:
- sorting, filtering, paging and changing the page size still work;
- the row actions (View, edit, delete, toggles) work;
- wide tables still scroll sideways inside the grid;
- the light and dark themes look right, and the sticky header has an opaque background with no rows showing through.

Then open a non-grid section (Events, Country Intelligence, Website Data).
- Expected: its layout and scrolling are unchanged.

## 6. Build

`cd ui && npx vite build --outDir <scratch dir>` succeeds, and `npx tsc --noEmit -p .` shows no new errors (65 errors already exist).
