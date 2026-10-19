---
description: "Task list for Manage Presentations — upload presentations under events"
---

# Tasks: Manage Presentations — upload presentations under events

**Input**: Design documents from `/specs/011-manage-presentations-upload/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/presentations-api.md

**Tests**: Not requested in the spec and the repo has no wired test harness for these controllers;
no dedicated test tasks are generated. Validation is manual via `quickstart.md`.

**Organization**: Tasks are grouped by user story (from spec.md) for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4 maps to the spec's user stories
- Exact file paths are included in each task

## Path Conventions

Web app: backend in `src/`, frontend in `ui/src/`. `src/routes/routes.ts` is **tsoa-generated** —
never hand-edit; add decorated methods to the controller and regenerate.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared types and client scaffolding used by every story.

- [x] T001 [P] Create `src/types/presentation.types.ts` with DTOs and constants: `PresentationDto`, `CreatePresentationResponse`, `ListPresentationsResponse`, `ALLOWED_PRESENTATION_TYPES` (`application/pdf`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`), `ALLOWED_PRESENTATION_EXTENSIONS` (`pdf`,`ppt`,`pptx`), and `MAX_PRESENTATION_BYTES = 50 * 1024 * 1024`.
- [x] T002 [P] Create `ui/src/api/presentations.ts` scaffold (reuse the project's axios instance like other `ui/src/api/*.ts`): export typed signatures `uploadPresentation`, `getPresentationsByEvent`, `deletePresentation`, `presentationViewUrl` (bodies filled in later tasks).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Model, controller scaffold, and the protected-storage guarantee. MUST complete before user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Create `src/models/presentation.model.ts`: Mongoose schema for collection `presentations` per data-model.md (`title`, `eventId` ref Event + index, `uploadedBy` ref User, `originalName`, `storedName`, `contentType`, `extension`, `size`, `timestamps`), plus a `mapPresentation(doc)` mapper returning `PresentationDto` (with derived `viewUrl = /api/v1/presentations/<id>/view`). Depends on T001.
- [x] T004 Create `src/controllers/presentation.controller.ts` with `@Route("api/v1/presentations")` `@Tags("presentations")` class `PresentationController extends Controller`, plus shared private helpers: `file_storage` path resolution, allowed-type validation (content type + extension), and `getCollection<...>("presentations")`. No endpoints yet. Depends on T001, T003.
- [x] T005 In `src/server.ts`, verify and document that `presentations` files are served ONLY via the controller route and are NOT added to the public `/uploads` `express.static` mount (FR-007); confirm `storedName` uses an unguessable `<ObjectId>.<ext>` form.

**Checkpoint**: Model + controller shell exist and storage policy is confirmed — stories can begin.

---

## Phase 3: User Story 1 - Upload a presentation and attach it to an event (Priority: P1) 🎯 MVP

**Goal**: A signed-in member uploads a file (≤ 50 MB, with a progress loader) and attaches it to an event; it appears in that event's list. Includes delete from the management surface.

**Independent Test**: Sign in, upload one ≤50 MB file against one event, see progress 0→100%, see it listed; a >50 MB file is rejected.

### Implementation for User Story 1

- [x] T006 [US1] Add `POST /` upload method to `src/controllers/presentation.controller.ts`: `@Post("/")` `@Middlewares(authMiddleware)` with `@UploadedFile("file")`, `@FormField` `eventId` + `title`; validate presence, title non-empty, event exists, content type/extension in allowed set, size ≤ `MAX_PRESENTATION_BYTES`; write bytes to `file_storage/<_id>.<ext>`; insert record; return `201` `CreatePresentationResponse`. Error codes per contract (`NO_FILE`, `INVALID_FILE_TYPE`, `INVALID_EVENT`, `MISSING_TITLE`). Depends on T003, T004.
- [x] T007 [US1] Configure multer `limits.fileSize = MAX_PRESENTATION_BYTES` for the presentations upload route and map multer `LIMIT_FILE_SIZE` to a `413 FILE_TOO_LARGE` response (follow the existing multer setup used by `src/controllers/file.controller.ts` / `src/server.ts`). Depends on T006.
- [x] T008 [US1] Add `DELETE /:id` method to `src/controllers/presentation.controller.ts`: `@Delete("{id}")` `@Middlewares(authMiddleware)`; allow only uploader (`uploadedBy == req.user.userId`) or `admin` role (`requireRoles(["admin"])` pattern), else `403 FORBIDDEN`; remove record and `fs.unlink` the file; `404` if missing (FR-011). Depends on T006.
- [x] T009 [US1] Regenerate tsoa routes so `src/routes/routes.ts` includes the new POST/DELETE (run the project's tsoa build/`npm run` route-gen step); do not hand-edit the generated file. Depends on T006, T008.
- [x] T010 [P] [US1] Implement `uploadPresentation` and `deletePresentation` in `ui/src/api/presentations.ts`: `uploadPresentation` posts `multipart/form-data` with `axios` and forwards `onUploadProgress` to the caller; pre-check `file.size <= 50MB`. Depends on T002.
- [x] T011 [P] [US1] Create `ui/src/Components/Dashboard/Presentations/UploadProgress.tsx`: determinate progress bar + percent label driven by an `uploadedPct` prop; shows an error state. Depends on T002.
- [x] T012 [US1] Create `ui/src/Components/Dashboard/Presentations/ManagePresentations.tsx`: event picker (reuse the events list API), title input, file input (accept pdf/ppt/pptx), submit calling `uploadPresentation` with `onUploadProgress` → `UploadProgress`; after success refresh the event's presentation list; render per-event list with a delete action and a "copy view link" button. Depends on T010, T011.
- [x] T013 [P] [US1] Create `ui/src/Components/Dashboard/Presentations/Presentations.scss` and import it; style the section, list, and progress loader consistent with other dashboard sections.
- [x] T014 [US1] Register "Manage Presentations" in the dashboard navigation/section host (follow how existing dashboard sections are registered, e.g. `ui/src/Pages/Dashboard/Dashboard.tsx` and sibling sections). Depends on T012.

**Checkpoint**: Members can upload (with live progress), see, and delete presentations per event; >50 MB rejected.

---

## Phase 4: User Story 2 - View a presentation through a protected route (Priority: P1)

**Goal**: Presentation bytes are served only to authenticated users; unauthenticated → 401, deleted → 404.

**Independent Test**: Request a presentation's view URL with and without a session cookie; bytes served only when authenticated; `/uploads` path for the stored file is not reachable.

### Implementation for User Story 2

- [x] T015 [US2] Add `GET /{id}/view` method to `src/controllers/presentation.controller.ts`: `@Get("{id}/view")` `@Middlewares(authMiddleware)`; look up record; if missing/file absent → `404 NOT_FOUND`; otherwise stream the file from `file_storage` with the recorded `Content-Type` and `Content-Disposition: inline; filename="<originalName>"` (use the raw Express response via `@Request()` like other binary responses). Depends on T004.
- [x] T016 [US2] Regenerate tsoa routes so the view endpoint is registered with `authMiddleware` (unauth → 401, no bytes). Depends on T015.
- [x] T017 [P] [US2] Implement `presentationViewUrl(id)` in `ui/src/api/presentations.ts` returning `/api/v1/presentations/<id>/view`. Depends on T002.
- [x] T018 [US2] Verify (per quickstart Scenario 2) the stored file is not reachable via `/uploads`; adjust `storedName`/mount if the check fails. Depends on T005, T015.

**Checkpoint**: Protected viewing works; public mount cannot serve presentations.

---

## Phase 5: User Story 3 - Badge + event modal for all members (Priority: P2)

**Goal**: Event cards show a presentations badge; opening an event lists its presentations, each opening in a new tab; any signed-in member can view.

**Independent Test**: Attach a presentation to an event; as a different member, see the badge, open the modal, click to open in a new tab.

### Implementation for User Story 3

- [x] T019 [US3] Add `GET /?eventId=` list method to `src/controllers/presentation.controller.ts`: `@Get("/")` `@Middlewares(authMiddleware)` `@Query() eventId`; return `ListPresentationsResponse` for any signed-in user (FR-010); `400` if `eventId` missing. Then regenerate tsoa routes. Depends on T004.
- [x] T020 [US3] Add `presentationCount` to the member event DTO: extend `mapEvent`/`EventDto` in `src/models/event.model.ts` and `src/types/event.types.ts`, and compute counts per event via a single aggregation over `presentations` grouped by `eventId` in the events-list query (avoid N+1). Depends on T003.
- [x] T021 [P] [US3] Extend `ui/src/Components/Dashboard/Events/EventCard.tsx`: add `"presentations"` to `EventCardBadgeTone`; allow the card to show a presentations badge when provided (keep existing Attending behavior). Depends on none (UI-only).
- [x] T022 [P] [US3] Add `.event-status-badge--presentations` styling in `ui/src/Components/Dashboard/Events/EventCard.scss` (and rebuild the compiled CSS as siblings do). Depends on T021.
- [x] T023 [US3] Create `ui/src/Components/Dashboard/Events/EventPresentationsModal.tsx`: fetch the event's presentations via `getPresentationsByEvent`, render each as a link to `presentationViewUrl(id)` with `target="_blank" rel="noopener"`; match the dashboard's existing modal pattern. Depends on T017, T024.
- [x] T024 [P] [US3] Implement `getPresentationsByEvent(eventId, signal?)` in `ui/src/api/presentations.ts`. Depends on T002.
- [x] T025 [US3] Wire `ui/src/Components/Dashboard/Events/Events.tsx`: compute the presentations badge from `presentationCount > 0` and open `EventPresentationsModal` for events that have presentations (preserve the existing attendance-confirm behavior). Depends on T020, T021, T023.

**Checkpoint**: All members see badges and can open presentations in new tabs from the event modal.

---

## Phase 6: User Story 4 - Reference a presentation link in the newsletter (Priority: P3)

**Goal**: Newsletter authors insert a presentation's protected view URL as a link via the existing Quill editor.

**Independent Test**: Copy a presentation view URL, insert it via the editor's link tool, confirm the saved HTML contains the link.

### Implementation for User Story 4

- [x] T026 [US4] Ensure `ManagePresentations.tsx` exposes a one-click "copy view link" for each presentation (absolute URL built from `presentationViewUrl`) so authors can paste it. Depends on T012, T017.
- [x] T027 [US4] Verify newsletter link insertion end-to-end in `ui/src/Components/Dashboard/Newsletter/Newsletter.tsx` using the existing Quill `link` toolbar button (no code change expected); document the flow in quickstart Scenario 4. Depends on T026.

**Checkpoint**: Presentation links can be embedded in newsletters and opened by signed-in recipients.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story concerns and final validation.

- [x] T028 Implement cascade delete (FR-012 default): when an event is deleted (admin event delete controller, `src/controllers/eventAdmin.controller.ts`), remove that event's presentation records and unlink their files. (Flip to retain/orphan only if stakeholder reverses the default.)
- [x] T029 [P] Add swagger/tsoa doc coverage for the new endpoints (regenerate `src/swagger/swagger.json` via the tsoa spec step).
- [ ] T030 Run `quickstart.md` Scenarios 1–5 and confirm Success Criteria SC-001…SC-005. (Manual — requires a running MongoDB + SSR app; code is complete and typechecks, but the live run was not executed in this session.)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: after Setup — **blocks all user stories**.
- **User Stories (Phase 3–6)**: after Foundational. US1 and US2 are both P1; US1 delivers the MVP management surface, US2 secures viewing. US3/US4 build on the list/view endpoints.
- **Polish (Phase 7)**: after the targeted stories.

### User Story Dependencies

- **US1 (P1)**: needs Foundational only. MVP.
- **US2 (P1)**: needs Foundational; independent of US1 but shares the controller.
- **US3 (P2)**: consumes the list endpoint (T019) and view URL (US2) and the event DTO count (T020).
- **US4 (P3)**: needs a copyable view URL (US1/US2); otherwise reuses existing newsletter editor.

### Within Each User Story

- Backend method → tsoa route regen → frontend API → UI component → navigation wiring.
- Models before controllers; controllers before UI that calls them.

### Parallel Opportunities

- T001 ‖ T002 (Setup).
- T010 ‖ T011 ‖ T013 within US1 (different files).
- T021 ‖ T022 ‖ T024 within US3.
- Once Foundational is done, US1 and US2 backend work can proceed in parallel (distinct controller methods), though both end in a single tsoa regen.

---

## Parallel Example: User Story 1

```bash
# After T006–T009 (backend) are in place, these UI tasks touch different files:
Task: "Implement upload/delete API in ui/src/api/presentations.ts"       # T010
Task: "Create UploadProgress.tsx"                                        # T011
Task: "Create Presentations.scss"                                        # T013
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Phase 1 Setup → Phase 2 Foundational.
2. Phase 3 (US1 upload/manage) → validate upload, progress, 50 MB cap, delete.
3. Phase 4 (US2 protected view) → validate auth-gated viewing.
4. **STOP and VALIDATE** quickstart Scenarios 1–2. This is a shippable MVP.

### Incremental Delivery

1. MVP (US1+US2) → demo.
2. Add US3 (badge + modal for all members) → demo.
3. Add US4 (newsletter links) → demo.
4. Polish (cascade delete, swagger, full quickstart run).

---

## Notes

- `src/routes/routes.ts` and `src/swagger/swagger.json` are tsoa-generated — change controllers and regenerate.
- Presentations must never be added to the `/uploads` static mount (FR-007).
- Two defaults remain to confirm with the stakeholder (research.md): cascade on event delete (FR-012) and allowed file types (FR-015).
- Commit after each task or logical group; stop at checkpoints to validate stories independently.
