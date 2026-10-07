# Data Model: Event Card Layout & My Events

No new GIC storage. All data is read from the services platform and reshaped by the GIC server. Types live in `src/types/event.types.ts` (already imported by the UI).

## Upstream: `ServicesRegistrationRow` (services `registration` table + join)

| Field | Type | Notes |
|---|---|---|
| `id` | number | services row id |
| `event` | string | event page slug → joins `Event.page` |
| `event_id` | string | registration reference, e.g. `gic-aiiio-17760593471683233` (`[a-z0-9-]`) |
| `email` | string | matched case-insensitively to the user |
| `firstName`, `lastName`, `companyName` | string \| null | |
| `metadata_createdAt` | string `YYYY-MM-DD HH:mm:ss` (UTC) | registered-on |
| `external_source` | string | `'gic'` or `''` — **not** used for matching (research R2) |
| `status` | string \| null | payment status from `event_proforma_invoice` |

## Upstream: `Event` (existing type, services `registration_config`)

Used fields: `page`, `title`, `event_date`, `event_time`, `event_location_name`, `Image`, `archived`.

## GIC DTO: `MyEventRegistration` (new)

| Field | Type | Source / rule |
|---|---|---|
| `reference` | string | `row.event_id` |
| `registeredAt` | string (ISO 8601) | `row.metadata_createdAt` parsed as UTC; `null` if unparsable |
| `attendeeName` | string | `firstName + " " + lastName`, trimmed |
| `paymentStatus` | string \| null | `row.status` |
| `event` | `{ page, title, event_date, event_time, event_location_name, Image }` | GIC `Event` whose `page === row.event` |

**Inclusion rule**: `row.email.trim().toLowerCase() === userEmail.toLowerCase()` AND a GIC `Event` with `page === row.event` exists.
**Order**: `event.event_date` desc (undated last), then `registeredAt` desc.

## Validation

- `reference` path param: `^[a-z0-9-]{1,64}$`, else 400.
- Ownership: QR returned only if a services row with `event_id === reference` passes the inclusion rule's email check; else 404.

## Relationships

`User (GIC, Mongo) 1 —email— * ServicesRegistrationRow * —event=page— 1 Event`; `ServicesRegistrationRow 1 — 0..1 QR PNG` at `qr-files/<event>/<event_id>.png`.
