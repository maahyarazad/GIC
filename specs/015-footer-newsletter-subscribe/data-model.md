# Data Model: Footer Newsletter Subscription and Admin-Added Subscribers

No stored fields change.

**NewsletterSubscriber** (existing): `email` (unique, lowercase), `active`, `createdAt`, `updatedAt`.

**SubscriberType** (derived, API only): `"internal" | "external"` on each item of the list response. `internal` when `users.email` equals the subscriber email, else `external`.

**BulkAddRequest**: `{ emails: string[] }` (1–200 entries).
**BulkAddResult**: `{ added: number, reactivated: number, duplicates: number, invalid: string[] }`.
