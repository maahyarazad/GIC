# Quickstart: Validate Board Meetings Wording and Blurred Rows

**Feature**: `020-events-board-meeting-rename`

## Prerequisites

- MongoDB with at least one upcoming and one past board meeting (seed via Dashboard → Events as admin).
- A member account, and a second browser profile or private window for the visitor.

## Run

```sh
npm run dev              # API (regenerates tsoa routes + swagger)
cd ui && npm run dev     # UI
```

Static checks: `cd ui && npx tsc --noEmit && npm run lint`, and `npx tsc --noEmit` at the repo root.

## Scenarios

1. **Endpoint removed** (FR-005, [contract](contracts/events-api.md)): request `GET /api/v1/events/public`. The response contains no `items` / no board meeting data.
2. **Visitor view** (FR-004, FR-006, FR-006a, FR-008): signed out, open `/events`. The hero reads "Board Meetings" and 3 blurred rows appear under "Upcoming Board Meetings". There's no Past section and no empty-state message, and headings and "Request Access" are sharp.
3. **No leak** (SC-002): signed out, check DevTools → Network and View Source. There's no request to `/api/v1/events*`, and no real title, city or date appears.
4. **Placeholder accessibility** (FR-007): try to select row text, which fails. In the accessibility tree the rows are hidden.
5. **Click goes to Contact** (FR-009): click a blurred row. Contact opens with the name field focused.
6. **Member view** (FR-010, US1): sign in and open `/events`. Real rows are clear, the type lines read "Upcoming · Members Board Meeting" / "Past · Members Board Meeting", and the section heads read "Board Meetings & Gatherings", "Upcoming Board Meetings" and "Past Board Meetings".
7. **Attendance wording** (FR-002): as a member, click a row you already attend → "You're already attending this board meeting". Click a full one → "This board meeting is fully booked".
8. **Dashboard unchanged** (FR-013): do the same in Dashboard → Events. The messages still say "event".
9. **Sign-out** (FR-012): on `/events` as a member, sign out. The rows switch to the blurred placeholders without a reload.
10. **No flash** (SC-005): signed out, reload `/events` 10 times. No clear or real row ever appears.
11. **Wording sweep** (SC-001): on `/events`, signed out and in, use Ctrl+F for "event". Nothing matches in the page's own text (admin-entered titles excepted).
