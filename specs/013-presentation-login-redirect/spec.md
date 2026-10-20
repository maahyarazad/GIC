# Feature Specification: Presentation Link Login Redirect

**Feature Branch**: `013-presentation-login-redirect`

**Created**: 2026-10-20

**Status**: Draft

**Input**: User description: "Presentation links are protected, and an unauthenticated user opening the link in a browser currently sees the raw JSON {"message":"No token provided"}. Instead, show the user the login page and, after successful login, redirect them back to the original presentation URL. API/XHR callers should keep receiving the JSON 401."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Logged-out visitor opens a presentation link (Priority: P1)

A person who is not signed in follows a presentation link (for example from an email or a shared message). Instead of a raw error message, they see the platform's login page. After signing in successfully, they are taken straight to the presentation they originally asked for.

**Why this priority**: This is the core problem. Today the visitor hits a dead end with a technical error and has no way forward.

**Independent Test**: Open a presentation link in a browser with no active session; confirm the login page appears, sign in, and confirm the presentation opens.

**Acceptance Scenarios**:

1. **Given** a visitor with no active session, **When** they open a presentation link in a browser, **Then** they see the login page rather than an error message.
2. **Given** the visitor is on the login page reached from a presentation link, **When** they sign in with valid credentials, **Then** they are redirected to that same presentation link and the presentation is shown.
3. **Given** the visitor is on the login page reached from a presentation link, **When** they enter invalid credentials, **Then** they see the usual login error and remain on the login page, still holding the original destination.

---

### User Story 2 - Programmatic callers keep the current behaviour (Priority: P2)

Application code and other non-browser-navigation requests that call the protected presentation endpoints without a session continue to receive the existing "unauthorized" response, so existing screens and integrations are not broken by the redirect.

**Why this priority**: Prevents regression for the in-app presentation list and any API consumers.

**Independent Test**: Call a protected presentation endpoint from application code without a session; confirm an unauthorized response with the existing message, not a login page.

**Acceptance Scenarios**:

1. **Given** no active session, **When** application code requests a protected presentation resource, **Then** it receives the existing unauthorized response and no redirect.

---

### User Story 3 - Already signed-in visitor (Priority: P3)

A visitor who is already signed in opens a presentation link and sees the presentation directly, with no login step.

**Why this priority**: Confirms the existing happy path is unchanged.

**Independent Test**: Sign in, open a presentation link, confirm it opens immediately.

**Acceptance Scenarios**:

1. **Given** an active session, **When** the visitor opens a presentation link, **Then** the presentation is shown without any login page.

---

### Edge Cases

- A session that has expired is treated the same as no session: the visitor is sent to login and returned to the presentation afterwards.
- The original destination must only ever be an address within this platform; a crafted external address supplied as the destination must be ignored and the visitor sent to the default landing page after login.
- If the presentation no longer exists when the visitor returns after login, they see the existing "not found" outcome rather than an error loop.
- A visitor who opens the login page directly (no original destination) is sent to the default landing page after login, as today.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a visitor without a valid session opens a presentation link in a browser, the system MUST show the login page instead of an error message.
- **FR-002**: The system MUST remember the presentation link the visitor originally requested for the duration of the login process.
- **FR-003**: After successful login, the system MUST send the visitor to the originally requested presentation link.
- **FR-004**: Requests from application code to protected presentation resources without a session MUST continue to return the existing unauthorized response and MUST NOT be redirected.
- **FR-005**: The system MUST only redirect to destinations within the platform and MUST ignore any external destination.
- **FR-006**: Failed login attempts MUST preserve the remembered destination so a later successful attempt still returns the visitor to the presentation.
- **FR-007**: Signed-in visitors MUST continue to open presentations directly, and no presentation content may be exposed to a visitor without a valid session.

### Key Entities

- **Presentation link**: The shareable address of a stored presentation; access requires a signed-in user.
- **Pending destination**: The address a visitor was trying to reach before being asked to sign in; exists only until login completes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of logged-out browser visits to a presentation link show the login page, with no raw error text.
- **SC-002**: After successful login from such a visit, 100% of visitors land on the presentation they requested, with no additional navigation.
- **SC-003**: A visitor can go from opening the link to viewing the presentation in under one minute, given known credentials.
- **SC-004**: Zero presentation content is delivered to visitors without a valid session.
- **SC-005**: Existing in-app presentation screens continue to work with no change in behaviour.

## Assumptions

- The platform already has a login page and session mechanism that will be reused.
- "Browser visit" means a direct page navigation (typing or following a link), as distinguished from requests made by the application's own code.
- Only presentation view links are in scope; other protected links (such as watermarked PDF downloads) may adopt the same behaviour later but are not part of this feature.
- After login the visitor's destination is honoured for any in-platform address, not only presentations, as long as it is internal.
