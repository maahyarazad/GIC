# UI Enhancement Ticket – Authentication Pages Redesign

## Description
The current authentication pages (`Login`, `ForgetPassword`, and `ResetPassword`) are visually inconsistent with the rest of the application components and pages. Their styling, spacing, layout, and overall UI experience do not align with the design language used in the landing page (`Home` component).

This enhancement aims to redesign and unify these authentication pages so they match the modern styling and UI patterns of the landing page while maintaining responsiveness and accessibility standards.

Additionally, all authentication-related pages must fully support both **Light Mode** and **Dark Mode** themes.

---

## Scope of Work
- Update the UI/UX styling for:
  - `Login`
  - `ForgetPassword`
  - `ResetPassword`

- Align the design with the `Home` component:
  - Typography
  - Color palette
  - Button styles
  - Card/container styling
  - Input fields
  - Shadows and border radius
  - Spacing and layout consistency
  - Animations/transitions (if applicable)

- Implement proper Light/Dark theme compatibility:
  - Ensure all text remains readable
  - Support theme-aware backgrounds and surfaces
  - Ensure buttons, inputs, alerts, and links adapt correctly
  - Avoid hardcoded colors where possible

- Ensure responsive behavior across:
  - Desktop
  - Tablet
  - Mobile devices

- Verify accessibility and usability:
  - Proper contrast ratios
  - Focus states
  - Keyboard navigation compatibility

---

## Acceptance Criteria
- Authentication pages visually match the style of the landing page (`Home` component).
- Light and Dark themes are fully supported without UI inconsistencies.
- All pages are responsive on major screen sizes.
- No broken layouts, overflow issues, or unreadable text in either theme.
- Existing authentication functionality remains unchanged.