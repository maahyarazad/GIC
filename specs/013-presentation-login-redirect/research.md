# Research: Presentation Link Login Redirect

## 1. Detecting a browser navigation vs. API call
- **Decision**: Treat a request as a browser navigation when `Sec-Fetch-Mode: navigate` is present, falling back to `Accept` containing `text/html` when that header is absent. Everything else (axios sends `Accept: application/json, text/plain, */*`) gets the unchanged JSON 401.
- **Rationale**: `Sec-Fetch-Mode` is set by all current browsers and cannot be set by page script; `Accept: text/html` covers older clients and `curl -H`.
- **Alternatives**: Always redirect (breaks XHR callers, violates FR-004); explicit `?format=` flag (links already shared would not carry it).

## 2. Where to redirect
- **Decision**: `302` to `/login?redirect=<encodeURIComponent(req.originalUrl)>`.
- **Rationale**: `Login.tsx` and `ProtectedRoute` already use the `redirect` query param, so no new contract.
- **Alternatives**: Serve the SPA at the same URL (conflicts with the API route); store destination in the server session (extra state, `redirect` param already exists).

## 3. Applying after login (important gap found)
- **Finding**: `Login.tsx` calls `navigate(decodeURIComponent(redirect ?? '/dashboard'))`. That is a client-side route change; `/api/v1/presentations/{id}/view` is not a SPA route, so the user would land on the SPA `NotFound`. It also performs no validation (open redirect risk, FR-005).
- **Decision**: Add `sanitizeRedirect()` that accepts only strings starting with a single `/` (not `//`, no scheme, no backslash). In Login: if the sanitized path starts with `/api/`, use `window.location.replace(path)`; otherwise keep `navigate(path, {replace:true})`. Invalid/empty → `/dashboard`.
- **Note**: `redirect` is currently `decodeURIComponent`-ed twice (`URLSearchParams` already decodes); only decode once.

## 4. Failed login keeps destination (FR-006)
- **Decision**: No change needed; the `redirect` stays in the URL query while the user retries on `/login`.

## 5. Expired session
- **Decision**: `authMiddleware` already attempts a silent refresh; when it fails it returns 401 "Token expired" / "Invalid token". The wrapper redirects on any 401 produced for a browser navigation, so these cases behave like "no token".

## 6. Scope
- **Decision**: Only the presentation `view` route now. The wrapper is generic, so the watermark download route can adopt it later.
