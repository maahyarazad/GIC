# Implementation Plan: Footer Newsletter Subscription and Admin-Added Subscribers

**Branch**: `015-footer-newsletter-subscribe` | **Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)

## Summary

Turn the existing (commented-out) footer subscription box back on, rate limit the public `POST /api/v1/newsletter`, add an admin-only bulk "add subscribers" endpoint with a dashboard modal in the Newsletter Subscribers panel, and add a derived Internal/External column. Research found that the subscriber admin routes (`GET /`, `PUT /{id}`, `DELETE /{id}`) currently have **no authentication**, so the plan also protects them with the existing admin middleware, which the new feature depends on.

## Technical Context

**Language/Version**: TypeScript (Express + tsoa), React 19 (`ui/`)
**Primary Dependencies**: `express-rate-limit` (already used in `src/middleware/ratelimiter.middleware.ts`), Mongoose (`NewsletterSubscriberModel`, `UserModel`), existing `adminAuthMiddleware`, `ModalContext.openModal` (dashboard modal), `GenericDataGrid`
**Storage**: MongoDB `newslettersubscribers` (no schema change), `users` read-only for the Internal check
**Testing**: Manual/curl per [quickstart.md](quickstart.md)
**Target Platform**: Linux server behind a reverse proxy, browser
**Project Type**: web application (`src/` + `ui/src/`)
**Performance Goals**: Internal check = one `$in` query per list page (≤ page size emails)
**Constraints**: Public endpoint must not leak subscribers; limiter must key on the real client IP (see research #2)
**Scale/Scope**: 1 limiter, 1 new endpoint, 3 routes get admin auth, 1 footer re-enable, 1 modal, 1 column

## Constitution Check

Constitution file is the unfilled template: no gates. Self-gates: no schema change, public endpoint keeps its contract, admin protection added without changing responses. **Pass** (unchanged after design).

## Project Structure

```text
specs/015-footer-newsletter-subscribe/
├── plan.md  research.md  data-model.md  quickstart.md
├── contracts/newsletter-subscribers.md
└── tasks.md            # /speckit-tasks

src/
├── middleware/ratelimiter.middleware.ts        # + subscribeLimiter
├── controllers/newsletter.controller.ts        # limiter on POST /, adminAuth on list/PUT id/DELETE, + POST admin/bulk, list adds `type`
├── types/newsletterSubscriber.types.ts         # + SubscriberType, BulkAddRequest/Result, `type` on subscriber
├── mappers/newsletter.mapper.ts                # carry `type`
└── server.ts                                   # trust proxy (if behind a proxy)

ui/src/
├── Components/Footer/Footer.tsx                # re-enable the Newsletter block, handle 429/duplicate messages
└── Components/Dashboard/NewsletterSubscribers/NewsletterSubscribers.tsx   # Add button + modal, Type column
```

**Structure Decision**: Extend the existing controller and panel; no new modules besides one limiter.

## Complexity Tracking

None.
