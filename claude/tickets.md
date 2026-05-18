# Feature Ticket 1 — Fix GitHub Action SSH Authentication

## Title
Fix GitHub Action SSH Connection Requiring Password Authentication

## Description
Fix the existing GitHub Action deployment workflow where the SSH connection still requires password authentication. Add the missing SSH key authentication configuration and ensure all required parts are properly implemented wherever they are missing.

## Requirements
- Configure SSH key-based authentication for the GitHub Action
- Remove dependency on manual password authentication
- Verify deployment pipeline works correctly using GitHub Secrets
- Add any missing SSH configuration steps in the workflow
- Validate remote server authentication and deployment execution
- Ensure secure handling of credentials and secrets

## Acceptance Criteria
- GitHub Action deploys successfully without requiring a password
- SSH authentication uses private/public key pairs
- Deployment workflow completes successfully
- All missing SSH configuration steps are added and documented
- Sensitive credentials are stored using GitHub Secrets


# Feature Ticket 2 — Blog Section Implementation

## Title
Implement Blog Section (Client, CRUD Operations, Types, and Comment Approval System)

## Description
There is currently a placeholder section in the Dashboard:

```jsx
<UnderDevelopment withLockOverlay={false} />
```

Replace this placeholder by implementing the complete Blog feature on both the client side and server side.

## Requirements

### Client Side
Implement the Blog section UI in the Dashboard, including:
- Blog listing page
- Blog details page
- Create blog page
- Edit blog page
- Delete blog functionality

### Backend / Controller
Implement full CRUD operations for blogs:
- Create blog
- Read blog(s)
- Update blog
- Delete blog

### Types / Models
Add the required types/models for:
- Blog
- Comment

### Permissions
- Users, including admins, can create blogs
- Anyone can create and modify comments
- All comments must be approved by an admin before becoming publicly visible

### Comment Approval System
Implement an admin moderation section where admins can:
- View incoming comments
- Approve comments
- Reject comments
- Manage comment visibility/status

## Additional Requirements
- Add proper API routes and validations
- Implement approval status handling
- Ensure role-based authorization is applied where required

## Acceptance Criteria
- Blog section is fully functional in the Dashboard
- Users can create, edit, and delete blogs
- Comments can be created and modified
- Admins can approve or reject comments
- Only approved comments are publicly visible
- Required types/models are implemented
- CRUD APIs are working correctly


# Feature Ticket 3 — Authentication Pages Redesign

## Title
UI Enhancement – Redesign Authentication Pages to Match Landing Page Design Language

## Description
The current authentication pages (`Login`, `ForgetPassword`, and `ResetPassword`) are visually inconsistent with the rest of the application. Their styling, spacing, layout, and overall UI experience do not align with the design language used in the landing page (`Home` component).

This enhancement aims to redesign and unify these authentication pages so they match the modern styling and UI patterns of the landing page while maintaining responsiveness and accessibility standards. All authentication-related pages must fully support both Light Mode and Dark Mode themes.

## Requirements

### Pages to Update
- `Login`
- `ForgetPassword`
- `ResetPassword`

### Design Alignment with `Home` Component
- Typography
- Color palette
- Button styles
- Card/container styling
- Input fields
- Shadows and border radius
- Spacing and layout consistency
- Animations/transitions (if applicable)

### Light/Dark Theme Support
- Ensure all text remains readable in both themes
- Support theme-aware backgrounds and surfaces
- Ensure buttons, inputs, alerts, and links adapt correctly
- Avoid hardcoded colors where possible

### Responsiveness
- Desktop
- Tablet
- Mobile devices

### Accessibility
- Proper contrast ratios
- Focus states
- Keyboard navigation compatibility

## Acceptance Criteria
- Authentication pages visually match the style of the landing page (`Home` component)
- Light and Dark themes are fully supported without UI inconsistencies
- All pages are responsive on major screen sizes
- No broken layouts, overflow issues, or unreadable text in either theme
- Existing authentication functionality remains unchanged
