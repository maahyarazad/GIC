# Contract: My Events API (GIC server, `/api/v1`)

All responses use the existing envelope from `createSuccessResponse` / `createErrorResponse`.

## `GET /api/v1/my-events` — replaces the existing handler

- **Auth**: `@Middlewares(authMiddleware)` (cookie `token`; refresh supported). 401 otherwise.
- **Query params**: none accepted (client `sortField`, `filter_*`, etc. are ignored — research R3/S1).
- **200**
  ```json
  {
    "success": true,
    "message": "My events fetched",
    "data": {
      "items": [
        {
          "reference": "gic-aiiio-17760593471683233",
          "registeredAt": "2026-04-13T05:49:07.000Z",
          "attendeeName": "Jane Doe",
          "paymentStatus": null,
          "event": {
            "page": "artificial-intelligence-in-industrial-operations",
            "title": "Artificial Intelligence in Industrial Operations",
            "event_date": "2026-04-30",
            "event_time": "18:00",
            "event_location_name": "…",
            "Image": null
          }
        }
      ],
      "total": 1
    }
  }
  ```
  `items` follow the inclusion and ordering rules in [data-model.md](../data-model.md). Empty list → `items: [], total: 0`.
- **502** services unreachable / non-2xx: `"Events service unavailable"`.
- **Upstream calls** (via `servicesFetch`, `x-access-token`):
  1. `GET {SERVICES_ORIGIN}/api/registration-config?externalSource=gic`
  2. `GET {SERVICES_ORIGIN}/api/registration?filterField=email&filterOperator=contains&filterValue=<email>&page=1&pageSize=100&sortField=id&sortOrder=desc`

## `GET /api/v1/my-events/{reference}/qr` — replaces `GET /my-events/qr?event&event_id`

- **Auth**: `authMiddleware`.
- **Path**: `reference` matching `^[a-z0-9-]{1,64}$` → else **400** `"Invalid reference"`.
- **Ownership**: upstream `GET /api/registration?event_id=<reference>&page=1&pageSize=5`; a row with exact `event_id` and case-insensitive email match is required → else **404** `"Registration not found"`.
- **200**: body is the PNG stream (`Readable`), headers `Content-Type: image/png`, `Content-Disposition: inline; filename="<reference>.png"`, `Cache-Control: private, no-store`.
- **404** `"QR code not available"` when upstream `/api/qr?event=<row.event>&event_id=<reference>` returns 404.
- **502** other upstream failures.

## `GET /api/v1/events` — behaviour unchanged

Refactored to use `servicesFetch`; same response (`data` = `rows`).

## UI contract (Dashboard → Events)

| Element | Behaviour |
|---|---|
| Section order | **My Events** → Upcoming Events → Past Events; each section has its own loading / empty / error state |
| My Events card | `EventCard` (16:9, left date block) + footer: reference (monospace, truncated), payment status chip when present, **Show QR** button |
| My Events empty | "You haven't registered for any events yet." |
| My Events error | inline message + **Retry** (refetches only `/my-events`) |
| Show QR | `openModal({ title: event title, content: <MyEventQr reference/> })`; states: loading → image + reference + **Download** (`<reference>.png`) / "QR code not available yet" (404) / "Could not load the QR code" (other) |
| Card click (Upcoming/Past) | unchanged — SSO redirect to the services registration page |
| Card click (My Events) | opens the QR dialog |

Client helpers in `ui/src/api/myEvents.ts`: `getMyEvents(): Promise<MyEventRegistration[]>`, `getMyEventQr(reference): Promise<Blob>` (`responseType: "blob"`).
