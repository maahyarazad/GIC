# Data Model: One Navbar Hamburger

All state is client-side UI state. There are no API or database changes.

## Redux `app` slice (shared)

| Field | Type | Default | Notes |
|---|---|---|---|
| `dashboardSidebarOpen` | `boolean` | `false` | Also set explicitly in `entry-server.jsx` `preloadedState.app`, because that object replaces the slice's initial state |

| Action | Effect | Dispatched by |
|---|---|---|
| `toggleDashboardSidebar()` | flips the flag | Navbar hamburger (dashboard routes) |
| `setDashboardSidebarOpen(false)` | closes | Dashboard menu item click at ≤ `NAVBAR_BREAKPOINT`; Dashboard unmount; `useDismissable` (Escape / outside click) |

## Navbar local state

| State | Type | Meaning |
|---|---|---|
| `menuOpen` | `boolean` | Landing `.mob-nav` open. This renames today's `isOpen` and replaces the dead `menuOpen`/`toggleMenu` pair |
| `compact` | `boolean` (derived via `useNavbarFit`) | Landing links don't fit. Always `false` on dashboard routes (no links) and before the first client measurement |

**Derived values**

```text
inDashboard  = location.pathname startsWith "/dashboard"
panelOpen    = inDashboard ? dashboardSidebarOpen : menuOpen
onBurger     = inDashboard ? toggleDashboardSidebar : toggleMenu
controlsId   = inDashboard ? "dashboard-sidebar" : "mobile-nav"
```

## State transitions

```text
Landing menu:   closed ──burger──▶ open ──burger | link/section | Escape | outside click | compact→false──▶ closed
Dashboard bar:  closed ──burger──▶ open ──burger | item click (≤ bp) | Escape | outside click | unmount──▶ closed
Compact:        false ──links.scrollWidth > middle.clientWidth──▶ true ──links.scrollWidth + 24 ≤ middle.clientWidth──▶ false
```

## Constants (single source each)

| Value | SCSS | TS |
|---|---|---|
| Breakpoint 1024px | `$bp-tablet` (existing, `index.scss`) | `NAVBAR_BREAKPOINT` in `Components/Navbar/navbarConfig.ts` |
| Navbar height 70px | `$nav-height` (new, `index.scss`) | `NAVBAR_HEIGHT` in `navbarConfig.ts` |
| Fit hysteresis 24px | n/a | `NAVBAR_FIT_HYSTERESIS` in `navbarConfig.ts` |
