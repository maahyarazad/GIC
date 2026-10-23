# Implementation Plan: Board Meetings Wording and Blurred Rows for Visitors on the Events Page

**Branch**: `020-events-board-meeting-rename` | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/020-events-board-meeting-rename/spec.md`

## Summary

On the public `/events` page, every "Event(s)" in the page's own wording becomes "Board Meeting(s)". Visitors who aren't signed in get no real board meeting data. The unauthenticated `GET /api/v1/events/public` endpoint is removed, and the page renders 3 static, blurred, `aria-hidden` placeholder rows that link to Contact. Members keep loading real rows from the authenticated `GET /api/v1/events`. The shared `useEventAttendance` hook gains an optional `noun` so its messages say "board meeting" on this page and "event" in the dashboard.

## Technical Context

**Language/Version**: TypeScript (API: Node + tsx/tsc; UI: React 19 + Vite, SSR)

**Primary Dependencies**: Express + tsoa (generated routes/swagger), Mongoose; React, Redux Toolkit, react-router-dom 6

**Storage**: MongoDB, no changes

**Testing**: No automated test runner in the repo; manual scenarios in [quickstart.md](quickstart.md) plus `tsc` and `eslint`

**Target Platform**: Web (SSR + client hydration)

**Project Type**: Web application (API in `src/`, UI in `ui/`)

**Performance Goals**: No change; visitors make one fewer request

**Constraints**: No real board meeting detail may reach a visitor's browser (FR-005); dashboard wording unchanged (FR-013)

**Scale/Scope**: 1 page, 1 hook, 1 endpoint removal, 1 stylesheet

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template, so there are no ratified principles to gate on. Pass, both before research and after design. The design adds no new projects, dependencies or abstractions.

## Project Structure

### Documentation (this feature)

```text
specs/020-events-board-meeting-rename/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── events-api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── controllers/event.controller.ts   # remove getPublicEvents (GET /events/public)
├── routes/routes.ts                  # regenerated (tsoa:routes)
└── swagger/swagger.json              # regenerated (tsoa:spec)

ui/src/
├── api/events.ts                     # remove getPublicEvents
├── Hooks/useEventAttendance.ts       # optional `noun` parameter
└── Pages/Events/
    ├── EventsPage.tsx                # wording, visitor placeholders, member-only fetch
    ├── EventCard.tsx                 # optional `blurred` prop → class + aria-hidden
    ├── EventsPage.scss               # .ev-card--blurred
    └── EventsPage.css                # compiled from the .scss
```

**Structure Decision**: Existing web-app layout. The API change sits in `src/controllers`, and the UI changes stay inside `ui/src/Pages/Events` plus the shared hook.

## Design Notes

1. **Wording** (FR-001–003): hero `Board Meetings`; label `Board Meetings & Gatherings`; headings `Upcoming <em>Board Meetings</em>` / `Past <em>Board Meetings</em>`; type line `… · Members Board Meeting`; empty state `No upcoming board meetings are scheduled yet.`; error toast `Failed to fetch board meetings`. Admin-entered titles and descriptions are untouched.
2. **Visitor branch** (FR-004–009, [research R2/R3](research.md)): when `user` is null, skip fetching, keep `events` empty, render a constant `PLACEHOLDER_CARDS` (3 entries) through `EventCard` with `blurred`, and hide the Past section and the empty state. The click handler is unchanged, so it still goes to Contact.
3. **Member branch** (FR-010–012): fetch `getEvents()` only when `user` is set and auth isn't loading. When `user` becomes null, clear `events`.
4. **Blur style**: `.ev-card--blurred { filter: blur(6px); user-select: none; }`, with no transition, so reduced-motion needs no special rule. `EventCard` sets `aria-hidden` when blurred.
5. **Attendance wording** ([contract](contracts/events-api.md)): `useEventAttendance(fetchEvents, "board meeting")` on the page; dashboard call unchanged.
6. **Endpoint removal** ([contract](contracts/events-api.md)): delete the controller method, drop the now-unused `EventDto` import if unused, and regenerate routes and swagger.

## Complexity Tracking

No constitution violations to justify.
