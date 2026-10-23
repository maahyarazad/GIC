# Data Model: Board Meetings Wording and Blurred Rows for Visitors

**Feature**: `020-events-board-meeting-rename` | **Date**: 2026-10-23

No stored data changes. The `Event` collection, `EventDto` and `MemberEventDto` stay as they are. The only new shapes are client-side view state.

## Events page view (client state)

| State | Condition | What renders |
|-------|-----------|--------------|
| Visitor | `auth.user` is null (initial state, SSR, signed out) | 3 placeholder rows under "Upcoming Board Meetings"; Past section and empty state hidden; no events request |
| Member, loading | `auth.user` set, member list not yet returned | Same as Visitor (no real data yet) |
| Member, loaded | `auth.user` set, `getEvents()` returned | Real upcoming and past rows, clear; empty state if no upcoming rows |
| Member, load failed | `getEvents()` rejected | Toast "Failed to fetch board meetings"; no real rows |

Transitions: Visitor → Member, loading on sign-in; Member, loaded → Visitor on sign-out (loaded rows are cleared).

## Placeholder row

A fixed constant in the page with the same fields as the existing card shape (`city`, `day`, `monthLabel`, `type`, `title`, `description`, `meta`). Rules:

- It contains no value derived from any real board meeting (FR-006).
- There are always exactly 3 of them, whatever the real count (FR-006a).
- It's rendered with `aria-hidden="true"`, a blur style and no text selection (FR-004, FR-007), and clicking it opens Contact with the name field focused (FR-009).

## Card wording (members and placeholders)

- Type line: `"{Upcoming|Past} · Members Board Meeting"`.
- `meta` values are unchanged ("Members Only", "Attending", "Fully Booked", "Confirm Attendance").
