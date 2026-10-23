# Navbar hamburger blueprint

How the navbar's hamburger behaves on landing pages and in the dashboard. There is one button, and
what it opens depends on the current route. (Feature 019; spec in `specs/019-navbar-hamburger/`.)

| Where | Button visible | What it toggles | State lives in |
|---|---|---|---|
| Landing pages (any route except `/dashboard…`) | ≤ 1024px, or wider when the links don't fit (`nav.nav--compact`) | The drop-down `#mobile-nav` (`.mob-nav`) | Local `menuOpen` in `Navbar.tsx` |
| Dashboard (`/dashboard…`) | ≤ 1024px only | `#dashboard-sidebar` (`aside.sidebar`) | Redux `app.dashboardSidebarOpen` |

## Files

| File | Role |
|---|---|
| `ui/src/Components/Navbar/Navbar.tsx` | Renders the button and picks its target by route |
| `ui/src/Components/Navbar/navbarConfig.ts` | `NAVBAR_BREAKPOINT = 1024`, `NAVBAR_HEIGHT = 70`, `NAVBAR_FIT_HYSTERESIS = 24`, `isNavbarCollapsedWidth()` |
| `ui/src/Components/Navbar/useNavbarFit.ts` | `compact` when the desktop links don't fit their column |
| `ui/src/Components/Navbar/useDismissable.ts` | Escape, outside click, and focus handling for either panel |
| `ui/src/styles/_navbar.scss` | `$nav-height: 70px`, `$navbar-breakpoint: 1024px` (`@use`d by `index.scss` and `Dashboard.scss`) |
| `ui/src/index.scss` / `.css` | `nav`, `.nav-middle`, `.nav-links`, `.hamburger`, `.mob-nav`, `nav.nav--compact` |
| `ui/src/features/appSlice.ts` | `dashboardSidebarOpen`, `setDashboardSidebarOpen`, `toggleDashboardSidebar` |
| `ui/src/entry-server.jsx` | `preloadedState.app.dashboardSidebarOpen = false` (that object replaces the slice's initial state) |
| `ui/src/Pages/Dashboard/Dashboard.tsx` | Reads the sidebar state, and closes it on a menu click and on unmount |
| `ui/src/Pages/Dashboard/Dashboard.scss` / `.css` | Sidebar in-flow above 1024px, off-canvas at or below it |

## Decision flow

```
            click hamburger
                  │
       isDashboard = pathname startsWith '/dashboard'
          │                       │
        false                    true
          │                       │
     toggleMenu()            toggleSidebar()
   setMenuOpen(!open)    dispatch(toggleDashboardSidebar())
          │                       │
   .mob-nav.open           aside.sidebar.open
   (drops down below       (slides in from the left,
    the 70px bar)           below the 70px bar)
```

```tsx
<button
  type="button"
  className={`hamburger${panelOpen ? ' open' : ''}`}   // .open animates the bars into an X
  aria-expanded={panelOpen}
  aria-controls={isDashboard ? 'dashboard-sidebar' : 'mobile-nav'}
  onClick={isDashboard ? toggleSidebar : toggleMenu}
>
```

The icon is GIC's own CSS `.hamburger` (three spans). The `@animated-burgers/burger-rotate` package was
removed: it needed a CommonJS/SSR interop workaround and is no longer a dependency.

## Landing pages

### When the button is visible

1. **≤ 1024px**: the `$bp-tablet` media query in `index.scss` hides `.nav-links` and shows `.hamburger`.
   This works before JavaScript runs, so the server-rendered page is already correct.
2. **Wider screens, with `nav.nav--compact`**: `useNavbarFit` sets compact when `.nav-links.scrollWidth` is
   larger than `.nav-middle.clientWidth`. Leaving compact needs 24px of spare room, which prevents
   flicker at the boundary. While compact, the links stay laid out (`visibility: hidden; position: absolute`)
   so they can still be measured. Compact is `false` on the server and before the first measurement.

```ts
const fits = useNavbarFit(middleRef, linksRef, [navbarLinks, user, currentlanguage]);
const compact = !isDashboard && fits;
useEffect(() => { if (!compact && !isNavbarCollapsedWidth()) setMenuOpen(false); }, [compact]);
```

### Menu contents

`.mob-nav` renders the same `navbarLinks` as the desktop list, plus the avatar when logged in or
Sign-in when logged out.

### Closing

| Trigger | Code |
|---|---|
| Hamburger click | `toggleMenu()` |
| Any menu link or section | `closeMenu()` / `handleScroll(...)` → `setMenuOpen(false)` |
| Leaving compact mode above 1024px | `useEffect` on `compact` |
| Escape, or a pointerdown outside the menu and the button | `useDismissable` |

### Link behaviour inside the menu (`handleScroll(e, key, type, path)`)

- `type === 'link'`: `navigate(path)`.
- A section button on `/`: smooth-scroll to `#section-${key}`.
- A section button on another page: store `pendingScrollKey`, navigate to `/`, then scroll 300ms after the route changes.

## Dashboard

```ts
// Navbar.tsx
const sidebarOpen = useSelector((s) => s.app.dashboardSidebarOpen);
const toggleSidebar = useCallback(() => dispatch(toggleDashboardSidebar()), [dispatch]);

// Dashboard.tsx
const isSidebarOpen = useSelector((s) => s.app.dashboardSidebarOpen);
<aside id="dashboard-sidebar" className={`sidebar ${isSidebarOpen ? "open" : ""}`}> … </aside>
```

The state is in Redux because the button (Navbar) and the sidebar (Dashboard) are separate trees.
The old in-page `open-sidebar-btn` (☰) and `close-btn` (×) have been removed.

- The navbar has no links in the dashboard, so it never becomes compact.
- `.mob-nav` never opens here, and the avatar stays in `.nav-right` at every width.

### When the sidebar shows

```scss
@media (min-width: navbar.$navbar-breakpoint + 1) {   // ≥ 1025px: always visible, sticky below the bar
  .sidebar { position: sticky; top: navbar.$nav-height; margin-top: navbar.$nav-height; … }
}
@media (max-width: navbar.$navbar-breakpoint) {       // ≤ 1024px: off-canvas, toggled by the hamburger
  .sidebar { position: fixed; top: navbar.$nav-height; left: 0; bottom: 0; width: 250px;
             transform: translateX(-100%); z-index: 1001; }
  .sidebar.open { transform: translateX(0); }
}
```

### Closing

| Trigger | Code |
|---|---|
| Hamburger click | `dispatch(toggleDashboardSidebar())` |
| Choosing a menu item at ≤ 1024px (click, Enter or Space) | `handleMenuClick` → `if (isNavbarCollapsedWidth()) dispatch(setDashboardSidebarOpen(false))` |
| Resizing above 1024px | resize listener in `Navbar.tsx` → `closeSidebar()` |
| Leaving the dashboard | unmount cleanup → `dispatch(setDashboardSidebarOpen(false))` |
| Escape, or a pointerdown outside the sidebar and the button | `useDismissable` |

## Keyboard and focus

When either panel opens, focus moves to its first item. Escape closes it and returns focus to the hamburger.

## Values to keep in sync

| Value | SCSS | TS |
|---|---|---|
| Breakpoint 1024px | `$navbar-breakpoint` in `ui/src/styles/_navbar.scss` (also feeds `$bp-tablet`) | `NAVBAR_BREAKPOINT` |
| Navbar height 70px | `$nav-height` | `NAVBAR_HEIGHT` |

The `.css` files are compiled from the `.scss` files by the editor's Sass watcher, which also adds vendor prefixes.
Change both, or let the watcher regenerate them.

## Z-index stack

| Layer | z-index |
|---|---|
| File Management `UploadOverlay` (absolute, inside its section) | 50 |
| `.mob-nav` | 999 |
| `.sidebar` (desktop) | 999 |
| `nav` | 1000 |
| `.sidebar` (≤ 1024px) | 1001 |
| Toasts | 99999 |
