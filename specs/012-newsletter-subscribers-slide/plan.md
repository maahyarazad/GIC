# Implementation Plan: Newsletter Subscribers slide-out panel

**Branch**: `012-newsletter-subscribers-slide` | **Date**: 2026-10-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/012-newsletter-subscribers-slide/spec.md`

## Summary

Move the subscribers list out of its own Dashboard menu item and into the **Newsletter** section:
remove the "Email Subscribers" menu entry, add a button beside **New Article** that opens a
**slide-out panel** rendering the existing `NewsletterSubscribers` grid, and standardize user-facing
text on **Newsletter Subscribers**. Pure frontend change — no API, controller, or data-model work.
A small reusable `SlideOutPanel` component is added (none exists today).

## Technical Context

**Language/Version**: TypeScript React (Vite SSR client).

**Primary Dependencies**: React, Bootstrap 5 (styling conventions only), existing `GenericDataGrid`, existing `NewsletterSubscribers` component, `react-icons`.

**Storage**: N/A (no data changes). Grid reads its existing `/newsletter` GET source unchanged.

**Testing**: Manual QA via quickstart scenarios (repo has no wired UI test runner); feature files to typecheck clean under `tsc --noEmit`.

**Target Platform**: Web dashboard (admin/procurement roles).

**Project Type**: Web application (frontend-only change under `ui/`).

**Performance Goals**: Panel open/close is instant; grid performs exactly as the former menu view.

**Constraints**: No backend changes. Must not break Dashboard tab routing when the `newsletter_subscribers` key is removed. No `sass` dependency in the repo — ship compiled `.css` (optionally keep `.scss` source), matching how components import `./X.css`.

**Scale/Scope**: ~3 files touched + 1 new panel component: `Dashboard.tsx` (remove menu wiring), `Newsletter.tsx` (button + panel), new `SlideOutPanel` (+ css).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is an unfilled template — no ratified principles or gates. No
explicit constraints to evaluate. Proceeding under observed conventions: reuse the existing grid and
dashboard button styles; keep CSS as compiled `.css` imports; don't hand-edit generated files.

**Result**: PASS (no gates). Re-checked after Phase 1 — still PASS.

## Project Structure

### Documentation (this feature)

```text
specs/012-newsletter-subscribers-slide/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
└── tasks.md            # created by /speckit-tasks (not here)
```

### Source Code (repository root)

```text
ui/src/
├── Pages/Dashboard/Dashboard.tsx                     # REMOVE newsletter_subscribers menu wiring
├── Components/Dashboard/Newsletter/
│   ├── Newsletter.tsx                                # ADD "Newsletter Subscribers" button + panel
│   └── Newsletter.css                                # (reuse existing header/button styles)
├── Components/Dashboard/NewsletterSubscribers/
│   └── NewsletterSubscribers.tsx                     # REUSE as-is (renders inside the panel)
└── Components/Generic/SlideOutPanel/                 # NEW reusable slide-out
    ├── SlideOutPanel.tsx
    └── SlideOutPanel.css
```

**Structure Decision**: Frontend-only. The subscribers grid component is reused verbatim; the only
new building block is a generic `SlideOutPanel` placed under `Components/Generic/` next to the
existing `Generic/Dialog`. Dashboard loses one menu item; Newsletter gains one button + the panel.

## Complexity Tracking

> No constitution violations to justify (no gates defined). Table intentionally omitted.
