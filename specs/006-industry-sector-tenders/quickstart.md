# Quickstart: Validate Industry Sector Selection & the Tender Board

This guide proves the feature works end to end. Endpoints are in [contracts/tenders.api.md](./contracts/tenders.api.md); field rules are in [data-model.md](./data-model.md).

## Prerequisites

1. **Test accounts, each with an inbox you can check**:
   - A brand-new member (not yet registered) — to exercise the registration-time sector step.
   - An existing member created *before* this feature, with no `industrySectors` set — to exercise the wizard. (Seed one directly in Mongo if every test account already has sectors: `db.users.updateOne({email:"..."}, {$unset:{industrySectors:"", industrySectorsSetAt:""}})`.)
   - A second existing member who will be given a sector that **overlaps** with the first, to prove notification fan-out and visibility scoping.
   - One `admin` account.
2. **Build and run**:
   ```bash
   npm run build && ls dist/email_templates | grep tender_published_notification   # copy step must include the new template
   (cd ui && npm run build)
   npm run dev
   ```

## Scenarios

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 1 | Registration gate | Register the brand-new member; on the sector step try submitting with 2 sectors selected, then 4, then exactly 3 | Blocked for 2 and 4 with a clear message; the permanence notice is visible on this step; exactly 3 completes registration |
| 2 | Permanence (server-side) | As the now-registered member, `PUT /api/v1/users/{id}` (the general update endpoint) with a different `industrySectors` value | The field is ignored/not accepted — the user's sectors are unchanged |
| 3 | Existing-member wizard | Log in as the pre-seeded member with no sectors; open Dashboard → Tenders | The wizard appears (not the tender list), with the same permanence notice; selecting exactly 3 and confirming lands directly in the tender list |
| 4 | Wizard write-once | As that same member, call `PUT /api/v1/users/me/industry-sectors` again with a different set of 3 | 409 `SECTORS_ALREADY_SET`; opening the Tenders tab again shows the board, never the wizard |
| 5 | Create a tender | As the first member, open Dashboard → Tenders → Create. Confirm only their own 3 sectors are offered. Try submitting with the deadline field blank | Blocked with a validation message; filling it in and submitting (with and without an optional attached file, as two separate tenders) succeeds for both |
| 6 | Sector-scoped visibility | As the second member (assigned to one overlapping sector and two non-overlapping ones), open Tenders | Only the tender(s) under the overlapping sector are visible; none from the first member's other two sectors appear |
| 7 | Contact note | Open any tender | The creator's email and the exact text "Please contact me for any further details." are shown |
| 8 | Email notification | After step 5's creation | The second member's inbox received an email about the new tender linking to the Tenders tab; the creator did **not** receive a notification about their own tender |
| 9 | Deadline auto-close | Create a tender with a deadline in the past (or wait one out) | It is still listed, now showing status "Closed", with no UI path to reopen it |
| 10 | Admin manual close | As admin, open an *open* tender and close it; then try closing it again | First close succeeds immediately (status flips to "Closed" for all viewers); second attempt returns 409 `ALREADY_CLOSED` and no reopen control exists anywhere |
| 11 | Role scope for creation/closing | As `procurement`, create a tender for any sector (not just three); then attempt `PATCH /api/v1/tenders/{id}/close` | Creation succeeds for an arbitrary sector; the close call is rejected (403) — only `admin` may close |
