# Phase 1 Data Model: Newsletter Subscribers slide-out panel

## Entities

**None.** This feature adds no entities and changes no schema. It is a presentation/navigation
change that relocates an existing grid.

## Reused data (unchanged)

- **Newsletter Subscriber** (existing): rendered by the existing `NewsletterSubscribers` component,
  which fetches from the existing `GET /newsletter` endpoint. Columns (ID, Active, email, Created
  At, Updated At), paging, sorting, and filtering are unchanged. No fields added, removed, or
  renamed at the data level.

## Component state (ephemeral, UI only)

| Owner          | State            | Type      | Purpose |
|----------------|------------------|-----------|---------|
| `Newsletter`   | `subscribersOpen`| boolean   | Whether the slide-out panel is open. |
| `SlideOutPanel`| (controlled)     | props     | `open: boolean`, `onClose: () => void`, `title?: string`, `children`. |

No persistence, no derived server data. State resets on unmount; nothing is stored.
