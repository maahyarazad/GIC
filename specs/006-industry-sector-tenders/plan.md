# Implementation Plan: Industry Sector Selection & Tender Board

**Branch**: `006-industry-sector-tenders` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-industry-sector-tenders/spec.md`.

## Summary

Members permanently pick exactly 3 of 10 fixed industry sectors — new members during registration, existing members (who have none on file) via a one-time wizard shown in place of the Tenders tab. The Dashboard's `tenders` tab already exists as an `UnderDevelopment` placeholder wired into access control (`user`, `admin`, `procurement`) — this feature replaces that placeholder with the real board.

Any user with Tender tab access can create a tender under one of their own sectors (admin/procurement, who have no personal sectors, may choose any sector): publisher, announcement, publish date, deadline, plus an optional single file attachment. A tender is visible only to members/procurement/admin viewing that same sector, always shows the creator's snapshotted email with a fixed contact note, and is marked "Closed" once its deadline passes (derived at read time, no scheduler needed) or when an admin closes it early (one-directional).

Publishing a tender emails every other member assigned to that sector, reusing the existing template self-provisioning pattern ([R2](./research.md#r2-email-template-self-provisioning)) and the existing `emailService` (no new email mechanism).

## Technical Context

**Language/Version**: TypeScript 5.9 (Node 20+, `tsx`/`tsc`); React 19 + TS (Vite 7) in `ui/`.

**Primary Dependencies**: Express 4, tsoa 6 (routes/swagger auto-generated — controllers are the source of truth), Mongoose 9, nodemailer 8 (via `emailService`), `multer` (already used for file uploads, e.g. `file.controller.ts`, `contactus.ts`). **No new dependencies.**

**Storage**: MongoDB. New `tenders` collection (Mongoose model). `industrySectors` (exactly 3, immutable once set) added to the existing `users` collection via `UserDocument`/`UserSchema`.

**Testing**: There is no test runner in this repo (confirmed by feature 005's plan). Validation is the builds plus [quickstart.md](./quickstart.md): API with curl/Postman, the UI in a browser, and a test inbox for notification email.

**Target Platform**: Linux server under PM2 (deployed as `dist/` only — attachments and the new email template HTML file must be copied at build time, matching feature 005's `copy-assets` lesson); desktop-first responsive browsers (mirrors other Dashboard tabs).

**Project Type**: Web application — API in `src/`, React SPA in `ui/src/`.

**Performance Goals**: Tender list for a sector (or a member's 3 sectors combined) returns in under 500 ms for realistic volumes (tens to low hundreds of tenders per sector). Tender creation (including optional file write) completes in under 2 s.

**Constraints**:
- Sector selection is write-once per user, enforced server-side regardless of what the UI sends (not just hidden in the UI).
- Exactly 3 sectors at registration/wizard; exactly 1 of the creator's own sectors per tender (admin/procurement may pick any of the 10).
- No new file-storage mechanism — the existing `file_storage` disk + metadata-record pattern is reused for the optional attachment.
- No cron/scheduler exists in this repo and none is introduced — "Closed" from a passed deadline is a derived value computed when a tender is read/listed, not a background job.
- Admin-only for manual early closing (not procurement), matching the user's explicit wording; closing is one-directional (no reopen).
- Notification uses the existing self-provisioning email-template pattern and `emailService` exports; delivery is best-effort per recipient (one failure must not block others or block tender creation).

**Scale/Scope**:
- **Server**: 1 new model (`tender.model.ts`), 1 new controller (`tender.controller.ts`), 1 new service (`tenderNotifications.ts`), 1 new config file (`industrySectors.ts` — the 10-sector list shared by both layers), 1 new email template definition + HTML file, a `UserDocument`/`UserSchema`/`user.types.ts` extension (`industrySectors`), a `user.controller.ts` extension (reject `industrySectors` in registration unless exactly 3 valid values; a dedicated one-time wizard-completion endpoint).
- **UI**: 1 new Dashboard component swapped in for the `tenders` placeholder (list + create form + sector gate), 1 new sector-selection wizard component (shared by registration step 4 and the Tenders-tab gate), 1 new API client (`ui/src/api/tenders.ts`), a `Register.tsx` step addition, an `authSlice`/`authThunks` extension so `industrySectors` survives a profile refresh.

There are no remaining `NEEDS CLARIFICATION` items — the three ambiguities raised during specification (who may create tenders, deadline/closing behavior, file attachments) were resolved with the user and are recorded in spec.md's Clarifications section.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file (`.specify/memory/constitution.md`) is still the unfilled template (confirmed: placeholder tokens like `[PROJECT_NAME]` throughout), so — consistent with features 001–005 — this plan is checked against the repo's de-facto conventions instead:

| Convention | Complies? |
|---|---|
| tsoa `@Route`/`@Controller` per resource, routes/swagger auto-generated (never hand-edited) | Yes — new `TenderController` follows the exact shape of `BusinessLetterController`/`FileController`. |
| Mongoose model + matching `*.types.ts` DTOs, one file each | Yes — `tender.model.ts` + additions to `user.types.ts`/`recommendationLetter`-style new `tender.types.ts`. |
| Member-facing routes use `authMiddleware`; admin/procurement routes use `adminAuthMiddleware`; admin-only actions use `adminOnlyMiddleware` | Yes — list/create use `authMiddleware` (sector gating is enforced in the handler, not the role); the manual-close action uses `adminOnlyMiddleware` per the user's explicit "admin can close it." |
| Config constants (recipients, template names, enums) live in `src/config/*.ts`, overridable via env where it previously was | Yes — `industrySectors.ts` holds the fixed 10-sector list as a single source of truth imported by both the model and the UI (same cross-boundary import style as `recommendationLetters.ts` importing `src/types/...`). |
| New email templates self-provision via `ensureEmailTemplate` rather than requiring a manual seed (lesson from PR #28 / feature 005) | Yes — see [R2](./research.md#r2-email-template-self-provisioning). |
| Runtime assets (HTML templates, uploaded files) must reach `dist/` since only `dist/` is deployed | Yes — new template HTML added to the existing `copy-assets` script scope; attachments reuse the already-deployed `file_storage` directory. |
| No new dependencies unless unavoidable | Yes — zero new npm packages. |

No violations — Complexity Tracking table is not needed.

## Project Structure

### Documentation (this feature)

```text
specs/006-industry-sector-tenders/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── tenders.api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── config/
│   └── industrySectors.ts            # NEW — the 10 fixed sectors, shared type + list
├── models/
│   ├── user.model.ts                 # EDIT — add industrySectors: string[] (exactly 3, immutable)
│   └── tender.model.ts               # NEW — TenderDocument/TenderSchema
├── types/
│   ├── user.types.ts                 # EDIT — User/CreateUserRequest gain industrySectors
│   └── tender.types.ts               # NEW — Tender DTOs
├── controllers/
│   ├── user.controller.ts            # EDIT — validate industrySectors on create; new wizard-completion endpoint
│   └── tender.controller.ts          # NEW — list/create/close
├── services/
│   └── tenderNotifications.ts        # NEW — sector-matched email fan-out, reuses emailService
├── email_templates/
│   └── tender_published_notification.html   # NEW
└── email_template_provisioning additions in emailTemplateProvisioning.ts (EDIT)

ui/src/
├── api/
│   └── tenders.ts                     # NEW — API client (mirrors recommendationLetters.ts style)
├── Components/Dashboard/Tenders/
│   ├── Tenders.tsx                    # NEW — sector gate → wizard OR board
│   ├── TenderBoard.tsx                # NEW — list + create form
│   ├── IndustrySectorWizard.tsx       # NEW — shared by Tenders.tsx and Register.tsx
│   └── Tenders.scss / Tenders.css(.map)
├── Pages/Dashboard/Dashboard.tsx      # EDIT — swap `tenders: <UnderDevelopment .../>` for `<Tenders />`
├── Pages/Register/Register.tsx        # EDIT — add sector-selection step before final submit
└── features/authThunks.ts             # EDIT — carry industrySectors through profile refresh
```

**Structure Decision**: Existing web-application layout (`src/` API, `ui/src/` SPA) is unchanged. The feature plugs into the Dashboard's already-reserved `tenders` tab slot and reuses every existing cross-cutting mechanism (auth middleware, tsoa, Mongoose, `emailService`, `file_storage`, `copy-assets`) rather than introducing new infrastructure.

## Complexity Tracking

*No violations — table omitted.*
