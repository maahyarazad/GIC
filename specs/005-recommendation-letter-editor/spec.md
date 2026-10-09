# Feature Specification: Recommendation Letter Editor

**Feature Branch**: `005-recommendation-letter-editor`

**Created**: 2026-10-09

**Status**: Draft

**Builds on**: [001-events-business-letter](../001-events-business-letter/spec.md) (members submit letter requests). The member tab was renamed "Request for letter of recommendation" in PR #28.

**Input**: User description: "Add a new section for admin users to view the recommendation letter requests. On that page, allow the admin to modify the values using a form and text inputs. Refer to the Draft_Template for Letter of Recommendation.docx for the full letter. Every time the admin comes to this tab, the values are prefilled in the input fields. Split the page in half: the incoming requests on the left and the editor on the right. On the left, each record has an action button so the admin can send the letter by email (info@german-industry-club.com). On the right, where the form is, add a button to download the PDF file, which is generated on the server with pdf-lib, and a View button so the admin can view their current work."

## The letter (from `Draft_Template for Letter of Recommendation.docx`)

The page is A4. Its parts, in order:
1. **Recipient address block**: company, street, city, country.
2. **Date**.
3. **Sender block**: German Industry Club, Building C1, Office 1208, Ajman FreeZone, Ajman, UAE, E-Mail: info@german-industry-club.com.
4. **Logo placeholder**, centred.
5. **Subject**: "Letter of Recommendation – [Company Name]".
6. **Reference**: RFQ, Tender, Project.
7. **Salutation**: "Dear Ms/Mr. XXXXXX,".
8. Three numbered sections with fixed wording and placeholders:
   1. *Company Introduction & Business Relationship*: [Company Name], "a Dubai-based company operating in the [industry/business sector] across the MEA region", which specializes in [products/services/solutions].
   2. *German Emirates Club Membership & German Quality Standards*: [Company Name].
   3. *Project Reference & Recommendation*: [Project Name / Business Opportunity] and [Company Name].
9. **Closing**: a closing line, then "Yours sincerely, German Industry Club".
10. **Two signatories**, each with a "Digital Signature" placeholder: Jan A Hussing (Chairman) and Thomas Hochberger (General Manager).
11. **Running header**: "German Industry Club – Building C1, Office 1208, Ajman FreeZone, Ajman, UAE".
12. **Page numbers**: "n / N".

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Admin reviews requests and edits the letter (Priority: P1)

An admin opens Dashboard → **Recommendation Letters**. The left half lists every incoming request, newest first. Each row shows the reference, company, requester, purpose, needed-by date and letter status. Selecting a request opens the editor in the right half, with every field already filled in:
- from the admin's last saved draft for that request, or
- if there is no draft, from the request itself and the template defaults.

The admin changes any value and saves.

**Why this priority**: Every other action (view, download, send) works on the letter this editor produces.

**Independent Test**: With one member request in the database, sign in as admin, open the tab, and select the request. The editor shows the company, address and purpose from the request. Change the salutation and save, leave the tab, and come back: the changed salutation is still there.

**Acceptance Scenarios**:

1. **Given** requests exist, **When** the admin opens the tab, **Then** the left half lists them newest first and the right half says "Select a request" until one is chosen.
2. **Given** a request without a saved draft, **When** the admin selects it, **Then** the fields are prefilled:
   - company name from the requester's company
   - recipient address from the request's addressee address
   - project / opportunity from the request's purpose
   - letter date set to today
   - the fixed template wording for everything else
3. **Given** a request with a saved draft, **When** the admin selects it (including after leaving the tab or reloading), **Then** the fields show the saved draft.
4. **Given** edited fields, **When** the admin clicks *Save*, **Then** the draft is stored and a success snackbar appears. Invalid values (empty company name, invalid date, fields over their length limits) show field errors and nothing is saved.
5. **Given** unsaved edits, **When** the admin selects another request or leaves the tab, **Then** they are asked to confirm discarding the changes.
6. **Given** a non-admin user, **Then** the menu item is hidden and every endpoint of this feature returns 403.

---

### User Story 2 - Admin views and downloads the letter as PDF (Priority: P1)

From the editor, **View** shows the letter as it currently stands, including unsaved edits, as a PDF in a new browser tab (the browser's PDF viewer). **Download PDF** saves the same PDF as `<reference>.pdf`. The server generates the PDF with pdf-lib, and it follows the template's layout.

**Why this priority**: The client asked for both. Download is how the letter reaches the requester outside email.

**Independent Test**: Select a request, change the company name without saving, and click View. The preview shows the changed name in the subject and in all three sections. Click Download: the file `<reference>.pdf` opens in a PDF reader with the same content.

**Acceptance Scenarios**:

1. **Given** the editor's current values, **When** the admin clicks *View*, **Then** a new tab shows the generated PDF within 3 seconds.
2. **Given** the editor's current values, **When** the admin clicks *Download PDF*, **Then** the browser downloads `<reference>.pdf` with the same content as View.
3. **Given** any letter, **Then** the PDF has:
   - the GIC logo
   - the sender block and the running header
   - the recipient block, date, subject, reference and salutation
   - the three numbered sections with the placeholders filled
   - the closing, and both signatories with their titles
   - page numbers "n / N"
   - A4 size and wrapped text that never overflows the margins
4. **Given** invalid field values, **When** View or Download is clicked, **Then** the editor shows the field errors and no PDF is generated.

---

### User Story 3 - Admin emails the letter to the requester (Priority: P2)

Each row in the left list has a **Send** action. It emails the letter PDF, attached, from info@german-industry-club.com to the requester's email address. The row then shows *Sent* with the date. Sending again is allowed (for example after a correction) and is recorded.

**Why this priority**: It completes the workflow. Download covers delivery until it's built.

**Independent Test**: With SMTP recipients pointed at a test inbox, click Send on a request. The inbox receives an email from info@ with `<reference>.pdf` attached, and the row shows *Sent*.

**Acceptance Scenarios**:

1. **Given** a request, **When** the admin clicks *Send* and confirms the dialog (which names the recipient's email), **Then** the email is sent from info@ with the PDF attached, and the request records the sent status, the time, the admin and the send count.
2. **Given** the request open in the editor has unsaved edits, **When** the admin clicks *Send* on that row, **Then** they are asked to save first. The email always carries the saved letter, never unsaved edits.
3. **Given** a request without a saved draft, **When** the admin clicks *Send*, **Then** nothing is sent: the request opens in the editor with the message "Complete and save the letter before sending", because the defaults leave industry and products empty.
4. **Given** the SMTP server fails, **When** the admin sends, **Then** an error snackbar shows the reason, the row shows *Send failed*, and the admin can retry.
5. **Given** a letter that was already sent, **When** the admin sends it again, **Then** the confirm dialog says it was already sent on <date>, and on confirming it is sent again and the send count increases.

### Edge Cases

- A requester's company is empty → the company name field starts empty and must be filled before View, Download, Send or Save.
- Characters outside Latin-1 (for example Arabic names) → the standard PDF fonts can't render them. The editor warns that they will appear as "?" in the PDF (same limitation as feature 001's PDF).
- A request in German (`language: "de"`) → the letter is still English (the only template). The list marks it "DE requested".
- A very long text in a section → the PDF wraps it and adds a second page, with the running header and page numbers on every page.
- Two admins editing the same draft → last save wins. The editor shows "last saved by X at T".
- HTML in any field → plain text in the PDF, and escaped in the email body.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Only the `admin` role MUST see the "Recommendation Letters" dashboard tab and use its endpoints. This is enforced on both the server and the UI.
- **FR-002**: The tab MUST show the requests list on the left half and the letter editor on the right half on large screens. Below the large breakpoint they MUST stack.
- **FR-003**: The editor MUST provide inputs for every variable part of the template: the recipient address lines, letter date, company name, reference line, salutation, company location, industry/sector, products/services, project/opportunity and the closing line. The section wording around these values stays fixed, so a value changed once updates every place it appears.
- **FR-004**: The editor MUST be prefilled every time a request is selected: from the saved draft if one exists, otherwise from the request data and template defaults.
- **FR-005**: The admin MUST be able to save the draft. It persists per request.
- **FR-006**: *View* MUST show a server-generated PDF of the current (possibly unsaved) editor values. *Download PDF* MUST download the same PDF as `<reference>.pdf`.
- **FR-007**: The PDF MUST be generated on the server with pdf-lib and follow the template layout described above.
- **FR-008**: *Send* MUST email the saved letter as a PDF attachment from info@german-industry-club.com to the requester's email address, and record the outcome (sent/failed, time, admin, count, error).
- **FR-009**: All user-supplied values MUST be treated as plain text: drawn as text in the PDF and HTML-escaped in the email.
- **FR-010**: The email template used for sending MUST exist in every environment without a manual seed step (lesson from PR #28).

### Key Entities

- **Letter Request**: the existing `BusinessLetterRequest` (feature 001). It gains an optional `letter` draft and a `delivery` record.
- **Letter Draft**: the editable values of one letter, plus who last saved it and when.
- **Letter Delivery**: the send status, time, admin, count and last error.

## Success Criteria *(mandatory)*

- **SC-001**: An admin can go from opening the tab to downloading a correct letter for a request in under 1 minute, without typing anything that the request already contains.
- **SC-002**: View and Download return the PDF in under 3 seconds.
- **SC-003**: 100% of sends are recorded as sent or failed.
- **SC-004**: The generated PDF matches the template's sections, order and wording, except for the values the admin edited.

## Assumptions

- **Email recipient**: "send the letter via email (info@…)" means sent **from** info@ **to** the requester's email address, with reply-to info@. No leadership CC.
- **Logo**: the template's "LOGO" placeholder and its stray header image (another company's logo, left over from the template's source) are replaced by the GIC logo.
- **Signatures**: the "Digital Signature" placeholders become a blank signature space above each signatory's name and title. Signature images can be configured later; they are out of scope until the client provides them.
- **Signatories**: the names and titles are fixed configuration, not editable per letter.
- **Language**: English only. A German template is out of scope.
- **Letter status**: the member does not see the letter status in their own tab in this feature.
- **The template file**: `Draft_Template for Letter of Recommendation.docx` is a reference for layout and wording. It is not processed at runtime.
