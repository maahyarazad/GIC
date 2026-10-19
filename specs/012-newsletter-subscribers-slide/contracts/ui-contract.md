# Contract: UI (Newsletter Subscribers slide-out)

No network/API contract changes — this feature adds no endpoints and reuses the existing
`GET /newsletter` call made by `NewsletterSubscribers`. The "contract" here is the UI component
interface for the new reusable panel and the Newsletter integration.

## Component: `SlideOutPanel`

```ts
interface SlideOutPanelProps {
  open: boolean;              // controlled visibility
  onClose: () => void;        // invoked on close control, backdrop click, Esc
  title?: string;             // optional panel heading
  children: React.ReactNode;  // panel body (here: <NewsletterSubscribers />)
  width?: string;             // optional, defaults to a sensible desktop width; full-width on mobile
}
```

Behavior contract:
- When `open` is `true`, the panel is visible and slides in from the right over a backdrop.
- `onClose` fires on: the close (✕) control, a backdrop click, and the `Escape` key.
- While open, background page scroll is locked; on close, focus returns to the element that opened it.
- Rendering is inert (no DOM side effects) when `open` is `false`.

## Integration: Newsletter section

- The Newsletter list header renders a button labeled **"Newsletter Subscribers"** immediately after
  **"New Article"**.
- Clicking it sets `subscribersOpen = true`; the `SlideOutPanel` renders `<NewsletterSubscribers />`
  as its children with `title="Newsletter Subscribers"`.
- Closing sets `subscribersOpen = false`; the newsletter list remains unchanged underneath.

## Dashboard menu (removal)

- `Dashboard.tsx` no longer defines `newsletter_subscribers` in: the `MenuItem` union,
  `accessControl`, `menuTitles`, `isValidMenuItem`, or `componentMap`.
- `isValidMenuItem` returning false for the old key means a stale `?tab=newsletter_subscribers`
  deep link falls back to the role default rather than erroring.
