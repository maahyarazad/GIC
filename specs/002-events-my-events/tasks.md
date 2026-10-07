---

description: "Task list for Event Card Layout & My Events"
---

# Tasks: Event Card Layout & My Events

**Input**: Design documents from `/specs/002-events-my-events/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/my-events.api.md, quickstart.md

**Tests**: Not requested in the spec; the repo has no test runner (research R10). Validation is via builds and the scenarios in quickstart.md.

**Organization**: Tasks are grouped by user story. US1 = My Events + QR (P1, MVP). US2 = 16:9 cards with the date on the left (P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: US1 / US2 (user story phases only)

## Path Conventions

API in `src/`, React client in `ui/src/`. SCSS is compiled by hand, and the compiled `.css` is committed next to each `.scss`. Components import the `.css` file.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the baseline before changes.

- [X] T001 Confirm the baseline builds on branch `002-events-my-events`: run `npm run build` at repo root (tsoa routes + spec + tsc) and `npm run build` in `ui/`; record any failures that already exist so they are not attributed to this feature

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared server helper, shared types and the shared card component used by both stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Create `src/services/servicesServer.ts` exporting `getServicesOrigin()` (returns `process.env.SERVICES_SERVER_ORIGIN_PROD` when `process.env.NODE_ENV === "PRODUCTION"`, else `SERVICES_SERVER_ORIGIN_DEV`), class `ServicesUnavailableError extends Error`, and `servicesFetch(path: string, query?: Record<string, string>): Promise<Response>`. `servicesFetch` must: (1) build the URL from origin + path + `URLSearchParams(query)`; (2) sign `jwt.sign({}, process.env.EXTERNAL_ACCESS_SECRET, { expiresIn: tokenExpiry.externalAccess.value })` (import `tokenExpiry` from `../config/tokenConfig`) and send it as `x-access-token`; (3) use `signal: AbortSignal.timeout(10_000)`; (4) throw `ServicesUnavailableError` on network or timeout errors. It returns the raw `Response` and does not throw on non-2xx.
- [X] T003 [P] In `src/types/event.types.ts`, add `ServicesRegistrationRow` (fields `id, event, event_id, email, firstName, lastName, companyName, metadata_createdAt, external_source, status`; nullable where data-model.md says so). Also add `MyEventRegistration` `{ reference: string; registeredAt: string | null; attendeeName: string; paymentStatus: string | null; event: Pick<Event, "page" | "title" | "event_date" | "event_time" | "event_location_name" | "Image"> }` per data-model.md.
- [X] T004 Refactor `getEvents` in `src/controllers/event.controller.ts` to call `servicesFetch("/api/registration-config", { externalSource: "gic" })` instead of building the origin and token inline. Keep the response shape the same (`createSuccessResponse(data.rows, "Events fetched")`). Map `ServicesUnavailableError` to a 502 `"Events service unavailable"` and keep the upstream non-2xx handling. Depends on T002.
- [X] T005 [P] Create `ui/src/Components/Dashboard/Events/EventCard.tsx` by moving `toLocalDay` (export it) and the card JSX out of `renderEventCard` in `ui/src/Components/Dashboard/Events/Events.tsx`. Props: `{ event: Event; showUpcomingBadge?: boolean; onClick: () => void; footer?: React.ReactNode }`. The component renders the outer column `div` (same bootstrap col classes, `key` is set by the caller), the background (image / `.webm` video / blurred GIC-logo fallback, with `getEventImageUrl` and `isVideo` moved in), the date, the title, the upcoming badge (`upcoming-events2.png`, same 30-day rule) and `footer` inside the `.card` when given. Markup and classes stay identical for now; the visual changes belong to US2.
- [X] T006 Update `ui/src/Components/Dashboard/Events/Events.tsx` to render Upcoming/Past through `<EventCard key={p.id} event={p} showUpcomingBadge={…} onClick={() => handleNavigation(p.page)} />`. Delete the inline `renderEventCard`, `getEventImageUrl`, `isVideo` and local `toLocalDay`, and import `toLocalDay` from `./EventCard` for `splitEventsByDate`. Remove now-unused imports and state (`rowCount`, `paginationModel`, `sortModel`, `filterModel`, `uploading`, `confirm`, `env`, `navigate`, `Navigate`, grid types) only if nothing else uses them. Depends on T005.

**Checkpoint**: Both builds pass. The Events tab looks and behaves exactly as before.

---

## Phase 3: User Story 1 - See my registrations and their QR codes (Priority: P1) 🎯 MVP

**Goal**: A "My Events" section at the top of the Events tab lists the user's GIC event registrations. Each one has a QR dialog with a download, served by authenticated, ownership-checked GIC endpoints that proxy the services platform.

**Independent Test**: quickstart.md §3 (A1–A9) and §4 steps 1–4. Sign in as a user with a GIC registration, open Events, see it under My Events, click Show QR, and download `<reference>.png` (or see "QR code not available yet" when the file is missing).

### Implementation for User Story 1

- [X] T007 [US1] In `src/controllers/event.controller.ts`, add private helpers: `resolveUserEmail(req)` (load `UserModel.findById(toObjectId(req.user.userId)).lean()` the same way `businessLetter.controller.ts` does, fall back to `req.user.user_profile?.email`, return a trimmed lowercase string or `null`) and `emailMatches(rowEmail, userEmail)` (trim + lowercase equality). Depends on T003.
- [X] T008 [US1] Rewrite `getMyEvents` in `src/controllers/event.controller.ts`: add `@Middlewares(authMiddleware)` and delete the manual `jwt.verify` and all `req.query` reading. Return 401 `"Unauthorized"` if there is no email. Then `Promise.all` two calls: `servicesFetch("/api/registration-config", { externalSource: "gic" })` and `servicesFetch("/api/registration", { filterField: "email", filterOperator: "contains", filterValue: email, page: "1", pageSize: "100", sortField: "id", sortOrder: "desc" })`. Build a `Map` of GIC events by `page`. Keep rows where `emailMatches` and the map has `row.event`. Map each row to `MyEventRegistration`: `registeredAt` = `metadata_createdAt` parsed as UTC (`"YYYY-MM-DD HH:mm:ss"` → ISO, `null` if invalid); `attendeeName` = `firstName` + `lastName` trimmed. Sort by `event.event_date` desc (undated last), then `registeredAt` desc. Return `createSuccessResponse({ items, total: items.length }, "My events fetched")`. On `ServicesUnavailableError` or upstream non-2xx, return 502 `"Events service unavailable"`. Depends on T002, T007.
- [X] T009 [US1] Replace `getMyEventQr` in `src/controllers/event.controller.ts` with `@Get("/my-events/{reference}/qr") @Middlewares(authMiddleware) getMyEventQr(@Path() reference: string, @Request() req)`. Steps: (1) reject anything not matching `/^[a-z0-9-]{1,64}$/` with 400 `"Invalid reference"`; (2) resolve the email (T007); (3) call `servicesFetch("/api/registration", { event_id: reference, page: "1", pageSize: "5" })` and find a row with `row.event_id === reference && emailMatches(row.email, email)`, else 404 `"Registration not found"`; (4) call `servicesFetch("/api/qr", { event: row.event, event_id: reference })`; an upstream 404 becomes 404 `"QR code not available"` and any other non-2xx becomes 502; (5) on success, set headers `Content-Type: image/png`, `Content-Disposition: inline; filename="<reference>.png"`, `Cache-Control: private, no-store` and `return Readable.from(Buffer.from(await res.arrayBuffer()))` (import `Readable` from `stream`). Remove the old `/my-events/qr` query-param route completely. Depends on T002, T007.
- [X] T010 [US1] Run `npm run build` at repo root to regenerate `src/routes/routes.ts` and `src/swagger/swagger.json`. Confirm `/api/v1/my-events/{reference}/qr` is present and `/api/v1/my-events/qr` is gone, and that `getMyEvents` and `getMyEventQr` both have the `authMiddleware` middleware. Depends on T008, T009.
- [X] T011 [P] [US1] Create `ui/src/api/myEvents.ts` with `getMyEvents(): Promise<MyEventRegistration[]>` (`axiosInstance.get("/my-events")` → `data.data.items`) and `getMyEventQr(reference: string): Promise<Blob>` (`axiosInstance.get(\`/my-events/${encodeURIComponent(reference)}/qr\`, { responseType: "blob" })`). Import `MyEventRegistration` from `../../../src/types/event.types` (same relative style as `Events.tsx`). Depends on T003.
- [X] T012 [US1] Create `ui/src/Components/Dashboard/Events/MyEventQr.tsx`, the dialog content `({ reference }: { reference: string })`. In `useEffect`, call `getMyEventQr`, then `URL.createObjectURL`, and revoke the URL in the cleanup. Ignore results after unmount. States: loading (`Loader`); success (`<img alt="QR code for <reference>">`, the reference in monospace, a Download link `<a href={objectUrl} download={\`${reference}.png\`}>`); 404 → "QR code not available yet." (no toast); any other error → "Could not load the QR code." Depends on T011.
- [X] T013 [US1] Create `ui/src/Components/Dashboard/Events/MyEvents.tsx`, a `<section className="events-group my-events">` with `<h4 className="events-group__title">My Events</h4>`. It has its own fetch state, independent of the events fetch (FR-010), with states loading (`Loader`), error (message + Retry button that refetches only `/my-events`), empty ("You haven't registered for any events yet.") and list (`<div className="products row mt-2">`). Each item renders `<EventCard key={item.reference} event={item.event as Event} onClick={openQr} footer={…} />`. The footer is `.my-event-footer` with the reference (monospace, truncated with `title` showing the full value), a payment-status chip when `paymentStatus` is set, and a "Show QR" button. `openQr` calls `useModal().openModal({ title: item.event.title, content: <MyEventQr reference={item.reference} /> })`. Depends on T005, T011, T012.
- [X] T014 [US1] In `ui/src/Components/Dashboard/Events/Events.tsx`, render `<MyEvents />` as the first child after the `Events` header. It must sit outside the `loading` / `events.length === 0` ternary so My Events renders even when the events list is empty or still loading. Depends on T006, T013.
- [X] T015 [P] [US1] Add `.my-events` / `.my-event-footer` styles to `ui/src/Components/Dashboard/Events/Events.scss`: a footer strip absolutely positioned at the bottom of the card, `z-index: 2`, `rgba(0,0,0,.65)` background, white text, flex row with the reference (ellipsis), the status chip and a small `btn btn-sm` "Show QR". Add QR dialog content styles (`.my-event-qr img { max-width: 280px; width: 100%; image-rendering: pixelated; }`). Recompile to `ui/src/Components/Dashboard/Events/Events.css` (for example `npx sass ui/src/Components/Dashboard/Events/Events.scss ui/src/Components/Dashboard/Events/Events.css --no-source-map`) and commit both files.
- [X] T016 [US1] Validate US1 using quickstart.md §2 (upstream sanity), §3 A1–A9 against the running GIC server (`npm run dev`) and services dev server, and §4 steps 1–4 in the browser. To check the QR success path, place a PNG at `<registration-app>/qr-files/artificial-intelligence-in-industrial-operations/gic-aiiio-17760593471683233.png`, then remove it afterwards. Depends on T010, T014, T015.

**Checkpoint**: My Events works end to end. Card visuals are still the old layout.

---

## Phase 4: User Story 2 - 16:9 event cards with the date on the left (Priority: P2)

**Goal**: Every card in the Events tab (My Events, Upcoming, Past) is 16:9 with a calendar date block docked on its left edge.

**Independent Test**: quickstart.md §4 step 5. At 375/768/1280/1920 px every card's width/height ≈ 1.778, dated cards show the left date block, long titles clamp to 2 lines, and the upcoming badge and blurred-logo fallback are unchanged.

### Implementation for User Story 2

- [X] T017 [US2] In `ui/src/Components/Dashboard/Events/EventCard.tsx`, remove `h-100` from the `.card` element. Replace the `.event-date-badge` element with `<time className="event-date-block" dateTime="YYYY-MM-DD">` containing `<span className="event-date-block__day">DD</span><span className="event-date-block__month">MMM</span><span className="event-date-block__year">YYYY</span>`, using `toLocaleDateString("en-GB", …)` parts and rendered only when `toLocalDay(event.event_date)` is non-null. Add the class `has-date` to `.card-body` when the block is rendered. Depends on T005.
- [X] T018 [US2] Update `ui/src/Components/Dashboard/Events/Events.scss`. On `.economic-insights .products .card`: replace `min-height: 300px` with `aspect-ratio: 16 / 9`, and keep `overflow: hidden`. Replace `.event-date-badge` with `.event-date-block`: `position: absolute; top: 0; bottom: 0; left: 0; width: 22%; min-width: 64px; max-width: 110px; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(0,0,0,.6); color: #fff; line-height: 1.1`, with `__day` at about `clamp(1.4rem, 3vw, 2.2rem)` weight 800, `__month` uppercase weight 600, `__year` at 0.8rem with opacity 0.85. Add `.card-body.has-date { padding-left: clamp(64px, 22%, 110px); }`. For `.card-title`, set `font-size: clamp(1rem, 2.2vw, 1.4rem) !important`, remove `min-height: 60px`, and add `display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; padding: 0.25rem 0.5rem` (replacing `display: flex` on the title). Make sure the `.my-event-footer` from T015 does not overlap the date block: set `left` to the same `clamp()` width when the card has a date, or let the footer span the full width above the block via `z-index: 2`, and pick one consistently. Depends on T015, T017.
- [X] T019 [US2] Recompile `ui/src/Components/Dashboard/Events/Events.scss` → `ui/src/Components/Dashboard/Events/Events.css` and check the compiled file contains `aspect-ratio: 16/9` and `.event-date-block`, and no longer contains `.event-date-badge` or `min-height: 300px`. Depends on T018.
- [X] T020 [US2] Validate per quickstart.md §4 step 5 in the browser: measure the cards via DevTools `getBoundingClientRect()` at the four widths, and check image, video and fallback cards, undated cards (no block, title uses full width), the upcoming badge position, and My Events cards with the footer. Depends on T019.

**Checkpoint**: Both stories are complete and independently verifiable.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T021 Run `npm run build` (root) and `npm run build` (`ui/`); both must pass with no new TypeScript errors.
- [X] T022 [P] Search the code for leftover references: `grep -rn "my-events/qr?\|event-date-badge\|user_profile.email" src ui/src --include=*.ts --include=*.tsx`. The only expected hit is the `user_profile?.email` fallback in T007.
- [X] T023 [P] Confirm in the browser Network tab that the client never calls the services origin's `/api/*` directly (quickstart.md §4 step 6), and that `/api/v1/my-events` responses contain no `email` field of other users.
- [X] T024 Mark the plan's out-of-scope services-repo issues as follow-ups for the team (do not change the services repo here): invalid `x-access-token` accepted by `authorize_admin`, `/api/qr` path traversal, and `ORDER BY ${sortField}` injection. See plan.md "Out of Scope / Follow-ups".

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T006)** → **US1 (T007–T016)** and **US2 (T017–T020)** → **Polish (T021–T024)**.

### User Story Dependencies

- **US1 (P1)**: needs T002, T003, T005, T006. It does not depend on US2.
- **US2 (P2)**: needs only T005 for markup. T018 touches the same `Events.scss` as T015, so do T015 before T018, or merge the two by hand if they run in parallel. Otherwise US2 is independent of US1 and can ship first if wanted (skip the `.my-event-footer` reconciliation in T018 when US1 is absent).

### Within Each User Story

- US1: server helpers (T007) → endpoints (T008, T009) → regenerate routes (T010). Client api (T011) → QR dialog (T012) → section (T013) → wire into Events (T014). Styles (T015). Then validate (T016).
- US2: markup (T017) → SCSS (T018) → compile (T019) → validate (T020).

### Parallel Opportunities

- Foundational: T002, T003 and T005 touch different files and run in parallel. T004 follows T002, and T006 follows T005.
- US1: T011 and T015 can run in parallel with the server tasks T007–T010. T008 and T009 edit the same file, so run them sequentially.
- US2: T017 can start right after T005, in parallel with all US1 server work.
- Polish: T022 and T023 in parallel.

---

## Parallel Example: User Story 1

```text
# After Phase 2 completes:
Agent A: T007 → T008 → T009 → T010   (src/controllers/event.controller.ts)
Agent B: T011 → T012 → T013 → T014   (ui/src/api/myEvents.ts, MyEventQr.tsx, MyEvents.tsx, Events.tsx)
Agent C: T015                         (Events.scss / Events.css)
Then: T016
```

## Parallel Example: User Story 2

```text
T017 (EventCard.tsx) can run while US1 server tasks are in progress;
T018 → T019 after T015 has landed in Events.scss.
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 → Phase 2 (no visible change).
2. Phase 3 (US1): My Events + secure endpoints. This also removes the existing SQL-injection and unauthenticated-QR paths, so deliver it first.
3. **Stop and validate** with quickstart.md §3–§4.

### Incremental Delivery

1. US1 → deploy (cards still look the old way).
2. US2 → deploy (16:9 + left date block on all three sections).
3. Polish tasks before merging to `main`.
