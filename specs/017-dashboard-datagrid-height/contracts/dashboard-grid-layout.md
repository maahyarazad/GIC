# Contract: dashboard grid layout (UI)

This is how a dashboard section opts in to the fixed-height grid. Every current and future grid section follows it.

## Section markup

```tsx
<div className="dash-section dash-section--grid">
  <div className="dash-header">…title, count, buttons…</div>
  {/* optional toolbars / filters: any number of direct children, natural height */}
  {loading ? <Loader /> : empty ? <div className="dash-empty">…</div> : <GenericDataGrid … />}
  {/* modal dialogs may follow; they are fixed overlays and take no space */}
</div>
```

Rules:
1. `dash-section--grid` goes on the section's **root** element, which must be a **direct child** of `.main-content` (dashboard) or `.slide-menu__content` (slide-out panel).
2. `GenericDataGrid` (or the Loader / `.dash-empty` that stands in for it) must be a **direct child** of that section, so it can take the leftover height.
3. Don't wrap the grid in a container that has its own height or `overflow` setting.

## GenericDataGrid markup (after this change)

```html
<div class="table-wrapper">          <!-- flex column; fills the section in opted-in sections -->
  <div class="table-scroll">         <!-- NEW: scrolls rows (and wide tables sideways) -->
    <table class="my-table">
      <thead>…sticky th with filter inputs…</thead>
      <tbody>…</tbody>
    </table>
  </div>
  <div class="grid-pagination">…</div>  <!-- always visible at the bottom -->
</div>
```

The component's props and API don't change.

## Breakpoints

| Width | Behavior |
|---|---|
| ≥ 601px | Fixed height: fills the leftover screen height, with a minimum of 20rem (header, 4 rows, paging). |
| ≤ 600px | Card layout as today: natural height, and the page scrolls. |

## Where styles live

- `ui/src/Pages/Dashboard/Dashboard.scss` + `.css`: the `.main-content:has(> .dash-section--grid)` and `.dash-section--grid` rules.
- `ui/src/Components/GenericDataGrid/GenericDataGrid.scss` + `.css`: `.table-scroll`, sticky `th`, and the `.dash-section--grid .table-wrapper` fill rules.
- `ui/src/Components/Generic/SlideMenu/SlideMenu.scss` + `.css`: the `.slide-menu__content:has(> .dash-section--grid)` rule.
