# Feature Specification: Dashboard Upload & Save Improvements

**Feature Branch**: `018-dashboard-upload-save-tweaks`

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: "users should not able to upload presentation - remove that section from users dashboard view - in the Newsletter management section in dashboard add another button when modifying a newsletter and name it save and save and close so what save does is that presists the changes in database and the other button save and close the editor - in the file management section add multiple file upload feature and also add onProgress callback from server and reflect the upload progress to UI with an overlay"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Members can no longer upload presentations (Priority: P1)

A member (role "user") signs in to the dashboard. The "Manage Presentations" section is no longer in their menu, and they cannot reach it any other way. Admins and procurement staff keep the section and can still upload presentations. Members can still view and download the presentations attached to events from the Events section.

**Why this priority**: This is an access-control change. Members can currently publish content they should not be able to publish, so closing that gap matters most.

**Independent Test**: Sign in as a member and confirm the section is missing from the menu and cannot be opened by a direct link or a saved tab. Then try an upload request as a member and confirm it is refused. Sign in as an admin and confirm uploads still work.

**Acceptance Scenarios**:

1. **Given** a signed-in member, **When** they open the dashboard, **Then** the "Manage Presentations" menu entry is not shown.
2. **Given** a signed-in member, **When** they open the dashboard with a link or remembered tab that points at Manage Presentations, **Then** they land on their default section instead.
3. **Given** a signed-in member, **When** a presentation upload is submitted on their behalf by any means, **Then** the system refuses it and stores nothing.
4. **Given** a signed-in admin or procurement user, **When** they open Manage Presentations and upload a file, **Then** the upload works as it does today.
5. **Given** a signed-in member, **When** they open an event that has presentations in the Events section, **Then** they can still view those presentations.

---

### User Story 2 - Save a newsletter without leaving the editor (Priority: P2)

An admin or procurement user is editing a newsletter article. Next to Cancel there are two buttons. **Save** stores the current title, subject and content and keeps the editor open, so they can keep working. **Save and Close** stores the same changes and returns to the newsletter list.

**Why this priority**: This is a productivity improvement for content editors. Today, saving always closes the editor, so long edits get interrupted or go unsaved for long stretches.

**Independent Test**: Open an existing article, change it, press Save, and confirm the editor stays open with the changes. Reload the list and confirm the changes were stored. Then press Save and Close and confirm the list view appears with the updated article.

**Acceptance Scenarios**:

1. **Given** an article open in the editor with unsaved changes, **When** the user presses Save, **Then** the changes are stored, a success message appears, and the editor stays open with the same content.
2. **Given** an article open in the editor, **When** the user presses Save and Close, **Then** the changes are stored, a success message appears, and the newsletter list is shown with the updated article.
3. **Given** a new, never-saved article, **When** the user presses Save, **Then** the article is created and the editor stays open, and any later Save updates that same article instead of creating a duplicate.
4. **Given** the title, subject or content is missing, **When** the user presses either button, **Then** nothing is stored, the editor stays open, and a validation message explains what is missing.
5. **Given** a save is in progress, **When** the user looks at the buttons, **Then** both are disabled and show that saving is under way, so the save cannot be submitted twice.
6. **Given** saving fails, **When** the user presses either button, **Then** an error message appears and the editor stays open with their changes intact, including after Save and Close.

---

### User Story 3 - Upload several files at once with visible progress (Priority: P3)

An admin or procurement user in File Management selects several files in one go. While they upload, an overlay covers the File Management area and shows how far each file and the batch as a whole have progressed. When the batch finishes, the overlay closes, the file list refreshes to show the new files, and a summary says how many uploads succeeded and which, if any, failed.

**Why this priority**: Uploading files one at a time with no feedback is slow and leaves users unsure whether anything is happening. This removes that friction, but it does not unblock any workflow that is impossible today.

**Independent Test**: Select several files of different sizes, including one large file. Confirm the overlay appears with progress that moves steadily for each file and for the batch, and that all the files show up in the list when it finishes.

**Acceptance Scenarios**:

1. **Given** the File Management section, **When** the user opens the upload picker, **Then** they can select more than one file at once.
2. **Given** files are uploading, **When** the server reports progress, **Then** the overlay shows each file's name, its percentage, and the overall batch percentage, and these update as the upload advances.
3. **Given** files are uploading, **When** the overlay is shown, **Then** the user cannot start another upload or change the file list until the batch finishes.
4. **Given** one file in a batch fails, **When** the batch finishes, **Then** the other files are still uploaded, the failed file is marked with a reason, and the summary reports both counts.
5. **Given** all files have uploaded, **When** the batch finishes, **Then** the overlay closes and the newly uploaded files appear in the list without a manual refresh.
6. **Given** the user selects a single file, **When** it uploads, **Then** the same overlay and progress behaviour applies.

---

### Edge Cases

- A member already has the Manage Presentations tab open when this change is released. On their next navigation or reload, they are moved to their default section, and any upload they try is refused.
- The user presses Save twice quickly. Only one save runs, because the buttons are disabled while it is in progress.
- The user switches between the HTML and Studio editors after pressing Save. The saved article is the one that keeps being updated.
- The Studio editor's own save shortcut keeps its current behaviour: it saves and stays in the editor, the same as Save.
- The user selects zero files or cancels the picker. Nothing happens and no overlay appears.
- A file in the batch breaks the existing per-file rules, such as type or size. It is reported as failed and the rest of the batch continues.
- The network drops mid-batch. Files not yet completed are marked as failed, the overlay closes, and the summary shows which files did not upload.
- The user tries to leave the section or close the tab during an upload. The browser warns that the upload will be interrupted.

## Requirements *(mandatory)*

### Functional Requirements

**Presentations access**

- **FR-001**: The dashboard MUST NOT show the "Manage Presentations" section to users with the member ("user") role.
- **FR-002**: The dashboard MUST redirect members who reach Manage Presentations by direct link, query parameter or remembered tab to their default section.
- **FR-003**: The system MUST refuse presentation uploads, edits and deletions from members, even when the request bypasses the dashboard UI.
- **FR-004**: Admin and procurement users MUST keep their current access to Manage Presentations.
- **FR-005**: Members MUST still be able to view the presentations attached to events in the Events section.

**Newsletter Save / Save and Close**

- **FR-006**: The newsletter editor MUST offer two save actions, "Save" and "Save and Close", in addition to "Cancel", for both new and existing articles.
- **FR-007**: "Save" MUST store the article's title, subject and content and keep the editor open with the saved content.
- **FR-008**: "Save and Close" MUST store the article's title, subject and content and then return to the newsletter list.
- **FR-009**: After the first "Save" of a new article, any later save in the same editing session MUST update that article rather than create a new one.
- **FR-010**: Both save actions MUST apply the existing validation (title, subject and content are required) and keep the editor open when validation fails.
- **FR-011**: Both save actions MUST be disabled while a save is in progress and MUST show a saving indicator.
- **FR-012**: If a save fails, the editor MUST stay open with the user's changes intact and show an error message, whichever button was pressed.

**File Management multi-upload with progress**

- **FR-013**: File Management MUST let the user select and upload multiple files in a single action.
- **FR-014**: During an upload, the system MUST show an overlay over the File Management area that blocks further upload actions until the batch finishes.
- **FR-015**: The overlay MUST show, for each file, its name, its upload percentage and its final status (uploaded or failed with a reason), plus the overall batch percentage.
- **FR-016**: The server MUST report upload progress as it receives each file, and the overlay MUST update from those reports.
- **FR-017**: A failure on one file MUST NOT stop the other files in the batch from uploading.
- **FR-018**: When the batch finishes, the system MUST close the overlay, refresh the file list, and show a summary of how many files succeeded and failed.
- **FR-019**: The existing per-file upload rules (allowed types, maximum size, who may upload) MUST apply to every file in a batch.
- **FR-020**: The browser MUST warn the user before they leave the page while a batch is still uploading.

### Key Entities

- **Presentation**: A file attached to an event. After this change, only admin and procurement users can create, change or delete one. Members can only view it.
- **Newsletter Article**: Has a title, subject, HTML content and published flag. It gets saved repeatedly within one editing session.
- **Upload Batch**: The set of files a user selects in one File Management upload action. Its progress is the combined progress of its files, and it is finished when every file has succeeded or failed.
- **Uploaded File**: An existing File Management record. Each file in a batch produces one record when it succeeds.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0% of presentation upload attempts by members succeed, whether made through the UI or directly against the system.
- **SC-002**: Members see no presentation upload entry point anywhere in the dashboard, and admin and procurement upload success is unchanged from before the release.
- **SC-003**: An editor can save a newsletter article 5 or more times in one session without leaving the editor and without creating duplicate articles.
- **SC-004**: A user can upload 10 files in a single action, without reselecting files or reopening the picker.
- **SC-005**: During uploads, the visible progress updates at least once per second for each in-flight file, and never sits unchanged for more than 3 seconds while data is still being sent.
- **SC-006**: After a batch finishes, 100% of the files that uploaded successfully appear in the file list without a manual page refresh.

## Assumptions

- "Users" in the request means the member role ("user"). Admin and procurement roles keep presentation upload rights.
- Members keep read-only access to event presentations through the Events section. Only the management and upload section is removed.
- "Save and Close" replaces the current single "Save Changes" / "Create Article" button, and "Cancel" stays as it is (it leaves without saving).
- The two-button behaviour applies to new articles as well as existing ones, so the editor works the same way in both cases.
- Server-reported progress means the percentage of each file the server has received. Post-processing time after the full file has arrived is not tracked separately.
- File Management keeps its current access rule (admin and procurement only) and its current per-file type and size limits. There is no new cap on files per batch beyond what those limits imply.
- Files in a batch may be uploaded one after another or in parallel. The user-visible requirements are the same either way.
- Cancelling an in-progress batch is out of scope for this feature.
