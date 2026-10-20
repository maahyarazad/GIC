# Data Model: Landing Page Newsletter Section

No schema change. Reads `NewsletterArticle` (`title`, `subject`, `html`, `sentAt`).

**NewsletterTeaser** (API view): `{ id: string, title: string, sentAt: string, preview?: string }` — `preview` only for authorized callers; never `html`.

**Blueprint `newsletter` entry** (`siteData.newsletter`, optional): `{ eyebrow?: string, title?: string, subtitle?: string, limit?: number (1–24, default 6), ctaLabel?: string }`.
