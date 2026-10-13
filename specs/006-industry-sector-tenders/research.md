# Phase 0 Research: Industry Sector Selection & Tender Board

## R1 — Where sector assignment and permanence live

**Decision**: `industrySectors: string[]` lives directly on `UserDocument`/`UserSchema` (not a separate collection), validated to contain exactly 3 distinct values from the fixed 10-sector list. Permanence is enforced at two layers: (1) `UpdateUserRequest` simply has no `industrySectors` field, so the general update endpoint cannot touch it even if a client sends it; (2) the registration path (`createUser`) and the new one-time wizard-completion endpoint both reject the write if the target user already has `industrySectors` set (409 Conflict).

**Rationale**: The existing `User`/`businessLetterRequest`/`recommendationLetter` patterns all keep per-user structured data as fields on the owning document rather than spinning up a join table, and there is exactly one small, bounded array to store. Enforcing immutability at the API boundary (not just hiding the control in the UI) matches FR-004's "permanently prevent any change... through any UI **or workflow**."

**Alternatives considered**:
- *Separate `memberSectorAssignments` collection*: rejected — adds a join for every tender-visibility check with no benefit, since the data is 1:1 with a user and never queried independently of the user.
- *Soft-lock only in the UI (hide the edit control)*: rejected — doesn't satisfy "permanently" since a direct API call could still change it; also contradicts the explicit clarification that this must hold even against a tampered request (spec Edge Cases).

## R2 — Email template self-provisioning

**Decision**: The new "tender published" notification is defined as an `EmailTemplateDefinition` (name, subject, `htmlFile`, text, variables) next to `RECOMMENDATION_LETTER_DELIVERY` in `emailTemplateProvisioning.ts`, with its HTML body in a new `src/email_templates/tender_published_notification.html` file, and is provisioned via `ensureEmailTemplate(...)` the first time a tender is published (not a one-off seed script).

**Rationale**: Feature 005's research (R7) documented a production incident (PR #28) where a manually-seeded template was never actually seeded because deploys only ship `dist/` and seed scripts don't run automatically. The self-provisioning pattern (insert-if-missing from the HTML file, never overwrite an admin-edited template) already solves exactly this problem and is the established convention — introducing a second notification mechanism would regress that fix.

**Alternatives considered**: A manual Dashboard → Email Templates seed step — rejected for the same reason PR #28 failed: it depends on a manual step that deploys skip.

## R3 — Fan-out to sector-matched members

**Decision**: On successful tender creation, query `UserModel` for all users whose `industrySectors` array contains the tender's sector (`industrySectors: tender.sector`), excluding the creator's own `userId`, and send each one the provisioned template via `sendDynamicEmailDoc` inside a `Promise.allSettled`, logging/recording per-recipient outcome the same way `eventNotifications.ts` already does (`toOutcome` pattern: `status`, `attemptedAt`, `error`).

**Rationale**: `sendMassDynamicEmailDoc` is hard-wired to the `newsletter_subscribers` collection, so it can't be reused as-is for a `users`-collection, sector-filtered audience. Looping `sendDynamicEmailDoc` per recipient under `Promise.allSettled` is the smallest change that (a) reuses the existing, already-tested email-sending primitive and template-resolution logic, and (b) satisfies the best-effort/no-single-point-of-failure requirement (FR edge case: one bad email must not block tender publication or other recipients) exactly like the existing event-confirmation flow does.

**Alternatives considered**:
- *Generalize `sendMassDynamicEmailDoc` to accept an arbitrary recipient list*: rejected as unnecessary surface-area growth for a one-off need; the per-recipient loop is simpler and already has a precedent (`eventNotifications.ts`).
- *Queue/background job for sending*: rejected — no job queue exists in this repo, and expected volume (one notification burst per tender, fan-out to members of one sector) does not warrant adding one.

## R4 — Deadline-based "Closed" status without a scheduler

**Decision**: `TenderDocument` stores only `deadline: Date` and `closedByAdminAt: Date | null`. The effective status returned by the API is computed on read: `closedByAdminAt ? "closed" : (now > deadline ? "closed" : "open")`. No stored `status` field is ever flipped by a background process.

**Rationale**: A repo-wide search confirms no cron/scheduler library (`node-cron` or similar) is used anywhere in `src/`. Introducing one solely to flip a status flag at midnight would be new infrastructure for a value that is trivially derivable from a comparison already made on every read. This also sidesteps clock-skew/missed-run failure modes a scheduler would introduce.

**Alternatives considered**: A daily cron job that sets `status: "closed"` once `deadline` passes — rejected as unnecessary infrastructure for a derivable value, and it would introduce a new single point of failure (a missed/crashed job silently leaving expired tenders marked "Open").

## R5 — Manual admin close is `admin`-only, not `admin`+`procurement`

**Decision**: The close endpoint uses `adminOnlyMiddleware` (admin role only), distinct from the `adminAuthMiddleware` (admin + procurement) used for list/create visibility.

**Rationale**: The user's own clarification answer was specifically "admin can close it," distinguishing this one action from the broader "members + procurement + admin" answer given for tender *creation*. The codebase already has both middlewares pre-built for exactly this distinction (`adminOnlyMiddleware` vs `adminAuthMiddleware`), so no new access-control code is needed — just the correct existing middleware on the correct route.

**Alternatives considered**: Reusing `adminAuthMiddleware` (admin + procurement) for consistency with other admin routes — rejected because it would contradict the explicit scope decision the user made during clarification.

## R6 — Optional file attachment reuses existing upload handling

**Decision**: The tender create endpoint accepts a single optional file via tsoa's `@UploadedFile`, writes it to the existing `file_storage/` directory (same directory `FileController` already uses and that is already covered by deploy/asset handling), and stores its filename/mimetype/size/path as a small subdocument on the `Tender` document — no new `uploaded_files`-style registry entry is created since the attachment is only ever reached through its owning tender, not independently browsed.

**Rationale**: `FileController.uploadPdf` already establishes the exact convention (validate presence/type, sanitize the filename with `path.basename`, write under `file_storage/`) for member/admin-submitted files in this repo. Reusing the directory and the sanitization approach avoids introducing a second storage location or a second security review for path traversal. Skipping the separate `uploaded_files` registry is a conscious scope reduction: that registry exists to power the standalone File Management dashboard tab, which tender attachments have no reason to appear in.

**Alternatives considered**: Requiring the member to call the existing `/api/v1/files/pdf` endpoint first and pass back a `fileId` — rejected as a worse UX (two requests, and that endpoint is PDF-only and admin-gated) for a feature that needs a single-step, any-small-file-type attach-and-submit flow.

## R7 — Shared sector list, not duplicated strings

**Decision**: The 10 sectors are defined exactly once, in `src/config/industrySectors.ts`, exporting both a `const INDUSTRY_SECTORS: readonly string[]` array and an `IndustrySector` TypeScript union type derived from it. The UI imports this same file the way `recommendationLetters.ts` already imports types from `../../../src/types/...` across the `ui/`↔`src/` boundary.

**Rationale**: The sector list is used for (a) registration validation, (b) the wizard, (c) tender-sector selection, and (d) tender visibility filtering — duplicating the 10 strings in multiple files would create a correction-drift risk (e.g. a typo fixed in one place but not another silently breaking sector matching). The repo already has precedent for the UI importing shared constants/types directly from `src/` rather than hand-copying them.

**Alternatives considered**: Storing the sector list in the database (an admin-editable lookup collection) — rejected as unnecessary for a fixed, product-defined list the user explicitly enumerated; it would also reopen the question of what happens to existing members' permanent assignments if an admin edited the list later, which is out of scope.
