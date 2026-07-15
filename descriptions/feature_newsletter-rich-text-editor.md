# Feature: Rich Text Editor Support for Newsletter

## Description

Introduce a new **Newsletter** section to manage newsletter articles separately from email templates.

### Changes to Email Templates

- Remove the **Send to Subscribers** button from the **Email Templates** section.
- Replace the current `ButtonGroup` with individual action buttons:
  - **Edit**
  - **Delete**
  - **Send Test Email**

### New Newsletter Section

- Create a new **Newsletter** section under the **Blog** section.
- Reuse the same permission/access control logic as the **Email Templates** section.
- Follow the same implementation approach and UI structure used in the **Blog** section.
- Add the following actions for each newsletter article:
  - **Send to Subscribers**
  - **Send Test Email**

### Database Changes

- Create a new database table to store **Newsletter Articles**.
- Add a new column to track the date and time when the newsletter was sent to subscribers.

### Backend

Implement full CRUD operations for newsletter articles:

- Create a newsletter article.
- Retrieve newsletter articles.
- Update a newsletter article.
- Delete a newsletter article.
- Save the sent date when the **Send to Subscribers** action is executed.

### Frontend

Implement a complete UI for managing newsletter articles:

- Display all newsletter articles.
- Allow administrators to preview an article in a modal.
- Allow administrators to create, edit, and delete newsletter articles.
- Allow administrators to send a test email.
- Allow administrators to send the newsletter to all subscribers.
- Display the **Sent Date** for each newsletter article.
