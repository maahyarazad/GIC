# Quickstart / Validation: Newsletter Subscribers slide-out panel

Manual validation scenarios. See [contracts/ui-contract.md](./contracts/ui-contract.md) for the
component interface. Frontend-only; no DB/API changes.

## Prerequisites

- App running (Vite SSR client served by Express).
- Sign in as an **admin** (and separately a **procurement**) account to reach the Newsletter section.
- Some newsletter subscribers exist (so the grid has rows); the empty state is also acceptable to verify.

## Scenario 1 — Open the panel from Newsletter (US1, FR-002/003)

1. Go to **Dashboard → Newsletter**.
2. Confirm a **Newsletter Subscribers** button sits next to **New Article**.
3. Click it. **Expect**: a panel slides out from the right showing the full subscribers data grid.
4. Page, sort, and filter the grid. **Expect**: identical behavior to the former standalone view.

## Scenario 2 — Close the panel (US1, FR-004/009)

1. With the panel open, close it via the **✕** control. **Expect**: panel slides away; newsletter list unchanged.
2. Reopen; click the **backdrop**. **Expect**: closes.
3. Reopen; press **Esc**. **Expect**: closes and focus returns to the trigger button.

## Scenario 3 — Menu item removed + rename (US2, FR-001/005)

1. Open the Dashboard menu as **admin**. **Expect**: no "Email Subscribers"/"Email Subscription" item.
2. Repeat as **procurement**. **Expect**: same — no such item.
3. Inspect the button and panel heading. **Expect**: both read **"Newsletter Subscribers"**.

## Scenario 4 — Stale deep link (FR-007)

1. Navigate to the dashboard with the old tab query (e.g. `?tab=newsletter_subscribers`).
2. **Expect**: the app resolves to the role's default view without error (old key is no longer valid).

## Scenario 5 — Responsiveness / robustness (edge cases)

1. At mobile width, open the panel. **Expect**: usable (full/near-full width), no horizontal page scroll.
2. Toggle open/close rapidly several times. **Expect**: no stuck backdrop and page scroll is restored.

## Success check

Maps to Success Criteria SC-001…SC-004: full grid capability reachable from Newsletter, zero old
menu entries, zero old labels, all three dismiss methods work.

## Typecheck

- `cd ui && npx tsc --noEmit -p tsconfig.json` — the files changed by this feature report no new errors
  (the repo has pre-existing unrelated `tsc` errors; only regressions in touched files matter).
