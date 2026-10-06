# GIC

## Optional environment variables

| Variable | Default | Purpose |
|---|---|---|
| `BUSINESS_LETTER_RECIPIENTS` | The four GIC leadership addresses (see `src/config/businessLetterConfig.ts`) | Comma-separated recipients of "Request a Business Letter" notifications. Set it to a test inbox in development; leave it unset in production. |
| `BUSINESS_LETTER_EMAIL_TEMPLATE_ID` | `6ac4970fe31c56f3436780a0` | `_id` of the `emailtemplates` record used for those notifications. Point it at a local copy when developing against the local database; leave it unset in production. |
