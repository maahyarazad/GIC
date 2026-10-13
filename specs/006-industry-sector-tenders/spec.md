# Feature Specification: Industry Sector Selection & Tender Board

**Feature Branch**: `006-industry-sector-tenders`

**Created**: 2026-10-12

**Status**: Draft

**Input**: User description: "New members must select three industry sectors when signing up or registering. These industry sectors are then permanently assigned to the member. The available sectors are: Energy, Oil & Gas, and Sustainability; Aerospace, Aviation, Industrial Manufacturing, and Automation; Construction and Infrastructure; Digital Technology and AI, Information Technology (IT), and Telecommunications; Chemicals and Petrochemicals; Pharmaceuticals and Life Sciences, Medical Technology, and Healthcare; Logistics and Supply Chain, and Transportation; Food and Beverage; Tourism and Hospitality; Retail and E-Commerce. The selected industries are listed under the 'Tender' tab. Some existing members have already registered but have not yet selected their industries. For these users, add a switch/conditional in the UI that directs them to a wizard where they can select their industries. On both the registration page and the Tender page, members must be notified that this selection is irreversible. Creating a tender: a member first selects one of their three categories, then completes a form with who is publishing, what is being announced, when it was published, and the submission deadline. The member can then upload, submit, or share the content. The information is visible only to other members who selected the same category. Other members in that category are notified by email that new tender information is available. Under each tender, the creator's contact email is shown with the note 'Please contact me for any further details.'"

## Clarifications

### Session 2026-10-12

- Q: Who is allowed to create a new tender? → A: Any user with access to the Tender tab (member, procurement, or admin role) may create a tender.
- Q: What happens to a tender once its submission deadline passes? → A: It automatically shows a "Closed" status and remains listed indefinitely; an admin may also close a tender manually before its deadline.
- Q: Does "upload, submit, or share" imply file attachments? → A: Members may optionally attach one file to a tender in addition to the required text fields.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select industry sectors at registration (Priority: P1)

A new member signing up must choose exactly three industry sectors from a fixed list before their registration is complete. Once chosen, these sectors are permanently attached to their profile and cannot be changed later.

**Why this priority**: Without a sector assignment, a member cannot see or participate in the Tender board at all — this is the foundational gate for the rest of the feature.

**Independent Test**: Can be fully tested by registering a new account, selecting three sectors, confirming the irreversibility notice, and verifying the account is created with exactly those three sectors recorded.

**Acceptance Scenarios**:

1. **Given** a new member is on the registration flow, **When** they reach the industry-sector step, **Then** they see all ten sectors as selectable options and a clear notice that the choice is permanent and cannot be changed later.
2. **Given** a new member has selected fewer than three or more than three sectors, **When** they attempt to continue, **Then** the system blocks progress and explains exactly three sectors must be selected.
3. **Given** a new member has selected exactly three sectors, **When** they confirm the selection, **Then** registration completes and the three sectors are permanently saved to their profile.
4. **Given** a member has completed registration with sectors assigned, **When** they or anyone else attempts to change those sectors afterward, **Then** no UI path to edit the selection is available anywhere in the product.

---

### User Story 2 - Prompt existing members without sectors to complete the wizard (Priority: P1)

A member who registered before this feature existed (or otherwise has no sectors on file) is routed to a dedicated selection wizard the next time they need sector-gated functionality, so they are not permanently locked out of the Tender board.

**Why this priority**: Without this, existing members would never be able to access or participate in the Tender board, defeating the purpose of launching the feature for the existing member base.

**Independent Test**: Can be fully tested by taking an existing account with no sectors on file, opening the Tender tab, confirming the wizard appears instead of the tender list, completing it, and confirming subsequent visits show the normal Tender tab.

**Acceptance Scenarios**:

1. **Given** an existing member has no industry sectors on file, **When** they open the Tender tab, **Then** they are shown a selection wizard instead of the tender list, with the same irreversibility notice as registration.
2. **Given** an existing member completes the wizard and selects exactly three sectors, **When** they confirm, **Then** the sectors are permanently saved and they are taken directly into the normal Tender tab view.
3. **Given** a member already has three sectors on file, **When** they open the Tender tab, **Then** the wizard is never shown again and they go straight to the tender list.

---

### User Story 3 - Create a tender for one of my sectors (Priority: P1)

A member with assigned sectors publishes a new tender under one of their three sectors, providing who is publishing it, what is being announced, the publish date, and the submission deadline, with an optional file attachment.

**Why this priority**: Tender creation is the core value-producing action of the feature — without it there is nothing for other members to see or be notified about.

**Independent Test**: Can be fully tested by a member with sectors assigned creating a tender under one of their sectors and confirming it appears in that sector's tender list with all entered details and the creator's contact email.

**Acceptance Scenarios**:

1. **Given** a member with three assigned sectors opens "Create Tender," **When** the form loads, **Then** they must first pick exactly one of their own three sectors before the rest of the form is enabled.
2. **Given** a member has picked a sector, **When** they fill in publisher, announcement description, publish date, and deadline and optionally attach one file, **Then** they can submit the tender and it is published immediately under that sector.
3. **Given** a member attempts to submit the tender form, **When** any of the four required fields (publisher, announcement, publish date, deadline) is missing, **Then** submission is blocked with a clear validation message.
4. **Given** a tender has been published, **When** any member views it, **Then** the creator's email address is shown along with the note "Please contact me for any further details."

---

### User Story 4 - View tenders restricted to my own sectors (Priority: P2)

A member sees only the tenders published under the sectors assigned to them, keeping each sector's content private to that sector's members, procurement staff, and admins.

**Why this priority**: Sector-based visibility is what makes the board useful and trustworthy — without it, the "notify only matching members" promise and the business value of sector segmentation break down. It builds directly on Story 3's data.

**Independent Test**: Can be fully tested by publishing tenders under two different sectors and confirming a member assigned to only one of those sectors sees only the matching tenders.

**Acceptance Scenarios**:

1. **Given** tenders exist under sectors A and B, **When** a member whose assigned sectors include A but not B opens the Tender tab, **Then** they see tenders from sector A and any other of their own sectors, but never from sector B.
2. **Given** a member is assigned to three sectors, **When** they open the Tender tab, **Then** tenders from all three of their sectors are visible, grouped or filterable by sector.
3. **Given** a tender's deadline has passed, **When** a member views the sector's tender list, **Then** that tender is still listed but clearly marked "Closed."

---

### User Story 5 - Get notified by email when a new tender matches my sector (Priority: P2)

A member receives an email notification whenever a new tender is published under a sector assigned to them, prompting them to check the Tender tab.

**Why this priority**: Notifications drive re-engagement with newly published tenders; without them, members would have to check the board manually and might miss time-sensitive opportunities. Depends on Stories 3 and 4 existing first.

**Independent Test**: Can be fully tested by publishing a tender under a sector and confirming every member assigned to that sector (and only those members) receives an email referencing the new tender and directing them to the Tender tab.

**Acceptance Scenarios**:

1. **Given** a tender is published under sector A, **When** the publish completes, **Then** every member assigned to sector A (other than the creator) receives an email notification pointing them to the Tender tab.
2. **Given** a member is not assigned to sector A, **When** a tender is published under sector A, **Then** that member receives no notification for it.
3. **Given** the tender creator is themselves assigned to the sector they published under, **When** the notification is sent, **Then** the creator does not receive a notification about their own tender.

---

### User Story 6 - Admin closes a tender early (Priority: P3)

An admin can manually mark an open tender as "Closed" before its deadline, for cases such as the opportunity being withdrawn or filled early.

**Why this priority**: This is a moderation convenience on top of the automatic deadline-based closing already covered by Story 3/4; useful but not required for the feature's core value.

**Independent Test**: Can be fully tested by an admin opening an active tender and closing it manually, then confirming it shows "Closed" to all viewing members immediately.

**Acceptance Scenarios**:

1. **Given** an open tender exists, **When** an admin chooses to close it, **Then** its status immediately changes to "Closed" for all members viewing that sector.
2. **Given** a tender is already "Closed" (whether by deadline or by admin action), **When** an admin views it, **Then** no option to reopen it is presented (closing is one-directional).

### Edge Cases

- What happens if a member tries to reach the industry-sector wizard a second time after already completing it (e.g., by navigating directly to the wizard URL)? The system must redirect them to the normal Tender tab instead of allowing re-selection.
- What happens if a member's three sectors somehow become unset or corrupted after assignment? Out of scope — the system treats sector assignment as fixed point-in-time data once written and does not provide a repair/reset workflow in this feature.
- What happens if a member picks a sector for a new tender that they are not actually assigned to (e.g., via a tampered request)? The system must reject the submission since only the creator's own three sectors are valid choices for that creator.
- What happens when a tender's optional file attachment is omitted? The tender publishes normally with only the four required text fields and no attachment shown.
- What happens if two members in the same sector both have very similar tenders? No deduplication is required; each tender is independent.
- What happens to notification delivery if a member's email is invalid or bounces? Notification sending is best-effort per recipient; a failure for one recipient must not block tender publication or notifications to other recipients.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST offer exactly ten fixed industry sectors for selection: Energy, Oil & Gas, and Sustainability; Aerospace, Aviation, Industrial Manufacturing, and Automation; Construction and Infrastructure; Digital Technology and AI, Information Technology (IT), and Telecommunications; Chemicals and Petrochemicals; Pharmaceuticals and Life Sciences, Medical Technology, and Healthcare; Logistics and Supply Chain, and Transportation; Food and Beverage; Tourism and Hospitality; Retail and E-Commerce.
- **FR-002**: During registration, the system MUST require a new member to select exactly three of the ten sectors before registration can be completed.
- **FR-003**: The system MUST display an explicit notice on the registration sector-selection step stating the choice is permanent and cannot be changed later.
- **FR-004**: Once a member's three sectors are saved, the system MUST permanently prevent any change to that member's sector assignment through any UI or workflow.
- **FR-005**: For a member with no sectors on file, the system MUST present a sector-selection wizard when that member opens the Tender tab, in place of the normal tender list.
- **FR-006**: The sector-selection wizard MUST enforce the same exactly-three-sectors rule and the same permanence notice as the registration step.
- **FR-007**: Once a member completes the wizard (or registration) with three sectors saved, the system MUST never present the wizard to that member again.
- **FR-008**: The system MUST display the member's own assigned sectors under the Tender tab.
- **FR-009**: The system MUST allow any user with Tender tab access (member, procurement, or admin role) to create a new tender.
- **FR-010**: Before completing the rest of the tender form, the system MUST require the creator to select exactly one sector from their own assigned sectors (or, for procurement/admin users without assigned sectors, any of the ten sectors).
- **FR-011**: The tender creation form MUST collect: who is publishing the tender, what is being publicly announced, the date the tender was published, and the submission deadline — all four required.
- **FR-012**: The tender creation form MUST allow an optional single file attachment.
- **FR-013**: The system MUST block tender submission and show a validation message when any of the four required fields is missing.
- **FR-014**: Upon successful submission, the system MUST publish the tender immediately under the selected sector.
- **FR-015**: The system MUST restrict visibility of a tender to only the members, procurement users, and admins who are assigned to (or, for procurement/admin, viewing) that same sector.
- **FR-016**: The system MUST display, on every tender, the creator's email address and the fixed note "Please contact me for any further details."
- **FR-017**: Upon publishing a new tender, the system MUST send an email notification to every other member assigned to that tender's sector, directing them to view it in their Tender tab.
- **FR-018**: The system MUST NOT send a tender-published notification to the tender's own creator.
- **FR-019**: The system MUST automatically mark a tender as "Closed" once its submission deadline passes, while keeping it visible in the sector's tender list indefinitely.
- **FR-020**: The system MUST allow an admin to manually mark an open tender as "Closed" before its deadline.
- **FR-021**: Once a tender is "Closed" (by deadline or admin action), the system MUST NOT allow it to be reopened.
- **FR-022**: The system MUST display the same irreversibility notice about sector selection on the Tender tab as is shown during registration/wizard, so members are reminded even after the fact.
- **FR-023**: The system MUST reject a tender submission where the selected sector is not one of the creator's own assigned sectors (not applicable to procurement/admin users creating under any sector).

### Key Entities

- **Member Sector Assignment**: The permanent set of exactly three industry sectors tied to a member's profile; written once (at registration or via the one-time wizard) and never editable afterward.
- **Industry Sector**: One of the ten fixed, predefined categories used both for member assignment and tender categorization.
- **Tender**: A published announcement tied to exactly one industry sector, with publisher name, announcement description, publish date, submission deadline, status (Open/Closed), an optional file attachment, the creator's identity/email, and a creation timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new member registrations that complete sign-up have exactly three industry sectors recorded, with zero paths to register without a sector selection.
- **SC-002**: Every existing member without sectors on file is shown the selection wizard on their very next visit to the Tender tab, with zero members able to bypass it to reach the tender list directly.
- **SC-003**: A member can publish a complete, valid tender in under 2 minutes from opening the creation form.
- **SC-004**: Members never see a tender published under a sector they are not assigned to — verified by zero cross-sector visibility leaks across all test scenarios.
- **SC-005**: At least 95% of sector-matching members receive their new-tender email notification within 5 minutes of publication, excluding individual delivery failures outside system control.
- **SC-006**: Zero instances, across all test scenarios, of a member's sector assignment changing after its initial permanent save.

## Assumptions

- "Members" in this spec refers to users with the `user` role; `procurement` and `admin` roles also have Tender tab access per existing dashboard access control and may create and view tenders, but are not subject to the three-sector permanence rule unless they choose to register as a regular member as well.
- The existing Dashboard "Tenders" tab placeholder (currently rendering an "Under Development" component) is the integration point for this feature; its access-control roles (`user`, `admin`, `procurement`) remain unchanged.
- Sector-based email notifications reuse the existing transactional email service already used elsewhere in the product, rather than introducing a new notification mechanism.
- The optional file attachment on a tender uses the same general upload handling/storage approach already established elsewhere in the product for member-submitted files, with standard size/type limits consistent with existing uploads.
- There is no requirement in this feature for members to edit or delete a tender they created after publication; only admins can close a tender early, and the automatic deadline-based closing is the only other status change.
- No bulk/CSV sector migration tool is required for existing members; each existing member completes the wizard individually on their own next visit.
