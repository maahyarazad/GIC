---
description: "Task list for Newsletter Subscribers slide-out panel"
---

# Tasks: Newsletter Subscribers slide-out panel

**Input**: Design documents from `/specs/012-newsletter-subscribers-slide/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md

**Tests**: Not requested and the repo has no wired UI test runner; no test tasks are generated.
Validation is manual via `quickstart.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 / US2 from spec.md
- Exact file paths included per task

## Path Conventions

Frontend-only, under `ui/src/`. The repo has no `sass` dependency — ship compiled `.css` and import
`./X.css` (importing `.scss` breaks the Vite build).

---

## Phase 1: Setup

**Purpose**: Nothing to scaffold — the feature reuses the existing `NewsletterSubscribers` grid and
dashboard button styles. No setup tasks.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The slide-out primitive that User Story 1 renders the grid into. (User Story 2 does not
depend on this.)

**⚠️ CRITICAL**: US1 cannot begin until the panel exists.

> **Design change (per user request):** reuse the existing app-wide `SlideMenuProvider` /
> `SlideMenu` (`@/Providers/SlideMenuProvider`, backed by `Components/Generic/SlideMenu/SlideMenu`)
> — the exact slide-out `EmailTemplate.tsx` uses — instead of building a new component. It already
> handles Esc + backdrop close, `role="dialog"`/`aria-modal`, and mobile full-width, and is already
> mounted in `RootProviders.jsx` and `entry-server.jsx`. No new foundational component is needed.

- [x] T001 Reuse existing `ui/src/Providers/SlideMenuProvider.tsx` + `ui/src/Components/Generic/SlideMenu/SlideMenu.tsx` (no new component). Confirmed the provider is mounted globally and `openMenu(content, title, onClose?)` is available via `useSlideMenu()`.
- [x] T002 [P] No separate CSS needed — `SlideMenu` ships its own styling.

**Checkpoint**: `useSlideMenu().openMenu(...)` opens/closes a slide-out globally.

---

## Phase 3: User Story 1 - Open the subscribers panel from Newsletter (Priority: P1) 🎯 MVP

**Goal**: A button beside "New Article" opens a slide-out containing the full subscribers grid; closing returns to the newsletter list unchanged.

**Independent Test**: In Newsletter, click the button, confirm the grid appears in the slide-out with working paging/sort/filter, then close it via ✕/backdrop/Esc.

### Implementation for User Story 1

- [x] T003 [US1] In `ui/src/Components/Dashboard/Newsletter/Newsletter.tsx`, import `NewsletterSubscribers` and `useSlideMenu` (from `@/Providers/SlideMenuProvider`), and add `const { openMenu } = useSlideMenu()`.
- [x] T004 [US1] In the Newsletter list header (`.newsletter-header`, next to the "New Article" button), add a `<button className="dashboard-btn">` labeled "Newsletter Subscribers" (with `FaUsers` for parity with `FaPlus`) that calls `openMenu(<NewsletterSubscribers />, "Newsletter Subscribers")`. Depends on T003.
- [x] T005 [US1] (Covered by T004 — `openMenu` renders the grid in the shared `SlideMenu`; no per-page panel markup needed.)
- [x] T006 [US1] Verify the embedded grid keeps paging/sorting/filtering and its loading/empty/error states inside the slide menu (the `SlideMenu` is 80% width desktop / full-width mobile with its own scroll). Depends on T004.

**Checkpoint**: Subscribers grid is fully usable from the Newsletter slide-out; panel closes three ways.

---

## Phase 4: User Story 2 - Menu item removed, naming updated (Priority: P1)

**Goal**: The standalone "Email Subscribers" menu item is gone and all user-facing text reads "Newsletter Subscribers"; routing stays safe.

**Independent Test**: Open the Dashboard menu as admin and procurement — no "Email Subscribers"/"Email Subscription" item; a stale `?tab=newsletter_subscribers` link falls back to the default view.

### Implementation for User Story 2

- [x] T007 [US2] In `ui/src/Pages/Dashboard/Dashboard.tsx`, remove `newsletter_subscribers` from every map: the `MenuItem` union type, `accessControl`, `menuTitles`, the `isValidMenuItem` array, and `componentMap`; and remove the now-unused `NewsletterSubscribers` import (it moves to `Newsletter.tsx` in US1).
- [x] T008 [US2] Confirm no user-facing "Email Subscription"/"Email Subscribers" string remains for this feature (grep `ui/src`); the button and panel heading read "Newsletter Subscribers" (the `NewsletterSubscribers` component already renders that heading). Depends on T007.
- [x] T009 [US2] Verify tab routing: with `newsletter_subscribers` removed, `isValidMenuItem`/`getDefaultTab` resolve a stale `?tab=newsletter_subscribers` deep link to the role default without error. Depends on T007.

**Checkpoint**: Menu item removed; naming consistent; routing safe.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T010 [P] Typecheck: `cd ui && npx tsc --noEmit -p tsconfig.json` — confirm no new errors in `Newsletter.tsx`, `Dashboard.tsx`, or `SlideOutPanel.tsx` (pre-existing repo errors ignored).
- [ ] T011 Run `quickstart.md` Scenarios 1–5 (open/close, menu removal, rename, stale deep link, responsiveness) against the running app. (Manual — requires the running app; code is complete and typechecks, live run not executed this session.)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: blocks US1 only.
- **US1 (Phase 3)**: needs the `SlideOutPanel` (T001/T002).
- **US2 (Phase 4)**: independent of the panel; touches only `Dashboard.tsx`. Can run in parallel with Phase 2/3.
- **Polish (Phase 5)**: after US1 + US2.

### User Story Dependencies

- **US1 (P1)**: depends on Foundational.
- **US2 (P1)**: no dependency on US1. (Minor coordination: the `NewsletterSubscribers` import is removed from `Dashboard.tsx` in US2 and added to `Newsletter.tsx` in US1 — different files, no conflict.)

### Parallel Opportunities

- T001 ‖ T002 (component vs its CSS).
- All of US2 (T007–T009, `Dashboard.tsx`) can proceed in parallel with Foundational + US1 (different files).

---

## Parallel Example

```bash
# Foundational panel (two files):
Task: "Create SlideOutPanel.tsx"        # T001
Task: "Create SlideOutPanel.css"        # T002

# Independent of the panel, different file:
Task: "Remove newsletter_subscribers menu wiring in Dashboard.tsx"   # T007
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 2 Foundational (SlideOutPanel) → Phase 3 US1.
2. **STOP and VALIDATE**: quickstart Scenarios 1–2 (open/close + grid works). Shippable MVP.

### Incremental Delivery

1. US1 (panel + button) → demo.
2. US2 (remove menu item + confirm naming/routing) → demo.
3. Polish (typecheck + full quickstart).

---

## Notes

- Reuse `NewsletterSubscribers` verbatim — it already fetches `/newsletter` and renders the "Newsletter Subscribers" heading.
- No backend, API, or data-model changes.
- Import compiled `.css`, never `.scss` (no `sass` dep).
- Commit after each story; stop at checkpoints to validate independently.
