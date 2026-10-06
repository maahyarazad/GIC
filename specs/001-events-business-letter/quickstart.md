# Quickstart & Validation: Event Categories & Business Letter Requests

References: [spec](./spec.md) · [data model](./data-model.md) · [API contract](./contracts/business-letters.api.md) · [email contract](./contracts/business-letter-email.contract.md)

## Prerequisites

- MongoDB and SMTP settings in `.env` as for normal development (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SENDER`, `JWT_SECRET`, …).
- For a dry run without mailing the leadership team, set a test recipient:
  `BUSINESS_LETTER_RECIPIENTS=you@example.com`
- Three test accounts: one each with role `user`, `procurement`, `admin`.
- Email template `6ac4970fe31c56f3436780a0` reachable: it exists in the shared DB. For local dev, copy that document (same `_id`) into the local `emailtemplates` collection, or set `BUSINESS_LETTER_EMAIL_TEMPLATE_ID=<local id>`.

## Build / run

```bash
npm run build            # tsoa routes + spec + tsc — must succeed with the new controller
cd ui && npm run build   # client build must succeed
cd .. && npm run dev     # server on http://localhost:5173 (PORT)
```

## Scenario A — Events split & fallback image (US3)

1. Sign in, open `/dashboard?tab=events`.
2. **Expect** two headings: "Upcoming Events" then "Past Events".
3. **Expect** upcoming cards soonest first; past cards most recent first; an event dated today is under Upcoming.
4. **Expect** an event without `Image` shows the GIC logo, softly blurred, on a dark background; title and date badge are sharp.
5. **Expect** events with their own image/video unchanged; the pulsing "upcoming" badge never appears on Past cards.
6. If all events are in the future, Past shows "No past events" (and vice-versa).

## Scenario B — Menu visibility (US1, FR-007)

For each of the three roles: open `/dashboard` → **expect** "Request a Business Letter" in the sidebar; clicking it sets `?tab=business_letter`.

## Scenario C — Submit a request (US1)

1. Open the section; **expect** name/email/phone prefilled, email read-only.
2. Submit empty → **expect** inline errors on required fields; no network call.
3. Pick needed-by = yesterday → **expect** date error.
4. Open the letter type list → **expect** exactly "Business Recommendations" and "Partner Recommendations".
5. Fill valid data and submit → **expect** success toast with `BL-YYYYMMDD-XXXXXX`, form reset, new row at top of history.
6. **Expect** within ~2 min the test recipient receives "New Business Letter Request – BL-…" with all fields rendered per the email contract.
7. Enter `<b>x</b><script>alert(1)</script>` in Purpose → **expect** it shows literally in the history/PDF/email; nothing executes or renders bold.

API check (cookie from a signed-in browser session):

```bash
curl -i -X POST http://localhost:5173/api/v1/business-letters \
  -H 'Content-Type: application/json' -b 'token=<TOKEN>' \
  -d '{"requester":{"name":"QA"},"letterType":"business_recommendation","addressee":{"address":"Abu Dhabi"},"purpose":"Testing the endpoint.","neededBy":"2099-01-01","language":"en"}'
# → 201, data.reference matches ^BL-\d{8}-[0-9A-F]{6}$
```

Server-side validation: repeat with `"neededBy":"2000-01-01"` → **400 VALIDATION_ERROR**.

## Scenario D — Email failure does not lose the request (FR-015)

1. Temporarily set `BUSINESS_LETTER_EMAIL_TEMPLATE_ID=000000000000000000000000` (or an invalid `SMTP_HOST`), then restart.
2. Submit a request → **expect** 201 and the row in history.
3. **Expect** in Mongo: `db.businessletterrequests.findOne({reference:"BL-…"}).notification.status === "failed"`.
4. Unset the override / restore SMTP.

## Scenario E — History & download (US2)

1. With ≥ 2 requests, **expect** newest first with reference, date, letter type, needed-by date.
2. Click Download → **expect** `BL-….pdf` downloads and opens; contents match every submitted field; umlauts (ä ö ü ß) render.
3. New user with no requests → **expect** empty-state message.

## Scenario F — Isolation (FR-018, SC-005)

```bash
# As user B, request user A's PDF id:
curl -i -b 'token=<TOKEN_B>' http://localhost:5173/api/v1/business-letters/<ID_OF_A>/pdf   # → 404 NOT_FOUND
curl -i -b 'token=<TOKEN_B>' http://localhost:5173/api/v1/business-letters/not-an-id/pdf   # → 404 NOT_FOUND
curl -i http://localhost:5173/api/v1/business-letters                                     # → 401
```

User B's `GET /api/v1/business-letters` contains none of A's references.

## Scenario G — Rate limit

Submit 6 requests within one minute from the same IP → 6th returns **429**.

## Done when

All scenarios A–G pass, both builds succeed, and the four production recipients are restored (unset `BUSINESS_LETTER_RECIPIENTS`) before deploying.
