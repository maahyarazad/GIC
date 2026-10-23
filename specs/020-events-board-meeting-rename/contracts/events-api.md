# Contract: Events API changes

**Feature**: `020-events-board-meeting-rename`

## Removed: `GET /api/v1/events/public`

- **Before**: unauthenticated, returned `{ data: { items: EventDto[] } }` with every board meeting, upcoming and past.
- **After**: the route no longer exists. A request falls through to the SSR handler like any unknown path, and no board meeting data is returned.
- **Callers**: only `ui/src/api/events.ts#getPublicEvents`, which is removed with it.
- Regenerated files: `src/routes/routes.ts`, `src/swagger/swagger.json`.

## Unchanged

- `GET /api/v1/events` (auth required): the only source of board meeting rows for the Events page.
- `POST /api/v1/events/{id}/attendance`: unchanged, including its error messages and codes (`ALREADY_ATTENDING`, `EVENT_FULL`, `EVENT_PAST`).

# Contract: `useEventAttendance(onChanged, noun?)`

| Parameter | Type | Default | Meaning |
|-----------|------|---------|---------|
| `onChanged` | `() => void` | — | As today |
| `noun` | `string` | `"event"` | Word used in "You're already attending this {noun}" and "This {noun} is fully booked" |

When `noun !== "event"`, the `EVENT_FULL` / `EVENT_PAST` toast uses the local "This {noun} is fully booked" message instead of the server message. Callers: Events page passes `"board meeting"`, and Dashboard → Events passes nothing, so its behaviour is unchanged.
