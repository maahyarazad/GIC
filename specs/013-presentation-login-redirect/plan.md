# Implementation Plan: Presentation Link Login Redirect

**Branch**: `013-presentation-login-redirect` | **Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/013-presentation-login-redirect/spec.md`

## Summary

A logged-out browser that opens `/api/v1/presentations/{id}/view` currently gets the JSON `{"message":"No token provided"}` from `authMiddleware`. Plan: add a small server-side guard that detects browser page navigations (not XHR/fetch) and answers `302 → /login?redirect=<original path>`, while XHR callers keep the JSON 401. On the client, make `Login.tsx` honour the existing `redirect` query param safely: validate it is a same-origin path and use a full page load for server-served (`/api/...`) targets, because react-router would otherwise render the SPA 404 for them.

## Technical Context

**Language/Version**: TypeScript (Node server, `tsx`), React 18 + react-router-dom in `ui/`
**Primary Dependencies**: Express, tsoa (`@Middlewares`), cookie-parser, jsonwebtoken; Redux Toolkit (`authSlice`)
**Storage**: N/A (JWT in `token` cookie; no new data)
**Testing**: Manual/curl per [quickstart.md](quickstart.md); no automated suite requested
**Target Platform**: Linux server + browser (SSR build for the SPA)
**Project Type**: web application (`src/` backend, `ui/` frontend in one repo)
**Performance Goals**: N/A (one extra header check per unauthenticated request)
**Constraints**: Must not leak presentation bytes without a session; must not break `axiosInstance` callers; no open redirect
**Scale/Scope**: 1 middleware wrapper, applied to `GET {id}/view`; 1 helper + 1 effect change in Login

## Constitution Check

`.specify/memory/constitution.md` is still the unfilled template, so there are no project gates to evaluate. Self-imposed gates: no new dependencies, no data model change, existing 401 contract preserved. **Pass** (re-checked after design: unchanged).

## Project Structure

### Documentation (this feature)

```text
specs/013-presentation-login-redirect/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── presentation-view-auth.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── middleware/
│   ├── auth.middleware.ts          # existing; unchanged semantics for API callers
│   └── browserLoginRedirect.ts     # NEW: wraps authMiddleware, redirects browser navigations
└── controllers/
    └── presentation.controller.ts  # {id}/view uses the wrapper instead of authMiddleware

ui/src/
├── Pages/Login/Login.tsx           # safe redirect handling (same-origin check, hard nav for /api/)
└── utils/safeRedirect.ts           # NEW: sanitizeRedirect(raw) -> path | null
```

**Structure Decision**: Existing web-app layout (`src/` + `ui/src/`). The redirect decision lives in a dedicated middleware so `authMiddleware` (used by many endpoints) is untouched; only the browser-facing `view` route opts in.

## Complexity Tracking

No constitution violations.
