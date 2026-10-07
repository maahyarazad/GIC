# Research: Event Card Layout & My Events

All findings below were checked against the code (`src/controllers/event.controller.ts`, `ui/src/Components/Dashboard/Events/*`) and against the **running dev services server** (`SERVICES_SERVER_ORIGIN_DEV`, port 5501, source in the `registration-app` repo) on 2026-10-06.

## R1 — Which services endpoints back My Events

- **Decision**: Use the three existing services endpoints, all under `/api/*` (guarded by `authorize_admin`, which accepts the `x-access-token` external token):
  | Purpose | Services endpoint | Verified response |
  |---|---|---|
  | GIC events | `GET /api/registration-config?externalSource=gic` | `200 { status, message, rows: Event[] }` (2 rows in dev) |
  | Registrations | `GET /api/registration?<filters>&page&pageSize&sortField&sortOrder` | `200 { success, data, total, page, pageSize }`; rows are `registration` columns + `status` (LEFT JOIN `event_proforma_invoice`) |
  | QR image | `GET /api/qr?event=<page>&event_id=<reference>` | `200 image/png` from `qr-files/<page>/<reference>.png`, else `404 { success:false, message:"QR file not found" }` |
- **Origin selection**: `NODE_ENV === "PRODUCTION"` → `SERVICES_SERVER_ORIGIN_PROD`, else `SERVICES_SERVER_ORIGIN_DEV` (existing convention, `src/server.ts:34`). Centralised in one helper (R6).
- **Alternatives**: Calling services from the browser — rejected: would expose the external access secret/token and the services admin API.

## R2 — How to match a registration to the GIC user

- **Decision**: Resolve the user's email from `UserModel.findById(req.user.userId)` (fallback: `req.user.user_profile.email`), then query services with `filterField=email&filterOperator=contains&filterValue=<email>`, and on the GIC side keep only rows where `row.email.toLowerCase() === email.toLowerCase()` **and** `row.event` is the `page` of a GIC event from R1.
- **Rationale**:
  - The services `email=` filter is SQL `=`, which is case-sensitive in SQLite; members type their email freely on the registration form. `contains` → `LIKE`, which is case-insensitive for ASCII (verified: `filterValue=GERMAN` matched a lowercase address). The exact post-filter removes the extra matches a substring search can return (and any `%`/`_` wildcard effects).
  - Filtering by GIC event pages instead of `external_source=gic` also includes GIC-event registrations made directly on the services site. In dev only **1** of 218 registrations carries `external_source='gic'`, so relying on that tag alone would hide valid registrations.
  - Token payloads from `auth.controller.ts:117/206` have no `user_profile`; the existing `/my-events` crashes on them (`user.user_profile.email` of undefined). The user record is the source of truth.
- **Alternatives**: `email=` + `external_source=gic` (current code) — rejected for the case and tagging reasons above.
- Request params are fixed server-side: `page=1&pageSize=100&sortField=id&sortOrder=desc`.

## R3 — Security issues in the existing `/my-events` endpoints (must fix)

| # | Issue (verified) | Fix in this feature |
|---|---|---|
| S1 | `GET /my-events` forwards client `sortField` to services, which interpolates it raw into SQL (`ORDER BY ${sortField}` in `dbService._getAll`) → SQL injection through GIC. | Never forward client sort/filter params; constants only. |
| S2 | `GET /my-events/qr` has **no auth** and takes `event` + `event_id` from the client → anyone can fetch anyone's QR; values are not URL-encoded. Services `/api/qr` joins them into a file path (`path.join(qr-files, event, id + ".png")`) → path traversal to any `.png`. | New route `GET /my-events/{reference}/qr` behind `authMiddleware`; `reference` must match `^[a-z0-9-]{1,64}$`; ownership checked (R4); `event` taken from the stored registration; both values `encodeURIComponent`-ed. |
| S3 | `/my-events` verifies the cookie by hand (500 on missing token, no refresh). | Use `@Middlewares(authMiddleware)` like `businessLetter.controller.ts` (gets token refresh for free). |
| S4 | QR handler returns a `Buffer`; tsoa's `returnHandler` only pipes Readables and otherwise calls `res.json(data)`, so the client receives `{"type":"Buffer","data":[…]}` JSON, not a PNG. | Return `Readable.from(buffer)` (pattern from business-letter PDF). |
| S5 | Services side: `authorize_admin` calls `next()` even when `x-access-token` fails verification (verified: `x-access-token: garbage` → 200). | **Out of scope** (services repo) — reported to the user; GIC still signs valid tokens. |

## R4 — QR ownership check

- **Decision**: For `GET /my-events/{reference}/qr`: query services `/api/registration?event_id=<reference>&page=1&pageSize=5` → find a row with exact `event_id` and case-insensitive email match → 404 if none; otherwise call `/api/qr` with that row's `event`. Response: `image/png`, `Cache-Control: private, no-store`.
- **Rationale**: one extra small upstream call; avoids trusting client-supplied event page; 404 (not 403) does not reveal that another user's reference exists.

## R5 — Missing QR files

- **Finding**: QR files are created by services only when a registration is submitted with an `event_date` (or after payment, `payment.js:264`). The dev GIC registration (`gic-aiiio-…`) has **no** QR file (`qr-files/` directory absent in dev) → `/api/qr` returns 404.
- **Decision**: GIC maps upstream 404 → `404 { success:false, message:"QR code not available" }`; UI shows a neutral "QR code not available yet" message in the dialog (Spec 1.4). No QR generation in GIC (it would duplicate services' URL format `${CLIENT_ORIGIN}/guest-registration/<page>?guest-code=<reference>` and add a dependency).
- **Consequence for testing**: end-to-end "QR shown" needs a registration created through the services form in dev, or a QR PNG placed at `qr-files/<page>/<reference>.png` (see quickstart).

## R6 — Services client helper

- **Decision**: New `src/services/servicesServer.ts` exporting `getServicesOrigin()`, `servicesFetch(path, query)` (signs the external token with `EXTERNAL_ACCESS_SECRET`, sets `x-access-token`, 10s `AbortSignal.timeout`), used by `/events`, `/my-events`, and the QR route. Removes three copies of origin/token code.
- **Upstream errors**: network error/timeout → 502 `"Events service unavailable"`; upstream non-2xx → 502 (except QR 404 → 404).

## R7 — 16:9 cards

- **Decision**: `.card { aspect-ratio: 16 / 9; }` replacing `min-height: 300px`; `h-100` removed from the card so the ratio governs height. Supported by all evergreen browsers.
- Title: `font-size: clamp(1rem, 2.2vw, 1.4rem)`, `-webkit-line-clamp: 2` (the old 1.7rem / min-height 60px does not fit a ~170px-tall card at `col-xxl-3`).
- Background layers (image/video/fallback) are already `position:absolute; inset 0; object-fit: cover`, so they adapt.

## R8 — Date on the left

- **Decision**: Replace `.event-date-badge` (top-left chip) with `.event-date-block`: absolutely positioned on the left edge, full height, width ~22% (min 64px), dark translucent background (`rgba(0,0,0,.6)`), stacked `DD` (large) / `MMM` / `YYYY`, `<time dateTime="YYYY-MM-DD">`. Card body gets `padding-left` equal to the block width when a date exists so the title stays centered in the remaining area.
- **Alternatives**: Date column outside the card (card = `[date | 16:9 image]`) — viable if the user meant that; recorded as an assumption in the spec.

## R9 — Shared card component

- **Decision**: Extract the inline `renderEventCard` into `ui/src/Components/Dashboard/Events/EventCard.tsx` (props: `event`, `showUpcomingBadge`, `onClick`, optional `footer` node). My Events cards reuse it and add a footer strip (reference + "Show QR" button). Keeps one implementation of 16:9 + date block.
- QR dialog: existing `useModal().openModal({ title, content })` (`ui/src/Providers/ModalContext.tsx`); content component fetches the PNG as a blob via `axiosInstance` (`responseType: "blob"`), shows it via `URL.createObjectURL`, revokes on unmount. Download = `<a download="<reference>.png">`.

## R10 — Testing

- No automated test runner in the repo (same as 001). Validation = `npm run build` (tsoa + tsc), `ui` build, curl scenarios against the GIC server and services dev server, and visual checks in [quickstart.md](./quickstart.md).
