# Quickstart / Validation: Manage Presentations

Validation scenarios proving the feature end-to-end. See [contracts/presentations-api.md](./contracts/presentations-api.md)
and [data-model.md](./data-model.md) for shapes; this guide is run/verify only.

## Prerequisites

- Backend and frontend running (same as the main app; e.g. API on its usual port, Vite SSR client served by Express).
- MongoDB reachable; `file_storage/` directory writable.
- At least one event exists (create via admin Events, or seed).
- Two accounts: a member (uploader) and another signed-in member (viewer); one admin for delete tests.

## Scenario 1 — Upload with progress (US1, FR-002/004/005)

1. Sign in as the member; open **Dashboard → Manage Presentations**.
2. Select an event, enter a title, choose a file ≤ 50 MB, submit.
3. **Expect**: a determinate progress bar goes 0→100%, then the presentation appears in that event's list.
4. Retry with a file > 50 MB.
5. **Expect**: rejected with an "exceeds 50 MB" message; nothing added (server returns `413 FILE_TOO_LARGE`).

## Scenario 2 — Protected view (US2, FR-006/007)

1. Copy the presentation's `viewUrl` (`/api/v1/presentations/:id/view`).
2. In a signed-out context (or `curl` with no cookie), request it.
   - **Expect**: `401`, no file bytes.
3. Confirm it is NOT served publicly: request the on-disk name under `/uploads/...`.
   - **Expect**: not found / not served there.
4. Signed in, open the `viewUrl` in a new tab.
   - **Expect**: file opens with correct content type.

Example (replace cookie/host):
```bash
# Unauthenticated → 401
curl -i http://localhost:PORT/api/v1/presentations/<id>/view
# Authenticated → 200 + bytes
curl -i --cookie "token=<jwt>" http://localhost:PORT/api/v1/presentations/<id>/view
```

## Scenario 3 — Badge + event modal (US3, FR-008/009/010)

1. As a **different** signed-in member, open **Dashboard → Events**.
2. **Expect**: the event with presentations shows a badge in the `event-status-badge` family (`--presentations` tone).
3. Open that event's modal.
4. **Expect**: each presentation is listed by title; clicking one opens it in a **new tab** via the protected route.
5. Open an event with no presentations.
6. **Expect**: no presentations badge, and no/empty presentations list.

## Scenario 4 — Newsletter link (US4, FR-013)

1. As a newsletter author, open **Dashboard → Newsletter**.
2. Use the Quill **link** button; paste a presentation `viewUrl`; save.
3. **Expect**: the saved newsletter HTML contains the link; a signed-in recipient can open it.

## Scenario 5 — Delete (FR-011) and cascade (FR-012, default)

1. As the uploader (or admin), delete a presentation.
   - **Expect**: it leaves the list; its `viewUrl` now returns `404`.
2. As a non-owner, non-admin member, attempt delete.
   - **Expect**: `403 FORBIDDEN`.
3. (If cascade confirmed) Delete an event that has presentations.
   - **Expect**: its presentations' records and files are removed; no dangling badge.

## Success check

Maps to spec Success Criteria: SC-001 (progress upload < 60s), SC-002 (100% unauth denied),
SC-003 (0% public reachable), SC-004 (badge + new-tab open), SC-005 (oversize rejected).
