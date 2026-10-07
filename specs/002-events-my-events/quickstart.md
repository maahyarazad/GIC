# Quickstart: validating Event Card Layout & My Events

## Prerequisites

- Services dev server running on `SERVICES_SERVER_ORIGIN_DEV` (`http://localhost:5501`; `registration-app` repo).
- GIC `.env` with `SERVICES_SERVER_ORIGIN_DEV`, `SERVICES_SERVER_ORIGIN_PROD`, `EXTERNAL_ACCESS_SECRET` (same secret as the services server), `JWT_SECRET`.
- A GIC user whose email has at least one registration for a GIC event on the services server (dev has one: event `artificial-intelligence-in-industrial-operations`, reference `gic-aiiio-17760593471683233`).

## 1. Build

```bash
npm run build            # tsoa routes + spec + tsc — must pass
(cd ui && npm run build) # must pass
npm run dev              # GIC server on PORT (5612)
```

## 2. Upstream sanity (services server directly)

Sign a short-lived token with `EXTERNAL_ACCESS_SECRET` (`jwt.sign({}, secret, { expiresIn: "30s" })`) and send it as `x-access-token`:

| Request | Expected |
|---|---|
| `GET /api/registration-config?externalSource=gic` | 200, `rows[]` of GIC events |
| `GET /api/registration?filterField=email&filterOperator=contains&filterValue=<UPPERCASED email>&pageSize=5` | 200, the user's rows (case-insensitive) |
| `GET /api/qr?event=<page>&event_id=<reference>` | 200 PNG, or 404 if no file (dev default) |

To make the QR exist in dev, register through the services form for a dated GIC event, or place any PNG at `<registration-app>/qr-files/<page>/<reference>.png`.

## 3. GIC API scenarios (cookie `token` from a browser login)

| # | Request | Expected |
|---|---|---|
| A1 | `GET /api/v1/my-events` without cookie | 401 |
| A2 | `GET /api/v1/my-events` as the test user | 200, `items` contains the reference; no non-GIC events |
| A3 | `GET /api/v1/my-events?sortField=id;DROP` | same as A2 (param ignored) |
| A4 | `GET /api/v1/my-events/<reference>/qr` (file present) | 200, `content-type: image/png`, opens as an image (`file` reports PNG) |
| A5 | same, file absent | 404 `QR code not available` |
| A6 | `GET /api/v1/my-events/<another user's reference>/qr` | 404 `Registration not found` |
| A7 | `GET /api/v1/my-events/..%2F..%2Fx/qr` | 400 `Invalid reference` |
| A8 | old `GET /api/v1/my-events/qr?event=…&event_id=…` | 404 (route removed) |
| A9 | stop the services server, `GET /api/v1/my-events` | 502 |

## 4. UI scenarios (Dashboard → Events)

1. My Events appears first and lists the registration with title, left date block, reference, registered-on.
2. Show QR → dialog with image and Download; downloaded file is `<reference>.png`. With the file absent → "QR code not available yet".
3. User with no registrations → empty message; Upcoming/Past still render.
4. Services server stopped → My Events error + Retry; restart server, Retry recovers.
5. DevTools: at 375 / 768 / 1280 / 1920 px every card's `getBoundingClientRect()` width/height ≈ 1.778; dated cards show the date block on the left; long titles clamp to 2 lines; Upcoming badge and blurred-logo fallback unchanged.
6. Network tab shows no browser requests to the services `/api/*` origin.
