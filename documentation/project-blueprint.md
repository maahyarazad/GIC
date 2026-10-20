# GIC Project Blueprint

Reusable reference for rebuilding the same dashboard, editors, presentations and events stack in an identical project with a different theme. Everything below is taken from this repo (paths are relative to the repo root). Only the **theme tokens** (section 1.1) should change between projects.

Contents

1. [Dashboard UI kit: buttons, icons, sizing](#1-dashboard-ui-kit)
2. [Newsletter editor stack: Monaco + GrapesJS Studio](#2-newsletter-editor-stack)
3. [Presentations: upload, protected view, authorization](#3-presentations)
4. [Server middlewares (auth, roles, redirect, limits)](#4-server-middlewares)
5. [Events: models and emails](#5-events)

---

## 1. Dashboard UI kit

Stack: React 19, Bootstrap 5.3 (grid/forms only), `react-icons` (Font Awesome 6 set, `react-icons/fa6`), SCSS compiled to CSS next to each `.scss`. Fonts: `--se` serif for headings, `--sa` (Rajdhani) for UI text.

### 1.1 Theme tokens (the only thing to change per project)

Defined in `ui/src/index.scss` on `:root` (dark default) and overridden under `[data-theme="light"]`.

```scss
:root {
  --bg:  #0A0A0A;  --bg2: #111111;  --bgp: #161616;  --bgp2: #1c1c1c;   // page, sidebar, panel, panel-raised
  --bdr: rgba(255,255,255,0.08);  --bdrs: rgba(255,255,255,0.14);       // border, border-strong
  --ora: #C8541A;  --or2: #E8632A;  --or3: #E8742A;                     // ACCENT, accent-hover, accent-light
  --txt: #F5F2EE;  --mu: rgba(245,242,238,0.52);  --bo: rgba(245,242,238,0.80);
  --se: 'Cormorant Garamond', Georgia, serif;
  --sa: 'Rajdhani', sans-serif;
}
[data-theme="light"] { --bg: ...; --bg2: ...; --bgp: ...; --bgp2: ...; --bdr: ...; --bdrs: ...; --txt: ...; --mu: ...; --bo: ...; }
```

**Retheming rules**

- Rename nothing; change token values. `--ora/--or2/--or3` are the accent family (the name is historical).
- The accent also appears as a hard-coded RGB triplet `200, 84, 26` (`rgba(200, 84, 26, …)`) in `index.scss` button shadows/rings and `$ora-rgb: 200, 84, 26` plus `--ora-dark: #9a4114` in `ui/src/Pages/Dashboard/Dashboard.scss`. When retheming, replace those with the new accent RGB (best: introduce `--accent-rgb` and use `rgba(var(--accent-rgb), .45)`).
- Danger red `#d11a2a` / `rgba(209, 26, 42, …)` is separate from the accent and stays.
- Text on the filled button is `var(--bg)`; check contrast against the new accent.

### 1.2 Button system (`ui/src/index.scss`, "BUTTONS")

One shared base so every button has identical geometry:

| Property | Value |
|---|---|
| Layout | `inline-flex`, centered, `gap: 6px` |
| Padding / min-height | `7px 14px` / `34px` |
| Radius | `10px` (also forced on all `.dashboard button`, `.btn`, in `Dashboard.scss`) |
| Border | `1px solid transparent` |
| Font | inherit family, `0.8rem`, weight `600`, line-height `1.2`, `nowrap` |
| Transition | background/border/box-shadow/color `0.2s ease`, transform `0.1s` |
| Focus-visible | no outline; `box-shadow: 0 0 0 3px rgba(ACCENT, 0.45)` |
| Active (pressed) | `transform: scale(0.97)` + `0 0 0 3px rgba(ACCENT, 0.35)` |
| Disabled | `opacity: .5`, `cursor: not-allowed`, no shadow/transform, `pointer-events: none` |

Variants (all `@extend %dashboard-btn-base`):

| Class | Look | Use |
|---|---|---|
| `.dashboard-btn` | filled `--ora`, text `--bg`, shadow `0 3px 10px rgba(ACCENT,.4)`; hover `--or2` | primary action |
| `.dashboard-btn--ghost-minimal` | transparent, accent text + 1px accent border; hover tint `rgba(ACCENT,.1)` | secondary action |
| `.dashboard-btn--delete`, `--delete-ghost` | transparent, `#d11a2a` text, **dashed** red border; hover `rgba(209,26,42,.1)` | text-style destructive |
| `.dashboard-btn--icon` | 34×34, padding 0, `font-size: 18px`, `--txt` icon, `--bdr` border; hover accent icon/border + tint `.08` | icon-only action |
| `.dashboard-btn--icon-danger` | same box, `#d11a2a` icon + border; hover tint `.1` | icon-only destructive |

Icon buttons are the same height (34px) as text buttons so mixed rows align.

### 1.3 Icons and row actions

Icon set: `react-icons/fa6` — `FaEye` (View), `FaPen` (Edit), `FaTrash` (Delete). Icon size comes from the button (`font-size: 18px`); do not size the SVGs themselves.

Reusable component `ui/src/Components/Generic/GridActions/GridActions.tsx`:

```tsx
<GridActions
  onView={() => ...}       // eye
  onEdit={() => ...}       // pencil
  onDelete={() => ...}     // trash, danger style
  disabled={false}         // disables all three
  deleteDisabled={row.published}                       // disables only delete
  deleteDisabledReason="Unpublish before deleting"     // tooltip while disabled
/>
```

- Wrapper: `<div className="d-flex gap-2 flex-wrap">` (gap 0.5rem).
- Each button: `type="button"`, `className="dashboard-btn--icon"` (delete: `--icon-danger`), `title` + `aria-label` set to View / Edit / Delete. Only handlers that are passed render a button.
- DataGrid "Actions" cell pattern (Newsletter): `<div className="newsletter-row-actions">` = `GridActions` + switch + text buttons; the container is `display:flex; gap: 6px 10px; align-items:center; flex-wrap: wrap`. Text buttons order: ghost (`Send Test`) then primary (`Send to Subscribers`).

### 1.4 Toggle switch (Published)

Markup is a label with a visually hidden checkbox (`role="switch"`) followed by a track span; styles live in `Newsletter.css` (`.newsletter-switch*`), copy to a shared stylesheet.

| Part | Size |
|---|---|
| Track | 38 × 22, radius 11, `--bgp2` fill, `1px --bdr` border |
| Knob (`::after`) | 16 × 16 circle, 2px inset, `--mu`; checked: `translateX(16px)`, white |
| Checked track | accent fill + accent border |
| Focus | `2px` accent outline, `2px` offset |
| Label text | 13px, `--mu`, gap 10px |

Toggles persist immediately (optimistic update, revert + error toast on failure).

### 1.5 Layout sizing

| Element | Size |
|---|---|
| Fixed header | 70px |
| Sidebar | 240px wide (`min-width: 240px`), `padding: .5rem`, `--bg2`, 1px right border; sticky at `top: 70px`, `height: calc(100dvh - 70px)` from 768px up |
| Mobile sidebar | `position: fixed`, 250px, slides in (`translateX(-100%)` → 0), z-index 1001, breakpoint `max-width: 767px` |
| Sidebar item | `padding: 10px 12px`, radius 6, active = accent text + `--bdrs` fill |
| Dashboard min height | `92dvh`, `overflow-x: clip` (a scroll container would break sticky) |
| Section header `.dash-header` | flex space-between, `margin-bottom: 2rem`, `padding-bottom: 1.25rem`, 1px `--bdr` bottom border; `h3`: `--se`, `1.75rem`, weight 500, `letter-spacing .02em` |
| Count next to title `.dash-header-count` | `0.85rem`, weight 500, `--mu`, `margin-left: 10px` |
| Section wrapper `.dash-section` | `padding: .1rem 0`, font `--sa` |
| Text buttons / icon buttons | 34px tall (see 1.2) |
| Pointer cursor | applied to all dashboard buttons/links/roles/checkbox labels; disabled → `not-allowed` |
| Focus ring (dialogs, links, tabs) | `outline: 2px solid var(--ora); outline-offset: 2px`; sidebar items use `-2px` offset (they clip overflow) |
| Form focus | border accent + `0 0 .25rem` ring at 25% accent |

Page content cards (e.g. Blog/newsletter cards): radius 8, 1px `--bdr`, hover lifts `translateY(-3px)` with `0 6px 32px var(--bo)` and border `--bdrs`.

---

## 2. Newsletter editor stack

Two interchangeable editors edit the same HTML string. The form (`ui/src/Components/Dashboard/Newsletter/Newsletter.tsx`) lets the admin pick one (remembered per browser in `localStorage` key `newsletter-editor`); content is kept when switching. Both are lazy-loaded (`React.lazy` + `Suspense`) so they never run during SSR.

### 2.1 Libraries (`ui/package.json`)

| Package | Version | Role |
|---|---|---|
| `@grapesjs/studio-sdk` | ^1.2.1 | Visual editor (React wrapper `@grapesjs/studio-sdk/react`, styles `@grapesjs/studio-sdk/style`, types from `@grapesjs/studio-sdk` and `grapesjs`) |
| `@monaco-editor/react` | ^4.7.0 | HTML code editor |
| `react`, `react-dom` | ^19.1.0 | |
| `axios` | ^1.9.0 | API + license-key fetch |
| `dompurify` | ^3.4.5 | sanitising rendered HTML elsewhere |

### 2.2 Monaco code editor (`ui/src/Components/Dashboard/HtmlEditor/HtmlEditor.tsx`)

```tsx
<Editor
  height="75vh"
  defaultLanguage="html"
  theme="vs-dark"
  value={value}
  onChange={(v) => onChange(v || "")}
  options={{
    fontSize: 14, minimap: { enabled: true }, automaticLayout: true, wordWrap: "on",
    formatOnPaste: true, formatOnType: true, autoClosingTags: true,
    autoClosingBrackets: "always", tabSize: 2,
  }}
/>
```

Props: `{ value: string; onChange(code: string): void }`. Monaco loads its workers from a CDN by default (no Vite plugin needed).

### 2.3 GrapesJS Studio (`ui/src/Components/StudioEditor/StudioNewsletterEditor.tsx`)

Contract: `{ value: string; onChange(html): void; onSave?(html): void | Promise<void> }`. `onChange` receives email-ready HTML (`""` when empty); `onSave` fires only on an explicit save.

Key setup:

- **License key from the server, not Vite env.** `GET /api/v1/newsletter-articles/studio-license-key` (admin-only) returns `{ data: { licenseKey } }` from `process.env.GRAPESJS_LICENSE_KEY`, falling back to `DEMO_LOCALHOST_KEY` (localhost only). The editor renders an empty host until the key arrives.
- **Project type** `{ type: "web" }` so plain HTML (including legacy Quill output) loads and round-trips.
- **Load**: `storage.type: "self"` with `onLoad` returning `{ project: { pages: [{ name: "Newsletter", component: html }] } }` from a ref to the latest `value`.
- **Export**: `editor.runCommand("studio:projectFiles", { styles: "inline", skipProject: true })` → pick the HTML file → re-inline any externalised image assets as `data:` URLs → treat "no text and no `<img>`" as empty. Inline styles are what email clients need.
- **Images are base64 only** (no upload endpoint): `assets.storageType: "self"`, `onUpload` maps files to `{ src: dataUrl, name, mimeType, size }`, `onDelete` is a no-op.
- **Saving**: `autosaveChanges: 0` (no autosave: saving submits the article). `storage.onSave` exports and calls `onChange` then `onSave`. Ctrl/Cmd+S is bound to `editor.store()` (with `preventDefault`).
- **Live changes**: `onUpdate` (ignored until `onReady`) debounces 400 ms, exports, calls `onChange`.
- **Theme**: `theme: "dark" | "light"` read from `<html data-theme>` via a `MutationObserver`; `customTheme` is built from the app's CSS variables (`--bg`, `--bgp`, `--bgp2`, `--bdr`, `--txt`, `--mu`, `--ora`, `--or2`, `--or3`) with `getComputedStyle`, so retheming the tokens retheme the editor. The editor is remounted (`key={appTheme}`) when the theme changes.
- **Gotcha: nested forms.** Studio renders its own `<form>` (Page settings "Update") inside the article `<form>`. Wrap the editor host with `onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); }}` or its submit bubbles into the article form, saves stale HTML and leaves the editor.
- **Gotcha: staying in the editor.** The host passes `onSave` that calls `submitArticle(html, { stay: true })`; after the first save of a *new* article the returned record is stored as `editingArticle` so later saves `PUT` instead of creating duplicates.
- Page settings meta tags (title, description, favicon, social tags, custom head/body) are managed by Studio in the page `<head>`; they only reach the saved HTML if the page-settings submit does not escape into the outer form.

Article fields: `title`, `subject`, `html`, `text?`, `sentAt`, `published` (default false; changed only by the grid toggle, never by Save). Delete is disabled in the UI while published.

---

## 3. Presentations

Members upload PDF/PowerPoint files and attach them to an event. Files are private and are only reachable through an authorised route.

### 3.1 Model (`src/models/presentation.model.ts`, collection `presentations`)

| Field | Type | Notes |
|---|---|---|
| `title` | String | required, trimmed, max 160 |
| `eventId` | ObjectId → Event | required, indexed (one event → many presentations) |
| `uploadedBy` | ObjectId → User | required |
| `originalName` | String | client filename, `path.basename` only, max 260 |
| `storedName` | String | `"<_id>.<ext>"`, unguessable, never exposed |
| `contentType`, `extension`, `size` | | MIME, extension, bytes |
| timestamps | | `createdAt`, `updatedAt` |

`mapPresentation()` returns `{ id, title, eventId, uploadedBy, originalName, contentType, extension, size, createdAt, viewUrl }` with `viewUrl = /api/v1/presentations/<id>/view`.

Constants (`src/types/presentation.types.ts`, shared with the UI): `MAX_PRESENTATION_BYTES = 50 MB`; types `application/pdf`, `application/vnd.ms-powerpoint`, `application/vnd.openxmlformats-officedocument.presentationml.presentation`; extensions `pdf, ppt, pptx` (type and extension must both match).

### 3.2 Endpoints (`src/controllers/presentation.controller.ts`, tsoa, `@Route("api/v1/presentations")`)

| Method / path | Middleware | Behaviour |
|---|---|---|
| `POST /` (multipart: `file`, `eventId`, `title`) | `authMiddleware` | Validates user, file present, title, valid existing event, MIME+extension, size. Generates the `ObjectId` first, writes `presentation_storage/<id>.<ext>`, creates the record; if the DB insert fails the file is unlinked. 201 `{ presentation }`. Errors: 400 (`NO_FILE`, `MISSING_TITLE`, `INVALID_EVENT`, `INVALID_FILE_TYPE`), 401, 413 `FILE_TOO_LARGE`. |
| `GET /?eventId=` | `authMiddleware` | Any signed-in member lists an event's presentations (newest first). |
| `GET /{id}/view` | `browserLoginRedirect` | Streams the file inline (`Content-Type` from the record, `Content-Disposition: inline; filename="…"`). 404 if record/file missing. |
| `DELETE /{id}` | `authMiddleware` | Allowed for the uploader or `role === "admin"`; otherwise 403. Deletes the record, then the file (best effort). |

### 3.3 Storage and serving rules

- Files live in `presentation_storage/` at the process root. It is **never** mounted statically (the public `/uploads` mount serves `file_storage/`, so presentations are deliberately kept out of it). Only the `view` route can read them.
- Multer: `RegisterRoutes(app, { multer: multer({ limits: { fileSize: 50 * 1024 * 1024 } }) })` in `src/server.ts` (tsoa defaults to 8 MB). Memory storage; each controller still re-checks the size.
- The same pattern protects PDFs behind `GET /api/v1/watermark/:fileId` (`authMiddleware`, files in `pdf_storage/`, watermarked per user on download).

### 3.4 Client (`ui/src/api/presentations.ts`, `ui/src/Components/Dashboard/Presentations/`)

- `uploadPresentation({ eventId, title, file }, onProgress?, signal?)` posts `FormData` with `axiosInstance`, `Content-Type: multipart/form-data`, `onUploadProgress` → percent.
- Pre-check size against `MAX_PRESENTATION_BYTES`; file input `accept=".pdf,.ppt,.pptx"`.
- `UploadProgress` renders a determinate `role="progressbar"` bar and an error line.
- Opening a presentation uses `presentationViewUrl(id)` in a new tab. An unauthenticated *browser navigation* is redirected to the login page (section 4.3); axios callers still get the JSON 401.

---

## 4. Server middlewares

All are Express middlewares used through tsoa's `@Middlewares(...)`. Auth is a JWT in the `token` cookie (`httpOnly`), with a `refreshToken` cookie for silent re-issue.

### 4.1 `authMiddleware` (`src/middleware/auth.middleware.ts`)

1. No `token` cookie → `401 { message: "No token provided" }`.
2. `jwt.verify(token, JWT_SECRET)`; success → `req.user = { userId, role, … }`, `next()`.
3. `TokenExpiredError` → `reissueAccessTokenFromRefresh` (uses `refreshToken` cookie); success continues, otherwise `401 { message: "Token expired", code: "TOKEN_EXPIRED" }`.
4. Other `JsonWebTokenError` → `401 { message: "Invalid token" }`. Anything else → 500.
5. Throws at startup if `JWT_SECRET` is missing.

### 4.2 Role middlewares (`src/middleware/adminauth.middleware.ts`)

`requireRoles(roles)` has the same flow as above plus `403 { message: "Forbidden: Admins only" }` when the role is not allowed (also re-checked after a refresh).

- `adminAuthMiddleware = requireRoles(["admin", "procurement"])`
- `adminOnlyMiddleware = requireRoles(["admin"])`

### 4.3 `browserLoginRedirect` (`src/middleware/browserLoginRedirect.ts`)

Wraps `authMiddleware` for URLs opened directly in a browser. A request is a navigation when `Sec-Fetch-Mode === "navigate"` (or, if that header is absent, `Accept` contains `text/html`). For navigations, any 401 produced by `authMiddleware` becomes `302 /login?redirect=<encodeURIComponent(originalUrl)>`; everything else (XHR/fetch, curl with JSON) keeps the JSON 401. Implemented by temporarily intercepting `res.status(401)`.

Client side (`ui/src/Pages/Login/Login.tsx`, `ui/src/utils/safeRedirect.ts`): after login, `sanitizeRedirect(redirect)` accepts only a single-slash same-origin path (rejects `//host`, `/\`, schemes, control characters) and falls back to `/dashboard`; targets starting with `/api/` use `window.location.replace` (the SPA router cannot serve them), others use `navigate(path, { replace: true })`. `ProtectedRoute` builds the same `?redirect=` for in-app pages.

### 4.4 `optionalAuth` (`src/middleware/optionalAuth.ts`)

Sets `req.user` if the cookie token verifies; never rejects. Used where the response differs for visitors and members (public newsletter list).

### 4.5 Rate limiting (`src/middleware/ratelimiter.middleware.ts`)

`strictLimiter` (5 req/min, e.g. event attendance), `previewLimiter` (60 req/min). Chained like `@Middlewares<Function>(strictLimiter, authMiddleware)`.

---

## 5. Events

### 5.1 `Event` (`src/models/event.model.ts`, collection `boardmeetings` — name kept from the original feature)

| Field | Type | Notes |
|---|---|---|
| `title` | String | required, max 160 |
| `description` | String | default "", max 2000, plain text |
| `startsAt` | Date | required, UTC instant |
| `venue` | String | required, max 160 |
| `location` | String | required, max 300 |
| `imageUrl` | String \| null | `/uploads/<file>` |
| `capacity` | Number | 1–50, default 10 |
| `confirmedCount` | Number | seat counter, only changed by the attendance create (`$inc`), the seat release on failure, and the migration |
| `createdBy`, `updatedBy` | ObjectId → User | |
| timestamps | | index `{ startsAt: -1 }` |

Time handling: admins enter `date` (`YYYY-MM-DD`) + `time` (`HH:mm`) in **Gulf Standard Time (Asia/Dubai, UTC+4, no DST)**; `toStartsAt()` converts to UTC (`DUBAI_UTC_OFFSET_HOURS = 4`), `toDubaiParts()` converts back, `isValidEventDate/Time` reject overflows (e.g. 2026-02-31). Email formatters: `formatEventDateForEmail` → `Thu, 15 Oct 2026`, `formatEventTimeForEmail` → `18:30 (GST)`.

DTOs (`src/types/event.types.ts`): `EventDto` (adds `date`, `time`, `seatsLeft = max(capacity − confirmed, 0)`, `isFull`, `isPast`), `MemberEventDto` (+ `myAttendance`, `presentationCount`), `AdminEventDto` (+ `confirmedCount`, timestamps), `EventInput` (create/update body, full replace).

### 5.2 `EventAttendance` (`src/models/eventAttendance.model.ts`, collection `boardmeetingrequests`)

| Field | Notes |
|---|---|
| `reference` | unique, `EV-YYYYMMDD-<last 6 hex of _id, upper>` (`buildEventReference`) |
| `meetingId` | → Event (exposed as `eventId` in DTOs) |
| `userId` | → User; **unique with `meetingId`** (one attendance per user per event) |
| `requester` | `{ name, email (lowercased), phone }` copied from the user record, never from the client |
| `status` | `confirmed` \| `cancelled` (legacy `approved` is normalised to `confirmed`) |
| `notifications.leadership`, `.confirmation` | `{ status: not_sent|pending|sent|failed, attemptedAt, error }` |

Indexes: `{meetingId, userId}` unique, `{meetingId, status, createdAt:-1}`, `{userId, createdAt:-1}`.

### 5.3 Endpoints

Public/member (`src/controllers/event.controller.ts`, `api/v1/events`): `GET /public` (public list), `GET /` (`authMiddleware`, includes `myAttendance` and `presentationCount`), `POST /{id}/attendance` (`strictLimiter` + `authMiddleware`).

Admin (`src/controllers/eventAdmin.controller.ts`, all `adminOnlyMiddleware`): `api/v1/admin/events` `GET /`, `POST /`, `PUT /{id}`, `DELETE /{id}`; `api/v1/admin/event-attendances` `GET /`, `POST /{id}/resend-confirmation`.

### 5.4 Confirming attendance (`POST /{id}/attendance`)

1. Validate the id; load the user from the token.
2. If an attendance exists → `409 ALREADY_ATTENDING` (returns it) *before* touching the counter.
3. **Atomic seat reservation**: `findOneAndUpdate({ _id, startsAt: { $gt: now }, $expr: { $lt: ["$confirmedCount", "$capacity"] } }, { $inc: { confirmedCount: 1 } })`. No match → `404 EVENT_NOT_FOUND`, or `409 EVENT_PAST` / `EVENT_FULL`.
4. Create the attendance (`reference` retried once on a duplicate-key reference collision). On any failure call `releaseSeat`; a concurrent duplicate (`11000` on `meetingId`) returns `409 ALREADY_ATTENDING`.
5. Fire-and-forget `notifyAttendanceConfirmed(doc._id)`; the attendance stands regardless of email outcome. Respond `201` with `{ reference, status, createdAt }`.

### 5.5 Event emails

Config (`src/config/eventConfig.ts`, env overrides in parentheses): `EVENT_CC` (`EVENT_CC`, fallback `BOARD_MEETING_CC`, else 4 default leadership addresses), `EVENT_NOTIFY_TO` (`EVENT_NOTIFY_TO` → `BOARD_MEETING_NOTIFY_TO` → `SMTP_INFO_SENDER` → `info@german-industry-club.com`), `EVENT_TIMEZONE = "Asia/Dubai"`, template names `event_attendance_notification` and `event_attendance_confirmation`.

Service (`src/services/eventNotifications.ts`):

- `notifyAttendanceConfirmed(attendanceId)` — loads attendance + event, builds variables, and sends two emails **in parallel** with `Promise.allSettled`:
  - leadership notification → `EVENT_NOTIFY_TO`, `cc: EVENT_CC`, `replyTo` = member email;
  - member confirmation → the member's email, `replyTo: EVENT_NOTIFY_TO`.
  Both use `sender: "info"`. Each outcome is stored on the attendance (`notifications.leadership|confirmation` = `{status: sent|failed, attemptedAt, error (≤500 chars)}`). The function never throws.
- `sendConfirmation(attendanceId)` — resend path (admin button): sets confirmation `pending`, sends, records the outcome, returns the status.
- Template variables (`buildEmailVariables`): `REFERENCE, REQUESTER_NAME, REQUESTER_EMAIL, REQUESTER_PHONE (— if empty), EVENT_TITLE, EVENT_DATE, EVENT_TIME, EVENT_VENUE, EVENT_LOCATION, EVENT_DESCRIPTION (default text if empty), CONFIRMED_AT (en-GB, Dubai time), SEATS_LEFT, DASHBOARD_URL` (`<CLIENT_ORIGIN_PROD|DEV>/dashboard?tab=manage_events`, prod chosen by `NODE_ENV === "PRODUCTION"`). Subject and text use raw values; the HTML body uses HTML-escaped values (`escapeHtml`, description newlines → `<br />`) via the `htmlData` option.

Mailer (`src/services/emailService.ts`, nodemailer): `sendDynamicEmailDoc(templateName, data, { sender, cc, replyTo, htmlData, attachments })` loads the document with `name = templateName` from the `emailtemplates` collection (`{ name, subject, html, text, variables }`), merges global variables, replaces `{{PLACEHOLDERS}}` in subject/html/text, and sends to `data.email`. Senders: `"default"` = `SMTP_USER/SMTP_PASS/SMTP_SENDER` (do-not-reply@), `"info"` = `SMTP_INFO_USER/SMTP_INFO_PASS/SMTP_INFO_SENDER` (info@).

Templates: HTML sources in `src/email_templates/` (`event_attendance_notification.html`, `event_attendance_confirmation.html`, plus business letter, recommendation letter and tender templates), copied to `dist/email_templates` by `npm run copy-assets`. `ensureEmailTemplate()` (`src/services/emailTemplateProvisioning.ts`) inserts a template from its file on first use with `$setOnInsert`, so an existing, dashboard-edited template is never overwritten (do not rely on seed scripts running at deploy time).

### 5.6 Environment variables used by the above

`JWT_SECRET`, `GRAPESJS_LICENSE_KEY`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SENDER`, `SMTP_INFO_USER`, `SMTP_INFO_PASS`, `SMTP_INFO_SENDER`, `EVENT_CC`, `EVENT_NOTIFY_TO`, `CLIENT_ORIGIN_PROD`, `CLIENT_ORIGIN_DEV`, `NODE_ENV`, `PDF_WATERMARK_VERSION`.

### 5.7 Porting checklist for a new project

1. Copy the token block (1.1) and set the new palette and accent RGB; replace the hard-coded `200, 84, 26` / `#9a4114`.
2. Copy button/icon/switch styles, `GridActions`, `.dash-*` classes and the sizing in 1.5.
3. Install the packages in 2.1; copy `HtmlEditor.tsx` and `StudioNewsletterEditor.tsx`; add the license-key endpoint and `GRAPESJS_LICENSE_KEY`.
4. Copy the middlewares in section 4 and the login `redirect` handling; create `presentation_storage/` (git-ignored, not served statically) and the 50 MB multer limit.
5. Copy the Event/EventAttendance/Presentation models and types, the two controllers, `eventNotifications.ts`, `eventConfig.ts`, the email templates and the `emailtemplates` provisioning; set the SMTP and recipient env vars.
6. Run `npm run tsoa:routes` after adding controllers.
