# Research: One Navbar Hamburger

Source: `NAVBAR_HAMBURGER_BLUEPRINT.md`, compared with `origin/main` at `7222877`. None of the blueprint's modules (`useNavbarFit`, `useNavbarState`, `dashboardSidebarOpen`, `navbar--compact`) have ever existed in this repo. `@animated-burgers/burger-rotate` was used once and removed in `368e853` "Update the UI", although it is still listed in `ui/package.json`.

## Current state (gap analysis)

| Concern | Blueprint | GIC today |
|---|---|---|
| Navbar height | 80px | **70px** (`nav { height: 70px }` in `ui/src/index.scss`; `.mob-nav { top: 70px }`; dashboard `top/margin-top: 70px`) |
| Landing burger breakpoint | 800px | **≤ 1024px** (`$bp-tablet` media query in `index.scss`: `.nav-links { display:none }`, `.hamburger { display:flex }`) |
| Dashboard sidebar breakpoint | 800 / 801px | **≤ 767 / ≥ 768px** (`Dashboard.scss`); `handleMenuClick` uses `innerWidth < 768` |
| Burger icon | `burger-rotate` package | CSS `.hamburger` (3 spans) with a `.open` X animation that is **never applied** (Navbar.tsx doesn't add the class) |
| Burger element | button component | `<div onClick>`, so not keyboard-focusable and has no ARIA |
| Landing menu | `.mobile-menu`, slides from left, full height | `.mob-nav`, drop-down below the bar (`display:none` → `.open { display:block }`), state `isOpen` |
| Dashboard toggle | navbar burger via Redux | in-page `.open-sidebar-btn` ☰ + `.close-btn` ×, local `useState` |
| Dashboard mobile sidebar | `top: 80px` below the navbar | `top: 0`, z 1001, **covers the navbar** |
| Burger in dashboard | toggles the sidebar | opens `.mob-nav` with only the avatar inside (links hidden) |
| Compact (links don't fit) | `useNavbarFit` + `.navbar--compact` | none; links can overflow between 1025px and roughly 1300px |
| Outside click | not implemented | landing `.mob-nav` has it (`handleClickOutside`) |
| Escape / focus | loose end | none |
| Dead state in Navbar.tsx | n/a | `menuOpen`, `toggleMenu`, `mobileView`, `showNavbar`, `NavLogo`, `scrolled`, `hamburgerRef` (attached to nothing) |

## R1 — Breakpoint and height values

- **Decision**: Use **one breakpoint, 1024px** (`$bp-tablet`), for both the landing hamburger and the dashboard's off-canvas sidebar. Keep the navbar height at **70px**. Expose both as a single SCSS source (`$bp-tablet` and a new `$nav-height: 70px` in `index.scss`) and a single TS module (`ui/src/Components/Navbar/navbarConfig.ts`: `NAVBAR_BREAKPOINT = 1024`, `NAVBAR_HEIGHT = 70`).
- **Rationale**: The blueprint's real rule is that the dashboard burger shows exactly where the sidebar is off-canvas, using the same value as the landing burger. GIC's burger already appears at ≤ 1024px. Moving the sidebar's breakpoint from 767px up to 1024px makes the hamburger's visibility rule identical on every route, so no dashboard-only CSS override is needed. It also gives the 017 fixed-height grids the full width on tablets.
- **Alternatives considered**: (a) Keep the sidebar at 767px and hide the burger in the dashboard between 768px and 1024px. That adds a route-specific CSS override and a second breakpoint to keep in sync. (b) Use 800px everywhere, as the blueprint does. That changes the landing layout for no user-facing reason.
- **Impact**: Tablets from 768px to 1024px wide lose the always-visible sidebar and use the hamburger instead. To revert, change one SCSS variable and one TS constant.

## R2 — Burger icon

- **Decision**: Keep GIC's CSS `.hamburger`, render it as a `<button type="button">`, and apply `.open` from the active panel's state.
- **Rationale**: The X animation already exists in `index.scss` and only needs the class. Reintroducing `burger-rotate` would bring back the CommonJS/SSR interop issue the blueprint warns about (`default ?? module`, and not adding it to `ssr.noExternal`) for the sake of an equivalent animation.
- **Alternatives considered**: The `burger-rotate` package as in the blueprint. Rejected because of the SSR risk and because it was removed once before. As a follow-up, remove the unused dependency from `ui/package.json`.

## R3 — Shared sidebar state

- **Decision**: Add `dashboardSidebarOpen: boolean` to `appSlice`, with `setDashboardSidebarOpen(boolean)` and `toggleDashboardSidebar()`. The navbar reads and toggles it. The dashboard reads it, sets it to false on a menu click at ≤ `NAVBAR_BREAKPOINT`, and resets it on unmount. Also add `dashboardSidebarOpen: false` to the `app` slice in `ui/src/entry-server.jsx` `preloadedState`, because `preloadedState.app` replaces the slice's initial state.
- **Rationale**: Navbar and Dashboard are sibling trees, and Redux is already the app's shared-state mechanism. A React context would need a new provider in both entry files.
- **Alternatives considered**: A `SidebarContext` provider. Rejected because it needs extra wiring in `entry-server.jsx` and `entry-client.jsx` for no gain.

## R4 — Compact detection (`useNavbarFit`)

- **Decision**: Add a `useNavbarFit(middleRef, linksRef, deps)` hook that uses a `ResizeObserver` on the middle column, plus re-measuring when `deps` change (links, user, siteData). The navbar becomes compact when `links.scrollWidth > middle.clientWidth`, and stops being compact only when `links.scrollWidth + 24 <= middle.clientWidth`. The hook returns `false` during SSR and before the first measurement. While compact, `<nav>` gets the `nav--compact` class. In that state, `.nav-links` stays in layout with `visibility:hidden; position:absolute; pointer-events:none` so it can still be measured, and `.hamburger` is shown.
- **Rationale**: This follows the blueprint's mechanism. The 24px hysteresis prevents flicker (SC-004). Below 1024px the media query already handles the layout before JavaScript runs, so there is no SSR flash.
- **Prerequisite**: The links' middle wrapper (currently `<div className='d-flex justify-content-center'>`) must become a measurable flex child (`.nav-middle { flex: 1 1 auto; min-width: 0; display:flex; justify-content:center; }`). Otherwise it grows to fit its content and overflow can never be detected.
- **Alternatives considered**: A fixed extra breakpoint such as 1280px. Rejected because it can't respond to the locale or to the number of links coming from siteData.

## R5 — Closing, Escape, outside click, focus

- **Decision**: Add a small `useDismissable({ open, onClose, panelRef, toggleRef })` hook. It listens for Escape (which closes the panel and focuses the toggle) and for `pointerdown` outside both the panel and the toggle (which closes it). When the panel opens, it moves focus to the panel's first focusable element. Both panels use it. It replaces the landing menu's existing `handleClickOutside` effect.
- **Rationale**: This closes the blueprint's "Known loose ends" with one shared, well-tested-by-use code path, instead of two copies.

## R6 — Landing menu appearance

- **Decision**: Keep GIC's drop-down `.mob-nav` look and the `isOpen` behaviour. Rename `isOpen` to `menuOpen` and delete the dead `menuOpen`/`toggleMenu`/`mobileView`/`showNavbar`/`NavLogo` code. The blueprint's slide-out panel with a background image is **out of scope**.
- **Rationale**: The request is about the button's behaviour. The visual style of the menu is GIC's own design.

## R7 — Avatar in the dashboard on mobile

- **Decision**: Render `User` in `.nav-right` when `isDashboard || !isMobile`. The menu holding the avatar never opens in the dashboard, so the avatar has to stay in the bar there (FR-014).

## R8 — Z-index

- **Decision**: Keep `nav` at 1000, `.mob-nav` at 999, the desktop sidebar at 999 and the mobile sidebar at 1001 with `top: $nav-height`. File Management's `UploadOverlay` (feature 018) is `position:absolute` inside its section at z 50, so the off-canvas sidebar (fixed, 1001) correctly stays above it. The blueprint's figure of 10002 doesn't apply to GIC.
