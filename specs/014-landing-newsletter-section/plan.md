# Implementation Plan: Landing Page Newsletter Section

**Branch**: `014-landing-newsletter-section` | **Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)

## Summary

Add a blueprint-driven "Newsletter" section to the landing page (`Home.tsx`) that lists sent newsletters as Blog-style cards. The existing `/api/v1/newsletter-articles` endpoints are admin-only and return full `html`, so they cannot be used directly. Add two read-only endpoints to the same controller: a **list** that returns teaser fields (id, title, sentAt, preview) for everyone and never any body, and a **detail** that returns the body only for signed-in users. The client blurs cards for visitors (presentation only; data is already body-free) and sends clicks to `/contact` (Membership Application); signed-in users open `/newsletter/:id`, rendered in a sandboxed iframe.

## Technical Context

**Language/Version**: TypeScript (Node/Express + tsoa), React 18 + react-router-dom (`ui/`)
**Primary Dependencies**: Mongoose (`NewsletterArticleModel`), existing `authMiddleware`/JWT cookie, Redux `auth.user`, `siteData` from the blueprint (`state.app.siteData`)
**Storage**: MongoDB `newsletterarticles` (read only; no schema change)
**Testing**: Manual/curl per [quickstart.md](quickstart.md)
**Target Platform**: Linux server + browser (SSR build)
**Project Type**: web application (`src/` + `ui/src/`)
**Performance Goals**: list capped (default 6, max 24), `html` excluded via projection
**Constraints**: No body content to unauthenticated clients; draft (`sentAt: null`) never exposed; HTML rendered in sandboxed iframe (articles are email HTML)
**Scale/Scope**: 2 endpoints, 1 landing section component, 1 detail page, 1 route

## Constitution Check

Constitution file is the unfilled template: no gates. Self-gates: no schema change, admin endpoints untouched, no body to anonymous users. **Pass** (unchanged after design).

## Project Structure

```text
specs/014-landing-newsletter-section/
├── plan.md  research.md  data-model.md  quickstart.md
├── contracts/newsletter-public.md
└── tasks.md            # /speckit-tasks

src/
├── controllers/newsletterArticle.controller.ts   # + GET public/list, GET public/{id}
├── middleware/optionalAuth.ts                     # NEW: sets req.user if valid token, never rejects
└── types/newsletterArticle.types.ts               # + NewsletterTeaser type

ui/src/
├── api/newsletterPublic.ts                        # NEW client calls
├── Pages/Home/NewsletterSection.tsx (+ .css)      # NEW section
├── Pages/Newsletter/NewsletterDetail.tsx          # NEW detail page for signed-in users
├── Pages/Home/Home.tsx                            # render section when siteData.newsletter exists
└── App.jsx                                        # + /newsletter/:id route (ProtectedRoute)
```

**Structure Decision**: Reuse the existing controller and Blog card styles; keep new UI in the Home and a small Newsletter page folder.

## Complexity Tracking

None.
