# Quickstart: validating the Newsletter section

Prereqs: `npm run dev`; at least one sent and one draft article; blueprint contains a `newsletter` entry.

1. **Anonymous API** — `curl localhost:<port>/api/v1/newsletter-articles/public` → items without `preview`/`html`; draft absent; `authorized:false`.
2. **Anonymous detail** — `curl -i …/public/<id>` → 401.
3. **Visitor UI** — logged-out landing page: Newsletter section with blurred cards; View Source / Network show no body text; click → `/contact` Membership Application.
4. **Member UI** — sign in: cards readable with preview; click → `/newsletter/<id>` shows the email in an iframe.
5. **Blueprint** — remove the `newsletter` entry → section disappears; edit title/subtitle → reflected.
6. **Failure** — stop the API: section shows a short message; rest of the page renders.
7. **Phone width** — no horizontal scroll; Tab/Enter activates cards.

See [contracts/newsletter-public.md](contracts/newsletter-public.md).
