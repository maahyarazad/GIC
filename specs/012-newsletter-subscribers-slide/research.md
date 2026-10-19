# Phase 0 Research: Newsletter Subscribers slide-out panel

Decisions resolving the Technical Context. Format: **Decision / Rationale / Alternatives considered**.

## 1. Slide-out panel implementation

- **Decision (updated)**: Reuse the existing app-wide **`SlideMenuProvider` / `SlideMenu`** (`@/Providers/SlideMenuProvider`, backed by `Components/Generic/SlideMenu/SlideMenu`) — the exact slide-out `EmailTemplate.tsx` uses — via `useSlideMenu().openMenu(content, title, onClose?)`. No new component.
- **Rationale**: The project already has a purpose-built slide-out used for the Email Templates form; it handles Esc + backdrop close, `role="dialog"`/`aria-modal`, 80%-width desktop / full-width mobile, and is already mounted in `RootProviders.jsx` and `entry-server.jsx`. Reusing it matches the Email Templates pattern exactly (explicit user request) and avoids a redundant component.
- **Note**: An earlier draft built a bespoke `SlideOutPanel`; it was removed in favor of the existing `SlideMenu`.
- **Alternatives considered**: (a) bespoke `SlideOutPanel` — redundant with `SlideMenu`; removed; (b) Bootstrap Offcanvas — needs Bootstrap JS, awkward under SSR; (c) the centered `ModalContext` dialog — not a slide-out.

## 2. Rendering the grid inside the panel

- **Decision**: Render the existing `<NewsletterSubscribers />` component unchanged as the panel's content.
- **Rationale**: It is already self-contained — it manages its own fetch (`GET /newsletter`), paging, sorting, filtering, and even renders the heading "Newsletter Subscribers". Reuse guarantees identical behavior and satisfies the rename for free.
- **Alternatives considered**: Extracting the grid into a prop-driven child — unnecessary; the component already works standalone.

## 3. Removing the Dashboard menu item without breaking routing

- **Decision**: Remove `newsletter_subscribers` from every place in `Dashboard.tsx`: the `MenuItem` union, `accessControl`, `menuTitles`, the `isValidMenuItem` array, and `componentMap`; move the `NewsletterSubscribers` import to `Newsletter.tsx`. The existing default-tab/`isValidMenuItem` logic already falls back when a tab key is invalid, so an old deep link resolves safely.
- **Rationale**: `Dashboard.tsx` drives the menu from these maps; a leftover key in any one of them would either re-show the item or cause a type error. `isValidMenuItem` + `getDefaultTab` already guard unknown tabs.
- **Alternatives considered**: Keeping the key but hiding it via `accessControl: []` — leaves dead code and a reachable-by-URL tab; rejected.

## 4. Button placement and labeling

- **Decision**: Add a `<button className="dashboard-btn">` labeled "Newsletter Subscribers" immediately after the "New Article" button in the Newsletter list header (`newsletter-header`), toggling panel state. Use a suitable `react-icons` glyph for consistency with `FaPlus` on New Article.
- **Rationale**: The header already hosts the primary action button; placing the new one beside it matches the request ("next to the New Article button") and the existing layout.
- **Alternatives considered**: A separate toolbar row — unnecessary; the header has room.

## 5. Styling without sass

- **Decision**: Ship `SlideOutPanel.css` as plain compiled CSS and import it directly, consistent with how dashboard components import `./X.css`. Reuse `dashboard-btn` for the trigger. Optionally keep a `.scss` source, but the imported file is `.css`.
- **Rationale**: The repo has no `sass` dependency; components import pre-compiled `.css`. Importing `.scss` would break the Vite build.
- **Alternatives considered**: Adding `sass` — out of scope for a small UI change.

## Open questions

- None blocking. Icon choice and exact panel width are cosmetic and decided during implementation to match the dashboard.
