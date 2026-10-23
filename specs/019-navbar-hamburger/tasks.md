---

description: "Task list for feature 019 — One Navbar Hamburger"
---

# Tasks: One Navbar Hamburger for Landing Menu and Dashboard Sidebar

**Input**: Design documents from `/specs/019-navbar-hamburger/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/navbar-ui.md, quickstart.md

**Tests**: Not requested, and there is no UI test framework. Each story is validated with [quickstart.md](./quickstart.md).

**Organization**: Grouped by user story. US2 and US3 both edit `Navbar.tsx` after US1, so the stories are independently testable but should be built in order P1 → P2 → P3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = dashboard single button, US2 = landing compact mode, US3 = keyboard / outside click
- All paths are under `ui/src/` unless they start with `specs/` or the repo root

**SCSS note**: The repo has no Sass compiler installed. The committed `.css` files come from an editor watcher that also autoprefixes, so recompiling with plain `sass` would drop prefixes such as `-moz-placeholder` and `-o-object-fit`. For each `.scss` change, make the same minimal change by hand in the matching `.css`, and verify it with `npx --yes sass@1.77.8 --no-source-map <file>.scss /tmp/out.css` followed by a diff. The only differences should be the known prefix and quote differences.

---

## Phase 1: Setup

- [X] T001 Confirm you are on branch `019-navbar-hamburger` based on `origin/main` (`7222877` or later) and that `.specify/feature.json` points at `specs/019-navbar-hamburger`. Move `NAVBAR_HAMBURGER_BLUEPRINT.md` from the repo root to `specs/019-navbar-hamburger/blueprint-source.md`, keeping it unchanged as the reference input

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Single-source constants and the shared sidebar flag that US1–US3 all build on.

- [X] T002 [P] Create `ui/src/styles/_navbar.scss` containing `$nav-height: 70px;` and `$navbar-breakpoint: 1024px;`, with a comment saying they must stay in sync with `ui/src/Components/Navbar/navbarConfig.ts` (research R1)
- [X] T003 [P] Create `ui/src/Components/Navbar/navbarConfig.ts` exporting `NAVBAR_BREAKPOINT = 1024`, `NAVBAR_HEIGHT = 70` and `NAVBAR_FIT_HYSTERESIS = 24`, plus `isNavbarCollapsedWidth = () => typeof window !== "undefined" && window.innerWidth <= NAVBAR_BREAKPOINT`. Add a comment pointing to `ui/src/styles/_navbar.scss`
- [X] T004 In `ui/src/index.scss` (depends on T002):
  - Add `@use "./styles/navbar" as navbar;` as the first statement.
  - Change line ~456 to `$bp-tablet: navbar.$navbar-breakpoint;`.
  - Replace the literal `70px` in `nav { height }` (~645), `.mob-nav { top }` (~800) and `.ptnav { padding-top }` (~2567) with `navbar.$nav-height`.
  - Leave the two pre-existing `@media (max-width: 1024px)` blocks (~1007, ~2450) alone, because they are page layouts and not navbar rules.
  - Regenerate `ui/src/index.css`.
- [X] T005 [P] In `ui/src/features/appSlice.ts`, add `dashboardSidebarOpen: boolean` to `AppState` and `dashboardSidebarOpen: false` to `initialState`. Add reducers `setDashboardSidebarOpen(state, action: PayloadAction<boolean>)` and `toggleDashboardSidebar(state)`, and export both actions alongside `setReady` (data-model.md)
- [X] T006 [P] In `ui/src/entry-server.jsx`, add `dashboardSidebarOpen: false` to `preloadedState.app`, because that object replaces the slice's initial state during SSR

**Checkpoint**: The app builds and the new constants and flag exist, with no behaviour change yet.

---

## Phase 3: User Story 1 - The navbar hamburger opens the dashboard sidebar (Priority: P1) 🎯 MVP

**Goal**: On `/dashboard…` at ≤ 1024px, the navbar hamburger is the only toggle. It opens the sidebar below the navbar and shows its X state. The sidebar closes when a section is picked or the user leaves the dashboard, and the avatar stays in the bar.

**Independent Test**: [quickstart.md §1](./quickstart.md#1-dashboard-one-button-us1).

### Implementation for User Story 1

- [X] T007 [P] [US1] In `ui/src/Pages/Dashboard/Dashboard.scss`:
  - Add `@use "../../styles/navbar" as navbar;` at the top.
  - Change `@media (min-width: 768px)` to `@media (min-width: navbar.$navbar-breakpoint + 1)` and `@media (max-width: 767px)` to `@media (max-width: navbar.$navbar-breakpoint)`.
  - Replace the literal `70px` values (desktop sidebar `top`, `margin-top` and `height: calc(100dvh - 70px)` at ~81–84, and the `margin-top: 70px` at ~192) with `navbar.$nav-height`.
  - In the mobile block, change the sidebar's `top: 0` to `top: navbar.$nav-height`.
  - Delete every `.close-btn` and `.open-sidebar-btn` rule in both media blocks.
  - Regenerate `Dashboard.css` and `Dashboard.css.map` (contracts/navbar-ui.md, "Dashboard sidebar").
- [X] T008 [US1] In `ui/src/Pages/Dashboard/Dashboard.tsx` (depends on T003, T005):
  - Replace `const [isSidebarOpen, setSidebarOpen] = useState(false)` with `const isSidebarOpen = useSelector((s: RootState) => s.app.dashboardSidebarOpen)` and `const dispatch = useDispatch()`, importing `useDispatch` and `setDashboardSidebarOpen`.
  - In `handleMenuClick`, replace `window.innerWidth < 768` with `isNavbarCollapsedWidth()` from `@/Components/Navbar/navbarConfig`, and call `dispatch(setDashboardSidebarOpen(false))`.
  - Add `useEffect(() => () => { dispatch(setDashboardSidebarOpen(false)); }, [dispatch])` so the sidebar closes on unmount.
  - Remove the `<button className="close-btn">` and the `<button className="open-sidebar-btn">`.
  - Give the aside `id="dashboard-sidebar"`.
- [X] T009 [US1] In `ui/src/Components/Navbar/Navbar.tsx` (depends on T005):
  - Add `const inDashboard = isDashboard`, then `const sidebarOpen = useSelector((s: RootState) => s.app.dashboardSidebarOpen)`, `const dispatch = useDispatch()` and `const toggleSidebar = useCallback(() => dispatch(toggleDashboardSidebar()), [dispatch])`.
  - Replace `<div className="hamburger" id="hamburger" onClick={toggleMob}>` with `<button type="button" ref={hamburgerRef} className={`hamburger${panelOpen ? " open" : ""}`} aria-label={panelOpen ? "Close menu" : "Open menu"} aria-expanded={panelOpen} aria-controls={inDashboard ? "dashboard-sidebar" : "mobile-nav"} onClick={inDashboard ? toggleSidebar : toggleMob}>`, where `panelOpen = inDashboard ? sidebarOpen : isOpen` and the same three `<span>`s are kept.
  - Give the `.mob-nav` div `id="mobile-nav"`.
  - Never open `.mob-nav` on dashboard routes: guard `toggleMob`, and add `useEffect(() => { if (inDashboard) setIsOpen(false); }, [inDashboard])`.
- [X] T010 [US1] In `ui/src/Components/Navbar/Navbar.tsx`, change `{isMobile ? null : User}` in `.nav-right` to `{isMobile && !inDashboard ? null : User}`, and render `{User}` inside `.mob-nav` only when `!inDashboard`, so the avatar stays in the bar on dashboard routes (FR-014, research R7)
- [X] T011 [P] [US1] In `ui/src/index.scss` (`.hamburger` block, ~774), add button resets so the element looks the same as the old div: `background: none; border: 0; appearance: none; color: inherit;`, plus a `&:focus-visible { outline: 2px solid var(--ora); outline-offset: 2px; }` style. Regenerate `ui/src/index.css`

**Checkpoint**: US1 passes quickstart §1 on its own and can ship as the MVP.

---

## Phase 4: User Story 2 - The landing hamburger also appears when the links don't fit (Priority: P2)

**Goal**: On landing routes above 1024px, the navbar switches to the hamburger whenever its links overflow, uses hysteresis, and closes the menu when it leaves compact mode.

**Independent Test**: [quickstart.md §2](./quickstart.md#2-landing-compact-mode-us2).

### Implementation for User Story 2

- [X] T012 [P] [US2] Create `ui/src/Components/Navbar/useNavbarFit.ts` exporting `useNavbarFit(middleRef: RefObject<HTMLElement>, linksRef: RefObject<HTMLElement>, deps: unknown[]): boolean` (research R4):
  - `useState(false)`.
  - In a `useLayoutEffect` guarded by `typeof window !== "undefined"`, define `measure()`. With `need = links.scrollWidth` and `have = middle.clientWidth`, call `setCompact(prev => prev ? need + NAVBAR_FIT_HYSTERESIS > have : need > have)`.
  - Observe `middleRef.current` with `ResizeObserver(measure)`, run `measure()` once, and disconnect on cleanup.
  - Re-run when `deps` change.
- [X] T013 [US2] In `ui/src/Components/Navbar/Navbar.tsx` (depends on T012):
  - Replace the links wrapper `<div className='d-flex justify-content-center'>` with `<div className="nav-middle" ref={middleRef}>`, and add `ref={linksRef}` to `<ul className="nav-links">`.
  - Call `const compact = useNavbarFit(middleRef, linksRef, [navbarLinks, user, currentlanguage])`. Force it to `false` when `inDashboard`, because the links are hidden there.
  - Add `className={compact ? "nav--compact" : undefined}` to `<nav>`.
  - Add `useEffect(() => { if (!compact) setIsOpen(false); }, [compact])`, but only if the window is wider than the breakpoint, so that crossing below 1024px (where the media query takes over) doesn't close an open menu: `if (!compact && !isNavbarCollapsedWidth()) setIsOpen(false)`.
- [X] T014 [P] [US2] In `ui/src/index.scss` (navigation section, after `.nav-links`):
  - Add `.nav-middle { flex: 1 1 auto; min-width: 0; display: flex; justify-content: center; overflow: hidden; }`.
  - Add `nav.nav--compact { .nav-links { visibility: hidden; position: absolute; pointer-events: none; } .hamburger { display: flex; } }`.
  - Make sure `.nav-links` keeps `flex-wrap: nowrap; white-space: nowrap;` so overflow shows up as `scrollWidth`.
  - Regenerate `ui/src/index.css`.
- [X] T015 [US2] In `ui/src/Components/Navbar/Navbar.tsx`, rename the landing menu state `isOpen`/`setIsOpen`/`toggleMob`/`closeMob` to `menuOpen`/`setMenuOpen`/`toggleMenu`/`closeMenu`, after deleting the dead `menuOpen`/`toggleMenu` pair and the `scrollToForm`'s `.mobile-menu.open` query (which now uses `setMenuOpen(false)` directly). Also delete the unused `mobileView`, `showNavbar` (and its scroll/resize effect), `NavLogo`, `GetStarted`/`shouldScroll` if unreferenced, and the empty `useEffect`s on `siteData`/`_navLinks`. Keep every call site working, including `handleScroll`'s `setMenuOpen(false)`

**Checkpoint**: US2 passes quickstart §2, and US1 still passes §1.

---

## Phase 5: User Story 3 - Keyboard and outside-click closing (Priority: P3)

**Goal**: Both panels close on Escape or an outside click, move focus into themselves when opened, and return focus to the hamburger on Escape.

**Independent Test**: [quickstart.md §3](./quickstart.md#3-keyboard-and-outside-click-us3).

### Implementation for User Story 3

- [X] T016 [P] [US3] Create `ui/src/Components/Navbar/useDismissable.ts` exporting `useDismissable({ open, onClose, panelRef, toggleRef }: { open: boolean; onClose: () => void; panelRef: RefObject<HTMLElement>; toggleRef: RefObject<HTMLElement> })` (research R5). While `open` is true:
  - On `keydown` Escape, call `onClose()` and then `toggleRef.current?.focus()`.
  - On a `pointerdown` whose target is outside both `panelRef.current` and `toggleRef.current`, call `onClose()`.
  - When `open` becomes true, focus the first element matching `a[href], button, [tabindex]:not([tabindex="-1"]), [role="button"]` inside the panel, using `requestAnimationFrame` so the slide-in has started.
  - Remove the listeners on cleanup.
- [X] T017 [US3] In `ui/src/Components/Navbar/Navbar.tsx` (depends on T016):
  - Delete the old `handleClickOutside` effect.
  - For the landing menu, call `useDismissable({ open: menuOpen && !inDashboard, onClose: closeMenu, panelRef: mobNavRef, toggleRef: hamburgerRef })`.
  - For the dashboard sidebar, call `useDismissable({ open: inDashboard && sidebarOpen && isNavbarCollapsedWidth(), onClose: () => dispatch(setDashboardSidebarOpen(false)), panelRef: sidebarRef, toggleRef: hamburgerRef })`, where `sidebarRef` is `useRef<HTMLElement | null>(null)` assigned in an effect via `document.getElementById("dashboard-sidebar")` whenever `inDashboard`/`sidebarOpen` changes. The sidebar lives in the Dashboard tree, so the navbar can't hold a direct ref to it.
- [X] T018 [US3] In `ui/src/Pages/Dashboard/Dashboard.tsx`, check that the sidebar `li[role="button"]` items handle `Enter` and `Space` via `onKeyDown`, calling `handleMenuClick(item)`. Add this if it is missing, so the focus moved there by T017 can be used to select a section

**Checkpoint**: All three stories pass quickstart §1–§3.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T019 [P] Rewrite `specs/019-navbar-hamburger/blueprint-source.md` into `docs`-style reference text matching GIC: 70px, 1024px, `.mob-nav`, the CSS `.hamburger`, the new hook and file names, and the updated z-index table (nav 1000, `.mob-nav` 999, sidebar 999 desktop / 1001 mobile, File Management `UploadOverlay` 50 within its section). Save it at the repo root as `NAVBAR_HAMBURGER_BLUEPRINT.md` and drop the source copy
- [X] T020 [P] Remove the unused `@animated-burgers/burger-rotate` dependency from `ui/package.json` after confirming that `grep -rn "burger-rotate" ui/src src` and the Vite SSR config in `src/server.ts` and `ui/vite.config.*` have no references (research R2)
- [X] T021 Run `cd ui && npx vite build --outDir <scratch dir>` and `npx tsc --noEmit -p ui/tsconfig.json`. The UI error count must not rise above the baseline of 75, and there must be no new errors in `Navbar.tsx`, `Dashboard.tsx`, `appSlice.ts` or the new hooks
- [ ] T022 Run the full quickstart (`specs/019-navbar-hamburger/quickstart.md` §1–§4) at 390, 768, 1024, 1100, 1280 and 1440px, in both themes and both locales, with SSR. Check the console for hydration warnings, and record any failure as a follow-up task here

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** comes before **Foundational (T002–T006)**, which comes before **US1**, then **US2**, then **US3**, then **Polish**.
- US2 and US3 depend on US1's `Navbar.tsx` changes (`inDashboard`, the `<button>` hamburger and `hamburgerRef`), so build them in priority order. Each still has its own independent quickstart section.

### Within Phases

- Foundational: T002 ∥ T003 ∥ T005 ∥ T006, and T004 comes after T002.
- US1: T007 ∥ T011 (different stylesheets); T008 after T003 and T005; T009, then T010 (same file).
- US2: T012 ∥ T014; T013 after T012; T015 after T013 (same file).
- US3: T016, then T017; T018 is independent (it touches `Dashboard.tsx`) and can run alongside T016.
- Polish: T019 ∥ T020, then T021, then T022.

### Parallel Example: Foundational

```text
Task: "T002 Create ui/src/styles/_navbar.scss"
Task: "T003 Create ui/src/Components/Navbar/navbarConfig.ts"
Task: "T005 Add dashboardSidebarOpen to ui/src/features/appSlice.ts"
Task: "T006 Add dashboardSidebarOpen to preloadedState in ui/src/entry-server.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001–T006: setup and foundations.
2. T007–T011: one hamburger in the dashboard.
3. **Stop and validate** with quickstart §1. This already removes the duplicate buttons and the sidebar covering the navbar.

### Incremental Delivery

1. US1 first, then US2 (compact mode, plus the cleanup of unused code in `Navbar.tsx`), then US3 (Escape, outside click and focus).
2. Polish last: blueprint rewrite, dependency cleanup, build, and the full viewport matrix.

### Notes

- Commit each `.scss` change together with its regenerated `.css`.
- The breakpoint change from 767px to 1024px (T007) is the one visible layout change for tablets. To revert it, change `$navbar-breakpoint` and `NAVBAR_BREAKPOINT`.
