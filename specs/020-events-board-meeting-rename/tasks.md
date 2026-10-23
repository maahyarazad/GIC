---

description: "Task list for Board Meetings wording and blurred visitor rows on the Events page"
---

# Tasks: Board Meetings Wording and Blurred Rows for Visitors on the Events Page

**Input**: Design documents from `/specs/020-events-board-meeting-rename/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/events-api.md, quickstart.md

**Tests**: Not requested, and the repo has no test runner. Validation is the manual scenarios in `quickstart.md` plus type-check and lint.

**Organization**: Tasks are grouped by user story so each can be implemented and checked on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Paths are repo-relative: API in `src/`, UI in `ui/src/`

---

## Phase 1: Setup (Shared Infrastructure)

No setup needed. The branch `020-events-board-meeting-rename` exists, and the change adds no dependencies or project structure.

---

## Phase 2: Foundational (Blocking Prerequisites)

No shared prerequisites. US1 and US2 touch overlapping lines of `ui/src/Pages/Events/EventsPage.tsx`, so do them one after the other (US1 first), not in parallel.

---

## Phase 3: User Story 1 - The page talks about Board Meetings, not Events (Priority: P1) 🎯 MVP

**Goal**: Every "Event(s)" in the Events page's own wording, and in the attendance messages shown from it, reads "Board Meeting(s)". The dashboard keeps "event".

**Independent Test**: Open `/events` signed out and signed in, and search the visible text for "event". It matches nothing except admin-entered titles. As a member, trigger "already attending" and "fully booked": both say "board meeting". In Dashboard → Events the same messages still say "event" (quickstart scenarios 6, 7, 8, 11).

### Implementation for User Story 1

- [X] T001 [P] [US1] In `ui/src/Hooks/useEventAttendance.ts`, add an optional second parameter `noun = "event"` to `useEventAttendance(onChanged, noun)`. Replace the module constants `ALREADY_ATTENDING` / `FULLY_BOOKED` with messages built from `noun` inside the hook ("You're already attending this {noun}", "This {noun} is fully booked") and use them for the local `myAttendance` / `isFull` toasts and the `kind === "exists"` toast. In the `EVENT_FULL` / `EVENT_PAST` catch branch, show the local fully-booked message when `noun !== "event"`, and otherwise keep `apiErrorMessage(error, fullyBooked)`. Add `noun` to the `useCallback` dependency list, and update the doc comment to mention the parameter. Don't change `ui/src/Components/Dashboard/Events/Events.tsx` (contract: `contracts/events-api.md`).
- [X] T002 [US1] Rename the page wording in `ui/src/Pages/Events/EventsPage.tsx`:
  - hero `<em>Events</em>` → `<em>Board Meetings</em>`
  - label `Events &amp; Gatherings` → `Board Meetings &amp; Gatherings`
  - `Upcoming <em>Events</em>` → `Upcoming <em>Board Meetings</em>`
  - `Past <em>Events</em>` → `Past <em>Board Meetings</em>`
  - type line `Members Event` → `Members Board Meeting`
  - empty state → `No upcoming board meetings are scheduled yet.`
  - error toast → `Failed to fetch board meetings`

  Don't touch `event.title` / `event.description`, the code names, the CSS classes or `#page-events` (FR-001–003).
- [X] T003 [US1] In `ui/src/Pages/Events/EventsPage.tsx`, call `useEventAttendance(fetchEvents, "board meeting")` (depends on T001).

**Checkpoint**: The wording is complete for members and visitors. US1 can ship alone.

---

## Phase 4: User Story 2 - Visitors see blurred placeholder rows (Priority: P1)

**Goal**: Visitors receive no real board meeting data and see 3 blurred, `aria-hidden` placeholder rows that link to Contact. Members see the real rows, clear.

**Independent Test**: Signed out, `/events` shows 3 blurred rows under "Upcoming Board Meetings" and no Past section. DevTools → Network shows no `/api/v1/events*` request, and View Source holds no real title or city. `GET /api/v1/events/public` returns no data. Sign in and the real rows show clear. Sign out and the placeholders return without a reload (quickstart scenarios 1–5, 9, 10).

### Implementation for User Story 2

- [X] T004 [P] [US2] Remove the `getPublicEvents` method (`@Get("/public")`) from `src/controllers/event.controller.ts`, and drop `EventDto` from the `../types/event.types` import if nothing else uses it (contract: `contracts/events-api.md`).
- [X] T005 [US2] Regenerate the tsoa output by running `npx tsoa routes && npx tsoa spec` at the repo root, then confirm `/api/v1/events/public` is gone from `src/routes/routes.ts` and `src/swagger/swagger.json` (depends on T004).
- [X] T006 [P] [US2] Delete `getPublicEvents` and its comment from `ui/src/api/events.ts`, and drop `EventDto` from the type import if it's now unused.
- [X] T007 [P] [US2] Add the blur style to `ui/src/Pages/Events/EventsPage.scss`, inside the existing `#page-events` block or alongside the `.ev-card` rules: `.ev-card--blurred { filter: blur(6px); user-select: none; cursor: pointer; }` with no transition. Add the identical compiled rule to `ui/src/Pages/Events/EventsPage.css`, which is the file the page imports.
- [X] T008 [P] [US2] In `ui/src/Pages/Events/EventCard.tsx`, add an optional `blurred?: boolean` prop. When it's true, add the class `ev-card--blurred` to the root `.ev-card` div and set `aria-hidden="true"` on it. Keep the `onClick` behaviour.
- [X] T009 [US2] Rework data loading in `ui/src/Pages/Events/EventsPage.tsx` (depends on T006, T002):
  - `fetchEvents` calls only `getEvents()`, and the `getPublicEvents` import is removed.
  - The effect runs `fetchEvents()` only when `!loading && user`. When `user` is null it calls `setEvents([])` and `_setLoading(false)`, so a sign-out clears the real rows (FR-011, FR-012).
- [X] T010 [US2] Add the visitor view in `ui/src/Pages/Events/EventsPage.tsx` (depends on T008, T009):
  - Define a module-level constant `PLACEHOLDER_CARDS` with 3 entries in the card shape `toCard` returns (`id`/`page` `placeholder-1..3`, generic text only: city "Members Only", day "··", monthLabel "Members Only", type "Upcoming · Members Board Meeting", title "Private Board Meeting", description "Details are shared with Club members.", meta `["Members Only", "Members Only", "Request Access"]`, plus the same `visStyle` / `dateStyle` / `cardStyle` pointer values).
  - When `!user`, render `PLACEHOLDER_CARDS` with `<EventCard blurred …>` in the upcoming section instead of `upcomingCards`, and hide both the empty-state paragraph and the Past section.
  - The existing `handleSelect` path, which sends visitors to `/contact` with `focus: "fullName"`, handles placeholder clicks unchanged (FR-004, FR-006, FR-006a, FR-008, FR-009).

**Checkpoint**: Visitors get placeholders only, and members get real rows. Both stories are complete.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [ ] T011 [P] Type-check and lint the UI: `cd ui && npx tsc --noEmit && npm run lint`. Fix any errors in the touched files.
- [ ] T012 [P] Type-check the API with `npx tsc --noEmit` at the repo root.
- [ ] T013 Run all 11 scenarios in `specs/020-events-board-meeting-rename/quickstart.md` and note any that fail.

---

## Dependencies & Execution Order

- **US1 (Phase 3)**: T001 → T003; T002 is independent of T001.
- **US2 (Phase 4)**: T004 → T005. T006, T007 and T008 are independent. T009 needs T006 and T002 (same file as US1), and T010 needs T008 and T009.
- **Polish**: after both stories.
- Story order: US1 then US2. Both are P1, but they edit the same page file, so doing them in sequence avoids conflicts. US2's API, style and card tasks (T004–T008) can run alongside US1.

## Parallel Example

```text
# Alongside US1's T001/T002:
T004 Remove GET /events/public in src/controllers/event.controller.ts
T006 Remove getPublicEvents in ui/src/api/events.ts
T007 Add .ev-card--blurred in ui/src/Pages/Events/EventsPage.scss + .css
T008 Add blurred prop in ui/src/Pages/Events/EventCard.tsx
```

## Implementation Strategy

1. **MVP**: Phase 3 (US1), the wording only, which ships safely alone.
2. **Increment**: Phase 4 (US2), which removes the public endpoint and adds the visitor placeholders. Ship the API removal (T004–T005) and the UI change (T006–T010) together, because an old UI build would show an error toast against a server without `/events/public`.
3. **Finish**: Phase 5 checks and the quickstart run.
