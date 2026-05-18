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


# Feature Ticket 4 — Dashboard UI Consistency & GenericDataGrid Refactor

## Title
Unify Dashboard UI Styling and Migrate Blog Table to GenericDataGrid

## Description
The Dashboard currently has inconsistent UI across sections. The `Blog` section has the most refined styling (fonts, table headers, layout) and should serve as the reference. This ticket covers three sequential tasks: propagating the Blog section's UI to all other Dashboard sections, applying the `TableHeaderRow` style to the `GenericDataGrid` component, and finally replacing the Blog section's own table with `GenericDataGrid`.

## Requirements

### Task 1 — Apply Blog Section Styling Across Dashboard
- Use the same font and styling from the `Blog` section as the design reference
- Apply consistent UI/UX to all other sections in the Dashboard
- Ensure typography, spacing, table appearance, and layout are unified

### Task 2 — Refactor GenericDataGrid with TableHeaderRow Styling
- Reuse the `TableHeaderRow` styling from the Blog table
- Apply it to the `GenericDataGrid` component
- Ensure consistent table appearance and behavior across all uses of `GenericDataGrid`

### Task 3 — Replace Blog Table with GenericDataGrid
- After Tasks 1 and 2 are complete, replace the existing Blog table implementation with the `GenericDataGrid` component
- Preserve all current Blog table functionality (columns, actions, pagination, etc.)

## Acceptance Criteria
- All Dashboard sections share the same font and UI styling as the Blog section
- `GenericDataGrid` uses `TableHeaderRow` styling consistently
- The Blog table is fully replaced by `GenericDataGrid` with no loss of functionality
- No visual regressions in other sections that use `GenericDataGrid`


# Feature Ticket 5 — Dashboard UI Styling Consistency

## Title
Apply Blog Section Styling Consistently Across All Remaining Dashboard Components

## Description
The `Blog` section (referred to as `Blog(1)`) currently has the most refined and consistent styling in the Dashboard — including font family, typography, spacing, and overall layout. This ticket ensures that the same design language is applied uniformly to all remaining Dashboard components that have not yet been updated.

## Requirements

Apply the same font family, typography, spacing, and overall styling from the `Blog(1)` section to each of the following Dashboard components:

- `UserProfilesDataGrid` (`member_profiles`)
- `JsonViewer` (`sitedata`)
- `FileManagement` (`file_management`)
- `EmailTemplatesDataGrid` (`email_management`)
- `Continent` (`sub_region_management`)
- `EconomicInsights` (`country_intelligence`)
- `Events` (`events`)
- `UserProfileForm` (`profile`)
- `LogoutComponent` (`logout`)

### Design Reference
Use the `Blog(1)` section as the single source of truth for:
- Font family and typography scale
- Spacing and padding conventions
- Table/list header and row styling
- Button and action styles
- Layout and alignment patterns

## Acceptance Criteria
- All listed components visually match the `Blog(1)` section in font, typography, spacing, and layout
- No regressions introduced in any updated component's functionality
- Styling changes are consistent and do not use one-off overrides
- Dashboard feels visually unified across all sections


# Feature Ticket 6 — Blog Pages & Protected Blog Viewing

## Title
Implement Blog Posts Page and Blog Details Page with SEO Support and Authorization

## Description
Two new public-facing Blog pages need to be designed and implemented: a `Blog Posts` listing page and a dynamic `Blog Details` page with SEO-friendly URLs. Both pages must be protected and accessible only to authorized users, integrating with the existing `BlogController` and `appState`.

## Requirements

### Task 1 — Blog Posts Page
- Create a dedicated `Blog Posts` page following the existing site design system and color palette
- Display blog posts in a clean, responsive layout consistent with the rest of the application
- Support both light and dark themes
- Fetch blog data from the `BlogController`; add any required additional endpoints for listing, filtering, pagination, or metadata retrieval
- Restrict access to authorized users only

### Task 2 — Blog Details Page
- Create a dynamic Blog Details page with a slug-based route for SEO-friendly URLs
- Full SEO support:
  - Dynamic page title
  - Meta description
  - Open Graph tags
  - Structured metadata where applicable
- Fetch blog data from the `BlogController`; add any required endpoints for fetching by slug and retrieving related comments
- Display the full blog content
- Display all related comments below the blog content
- Responsive and consistent UI/UX with the rest of the platform
- Support both light and dark themes

### Authorization
- Both pages must be protected and accessible only to authorized users
- Validate the authenticated user using `appState`
- Redirect or block unauthorized users from accessing either page

## Acceptance Criteria
- `Blog Posts` page is accessible, responsive, and lists blogs correctly in both themes
- `Blog Details` page renders full content and comments, with a slug in the URL
- All SEO tags (title, description, OG) are dynamic and correctly populated
- Both pages redirect unauthorized users
- All new API endpoints required by the pages are implemented and working
- UI/UX is consistent with the existing site design system
