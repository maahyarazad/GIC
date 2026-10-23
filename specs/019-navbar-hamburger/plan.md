# Implementation Plan: One Navbar Hamburger for Landing Menu and Dashboard Sidebar

**Branch**: `019-navbar-hamburger` | **Date**: 2026-10-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/019-navbar-hamburger/spec.md`, derived from `NAVBAR_HAMBURGER_BLUEPRINT.md`

## Summary

The navbar hamburger becomes the only menu toggle, and its target depends on the route. On landing routes it opens the existing `.mob-nav` drop-down. On `/dashboard…` it opens the dashboard sidebar through a new Redux flag, `app.dashboardSidebarOpen`. The dashboard's in-page ☰ and × buttons are removed. Below the breakpoint, the sidebar moves under the 70px navbar so the button stays clickable.

The landing navbar gains a compact mode. A `useNavbarFit` hook with a `ResizeObserver` and a 24px hysteresis shows the hamburger at any width when the links don't fit.

Both panels close on Escape and on an outside click, and move focus into themselves when opened, through a shared `useDismissable` hook. The hamburger becomes an accessible `<button>` with its existing X animation actually wired up.

There is one shared breakpoint, **1024px**, and one navbar height, **70px**. Each is defined once in SCSS and once in TS (research R1).

## Technical Context

**Language/Version**: TypeScript and SCSS. React 19 with Vite and SSR (`ui/src/entry-server.jsx` / `entry-client.jsx`).

**Primary Dependencies**: Redux Toolkit (`appSlice`), react-router-dom 6, and the browser `ResizeObserver`. No new packages. `@animated-burgers/burger-rotate` is deliberately not reintroduced (R2).

**Storage**: N/A. All state is client-side UI state.

**Testing**: No automated UI test framework. Validation is manual, at fixed viewport widths, following [quickstart.md](./quickstart.md).

**Target Platform**: Modern browsers, 320–1920px wide, in both themes and both locales. The page is server-rendered on first load.

**Project Type**: Web application, specifically the SPA in `ui/`. No server changes.

**Performance Goals**: No layout thrash. The fit check runs only on `ResizeObserver` callbacks and dependency changes, with no per-frame polling.

**Constraints**: The server and client must render identical markup (compact is `false` until measured, and every panel starts closed). The SCSS must be compiled to the committed `.css` files (`index.css`, `Dashboard.css`, `Navbar.css`).

**Scale/Scope**: 1 slice, 2 new hooks, 1 config module, 3 components/pages and 3 stylesheets.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template, so it defines no gates. The plan follows the repo's conventions instead:

- Reuse before adding: the existing CSS hamburger, the `.mob-nav` styling and Redux for shared state. ✅
- No new runtime dependencies. ✅
- SSR safety: no `window` access during render, and the initial markup is identical on server and client. ✅

**Result**: PASS, both before research and after design.

## Project Structure

### Documentation (this feature)

```text
specs/019-navbar-hamburger/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/navbar-ui.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code

```text
ui/src/
├── features/appSlice.ts                 # + dashboardSidebarOpen, setDashboardSidebarOpen, toggleDashboardSidebar
├── entry-server.jsx                     # preloadedState.app.dashboardSidebarOpen = false
├── index.scss / index.css               # + $nav-height; .hamburger as <button>; .nav-middle; nav.nav--compact rules
├── Components/Navbar/
│   ├── Navbar.tsx                       # route-based target, compact, ARIA, dead-code cleanup, avatar in dashboard
│   ├── navbarConfig.ts                  # NEW: NAVBAR_BREAKPOINT = 1024, NAVBAR_HEIGHT = 70
│   ├── useNavbarFit.ts                  # NEW: compact detection with hysteresis (R4)
│   └── useDismissable.ts                # NEW: Escape / outside click / focus (R5)
└── Pages/Dashboard/
    ├── Dashboard.tsx                    # Redux sidebar state, remove ☰/×, close on item click + unmount
    └── Dashboard.scss / Dashboard.css   # breakpoint 767/768 → 1024/1025, mobile sidebar top: $nav-height
NAVBAR_HAMBURGER_BLUEPRINT.md            # rewrite with GIC's real values once implemented (or move to specs/019/)
```

**Structure Decision**: The work stays inside the existing Navbar and Dashboard folders. The two hooks and the config live next to `Navbar.tsx`, as the blueprint lays them out. `useNavbarState` from the blueprint is not created. Its only roles are a `scrolled` flag, which `Navbar.tsx` already has, and the breakpoint constant, which moves to `navbarConfig.ts`.

## Phase outline (for /speckit-tasks)

1. **Foundation**: `navbarConfig.ts`; the `$nav-height` SCSS variable, used in place of the literal `70px`s in `index.scss` and `Dashboard.scss`; the `appSlice` flag and actions; the `entry-server.jsx` preloaded state.
2. **US1 (P1)**:
   - Dashboard: wire the sidebar to Redux, delete `.open-sidebar-btn` and `.close-btn` from the markup and SCSS, and move the breakpoint to 1024/1025 with the mobile `top: $nav-height`.
   - Navbar: `inDashboard ? toggleSidebar : toggleMenu`, the `.open` class from the active panel, the button element and ARIA, and the avatar in the bar on the dashboard.
3. **US2 (P2)**: `.nav-middle` wrapper; `useNavbarFit`; `nav--compact` styles; close the menu when leaving compact mode; dead-code cleanup in `Navbar.tsx`.
4. **US3 (P3)**: `useDismissable`; use it on both panels and remove the old `handleClickOutside`; give the sidebar and menu `id`s for `aria-controls`.
5. **Polish**: recompile the CSS; build; run the quickstart at 390, 768, 1024, 1100, 1280 and 1440px in both themes and locales; update the blueprint document; optionally remove the unused `burger-rotate` dependency.

## Complexity Tracking

No constitution violations.
