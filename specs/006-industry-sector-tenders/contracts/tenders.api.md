# Contract: Industry Sectors & Tenders API

JSON responses use the existing envelope: success `{ success, message, data }`, error `{ success: false, message, error: { message, code, details? } }`.

Field rules are in [data-model.md](../data-model.md). Decisions referenced below (`R1`...`R7`) are in [research.md](../research.md).

## DTOs — `src/types/tender.types.ts`

```ts
type TenderStatus = "open" | "closed";

interface TenderAttachment {
  filename: string;       // stored name on disk
  originalName: string;   // as uploaded
  mimetype: string;
  size: number;            // bytes
}

interface TenderListItem {
  id: string;
  sector: string;                 // one of the 10 fixed sectors (src/config/industrySectors.ts)
  publisher: string;
  announcement: string;
  publishedAt: string;            // ISO date
  deadline: string;                // ISO date
  status: TenderStatus;            // derived — see R4
  attachment: TenderAttachment | null;
  creator: { name: string; email: string };
  createdAt: string;
}

// TenderDetail === TenderListItem (no additional fields; the full announcement
// text is already in the list item since there is no separate summary/body split).

interface CreateTenderRequest {
  sector: string;
  publisher: string;
  announcement: string;
  publishedAt: string;   // ISO date
  deadline: string;      // ISO date
  // `file` is a multipart field, not part of the JSON body (see POST /tenders).
}
```

## DTOs — additions to `src/types/user.types.ts`

```ts
// User (existing interface) gains:
industrySectors?: string[];       // exactly 3 once set; absent = not yet assigned

// CreateUserRequest (existing interface) gains:
industrySectors: string[];        // required at registration; exactly 3, each a valid sector

// UpdateUserRequest intentionally does NOT gain this field — R1.
```

## `POST /api/v1/users/`

Existing registration endpoint, extended. `@Middlewares` unchanged.

- Body: existing `CreateUserRequest` fields **plus** `industrySectors: string[]` (now required).
- 400 `INVALID_SECTORS` if `industrySectors` is missing, has a length other than 3, contains duplicates, or contains a value outside the fixed 10-sector list.
- On success, the created user document includes `industrySectors` and `industrySectorsSetAt`.

## `PUT /api/v1/users/me/industry-sectors`

New. `@Middlewares(authMiddleware)`. Backs the one-time wizard for existing members (spec User Story 2).

- Body: `{ industrySectors: string[] }` — same validation as registration.
- 409 `SECTORS_ALREADY_SET` if the caller already has `industrySectors` set (write-once, R1). No force/override parameter exists.
- 200 with the updated `{ industrySectors, industrySectorsSetAt }` on success.

## `GET /api/v1/tenders`

`@Middlewares(authMiddleware)`.

- Query: `sector?: string` (optional).
  - Caller with `industrySectors` set (role `user`): if `sector` is omitted, returns tenders across all 3 of the caller's own sectors; if provided, must be one of the caller's own 3 sectors (400 `SECTOR_NOT_ASSIGNED` otherwise).
  - Caller with role `admin`/`procurement` (no personal sector gating): `sector` is required (400 `SECTOR_REQUIRED` if omitted) and may be any of the 10.
- Response: `data: TenderListItem[]`, newest `createdAt` first.

## `POST /api/v1/tenders`

`@Middlewares(strictLimiter, authMiddleware)` (rate-limited like other member-submitted content, e.g. `createBusinessLetterRequest`).

- Multipart body: `CreateTenderRequest` fields + optional `file` field (single file, `@UploadedFile`).
- 400 `MISSING_FIELD` if any of `sector`/`publisher`/`announcement`/`publishedAt`/`deadline` is absent.
- 403 `SECTOR_NOT_OWNED` if the caller's role is `user` and `sector` is not one of their own `industrySectors` (R1/FR-023). Admin/procurement callers may use any of the 10 sectors.
- On success: creates the `Tender` with a `creator` snapshot (`{ userId, name, email }` from the authenticated user, R-model), fans out the "tender published" notification to other sector-matched members (R3; best-effort, failures logged but never surfaced as a tender-creation error), and returns `data: TenderListItem` (201).

## `PATCH /api/v1/tenders/{id}/close`

`@Middlewares(adminOnlyMiddleware)` — admin role only, not procurement (R5).

- No body.
- 404 if the tender doesn't exist.
- 409 `ALREADY_CLOSED` if the tender's effective status is already `"closed"` (whether by deadline or a prior admin close) — closing is one-directional (FR-021).
- 200 with the updated `TenderListItem` (now `status: "closed"`) on success.

## UI contract — Dashboard "Tenders" tab

- `ui/src/Pages/Dashboard/Dashboard.tsx`: `tenders: <UnderDevelopment ... />` → `tenders: <Tenders />`. No change to `accessControl`/`menuTitles`/`isValidMenuItem` — the `tenders` entry already exists with roles `["user", "admin", "procurement"]`.
- `Tenders.tsx` gate: if the logged-in user's role is `user` and `industrySectors` is missing/not length 3 → render `IndustrySectorWizard` (same component used by `Register.tsx`'s new step) instead of the board. Admin/procurement always see the board directly (they are never subject to the wizard since they aren't assigned personal sectors).
- Both `Register.tsx`'s sector step and the Tenders-tab wizard display the fixed irreversibility notice text (FR-003/FR-006); the Tenders tab additionally reminds already-assigned members of their permanence via a persistent notice near their sector list (FR-022), not a re-selectable control.
- Every rendered tender shows `creator.email` plus the fixed note "Please contact me for any further details." (FR-016) and a `status` badge ("Open"/"Closed").
