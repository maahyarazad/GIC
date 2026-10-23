# Research: Board Meetings Wording and Blurred Rows for Visitors

**Feature**: `020-events-board-meeting-rename` | **Date**: 2026-10-23

## R1. How visitors stop receiving real board meeting details (FR-005)

- **Decision**: Remove `GET /api/v1/events/public` (the `getPublicEvents` method in `src/controllers/event.controller.ts`), regenerate `src/routes/routes.ts` and `src/swagger/swagger.json` with `npm run tsoa:routes && npm run tsoa:spec`, and delete `getPublicEvents` from `ui/src/api/events.ts`. Visitors on the Events page make no events request at all.
- **Rationale**: The page is the only caller (confirmed with a repo-wide search for `events/public`). A blur alone leaves the data in the response, and keeping an unused unauthenticated endpoint would leak the same details to anyone calling it directly. Members already use the authenticated `GET /api/v1/events`.
- **Alternatives considered**:
  - Keep the endpoint but return redacted rows: it still reveals how many meetings exist (FR-006), and the client would ignore the data anyway.
  - Keep the endpoint and just stop calling it: the details stay publicly reachable, so FR-005 / SC-002 would not hold.

## R2. Placeholder rows

- **Decision**: For visitors, render 3 static placeholder cards in the upcoming section, built from one constant array in `EventsPage.tsx` with generic text (for example city "Members Only", day "··", title "Private Board Meeting", description "Details are shared with Club members."). Hide the Past section and the empty state for visitors. Each placeholder gets `aria-hidden="true"`, a blur class (CSS `filter: blur(...)`, `user-select: none`, `pointer-events` kept so a click still goes to Contact).
- **Rationale**: Static content can't leak anything (FR-006), and a fixed count says nothing about the real number of meetings. The 3-upcoming/past-hidden layout is the recommended default from clarification question 2, which wasn't answered before planning (see spec Assumptions).
- **Alternatives considered**: Grey skeleton blocks without text, which looks like a broken load rather than a members-only teaser. A full-page overlay, which wasn't requested.

## R3. Sign-in timing and sign-out (FR-011, FR-012)

- **Decision**: Derive the view from `state.auth.user`. While `user` is null (which is also the initial state, `loading: false`), show placeholders and clear any loaded rows. Fetch `getEvents()` only once `user` is set and `loading` is false. On sign-out, `user` goes null, so the page clears `events` and renders placeholders again.
- **Rationale**: `authSlice` starts with `user: null`, and SSR renders without a user, so the server HTML and the first client paint are always the placeholder view. Real rows exist only after an authenticated response. A member briefly seeing placeholders before their rows load is acceptable and leaks nothing.
- **Alternatives considered**: A separate loading spinner while auth resolves, which adds UI the spec doesn't ask for.

## R4. Wording in the shared attendance hook (FR-002, FR-013)

- **Decision**: Give `useEventAttendance` an optional second argument, `noun` (default `"event"`). The two local messages ("You're already attending this {noun}", "This {noun} is fully booked") use it. When `noun` isn't the default, the hook shows its local message for `EVENT_FULL` / `EVENT_PAST` instead of the server's message (which says "event"). The Events page passes `"board meeting"`; the dashboard keeps the default.
- **Rationale**: The dashboard must keep "event" (FR-013), and server messages are shared with other clients, so the server isn't changed. The confirmation dialog title, body and success toast contain no "event" today, so they need no change.
- **Alternatives considered**: Changing the server messages, which would alter the dashboard. A copy of the hook for the page, which would duplicate the in-flight/seat logic.

## R5. Things kept unchanged

- The browser tab title comes from the URL path (`TitleManager`, "German Industry Club | Events") and the navbar/footer labels live outside the page. Both stay, per spec Assumptions and FR-013.
- The names `EventsPage`, `EventCard`, CSS classes `ev-*` and `#page-events` stay. Only user-visible wording changes.

## R6. Testing

- **Decision**: The repo has no automated test runner for the UI or the API (no `test` script in either `package.json`). Validation is the manual checks in `quickstart.md`, plus `tsc` and `npm run lint` in `ui/`.
