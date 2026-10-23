# Contract: Navbar hamburger and panels (UI)

## Hamburger button

```html
<button type="button"
        class="hamburger [open]"
        aria-label="Open menu | Close menu"
        aria-expanded="true|false"
        aria-controls="mobile-nav | dashboard-sidebar">
  <span></span><span></span><span></span>
</button>
```

| Route | Visible when | Click | `.open` / `aria-expanded` from |
|---|---|---|---|
| not `/dashboard…` | `≤ 1024px` **or** `nav.nav--compact` | toggle `menuOpen` | `menuOpen` |
| `/dashboard…` | `≤ 1024px` only (never compact) | `dispatch(toggleDashboardSidebar())` | `app.dashboardSidebarOpen` |

## Landing menu `#mobile-nav` (`.mob-nav`)

- Uses the existing drop-down styles and `top: $nav-height`. It never opens on dashboard routes.
- Contents: the same `navbarLinks` as the desktop list, plus Sign-in when logged out or the avatar when logged in.
- Closes on: the burger, any link or section (existing `handleScroll` navigate/scroll rules), `compact` turning false, Escape, or a pointerdown outside the menu and the burger.

## Compact navbar (`nav.nav--compact`)

- Applies on landing routes when `useNavbarFit` reports overflow (see data-model.md for the thresholds).
- `.nav-links`: `visibility: hidden; position: absolute; pointer-events: none;`. They stay measurable but invisible and can't be clicked.
- `.hamburger`: `display: flex`.

## Dashboard sidebar `#dashboard-sidebar` (`aside.sidebar`)

| Width | Layout |
|---|---|
| ≥ 1025px | `position: sticky; top: $nav-height; margin-top: $nav-height`, always visible (as today, with the breakpoint moved from 768) |
| ≤ 1024px | `position: fixed; top: $nav-height; left: 0; bottom: 0; width: 250px; transform: translateX(-100%); z-index: 1001`; `.open → translateX(0)` |

- No `.open-sidebar-btn` or `.close-btn` in the DOM.
- Closes on: the burger, a menu item at ≤ 1024px, Escape, a pointerdown outside the sidebar and the burger, or leaving `/dashboard`.

## Keyboard and focus (both panels)

- On open, focus moves to the panel's first focusable element (sidebar items are `li[role=button][tabIndex=0]`).
- Escape closes the panel and focuses the hamburger.

## Avatar

- Dashboard routes: shown in `.nav-right` at every width.
- Landing routes: in `.nav-right` at ≥ 768px (`useIsMobile`, unchanged), and inside the menu below that.
