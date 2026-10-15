# Quickstart & Validation: Recommendation Letter — member view, receipt email & approve/send

Validation only (no test runner). **Do not trigger real emails against the live SMTP/DB without the
user's go-ahead** — the user runs live submission tests. A backend restart is required after model /
text / PDF / config / route / email-template changes.

## Build gates

```bash
# backend typecheck
cd /Users/germanworldclub/Desktop/GIC && npx tsc --noEmit -p .

# regenerate tsoa artifacts after adding the approve + member endpoints
npm run tsoa:routes && npm run tsoa:spec

# UI typecheck (baseline ≈ 71 lines of pre-existing noise; expect no NEW errors)
cd ui && npx tsc --noEmit -p .

# UI build (the real gate)
cd ui && npm run build:client
```

Mirror every `.scss` change into the matching `.css` by hand (no sass build step; never `npx sass`).

## Manual checklist

### US1 — Member DRAFT view
1. Sign in as a **member** who has a letter request; open the Recommendation Letter view.
2. Confirm the layout matches the admin editor + live preview (editor left, preview right).
3. Edit a field and click away → the preview refreshes; the preview PDF shows a **large diagonal
   "DRAFT"** watermark at ~20% opacity and **no signatures**.
4. Confirm there is **no Send and no Approve** control anywhere in the member view.
5. Save the draft → it persists and reloads unchanged. (Server also rejects any direct send/approve.)

### US2 — Emails
6. With the user's approval, submit a business-letter request as a member.
7. The **requester** receives a receipt email quoting the reference.
8. The **leadership** recipients receive the new template: no "Letter type" row, and an "Open in
   dashboard" button that lands on Recommendation Letters with the requests modal open.
9. A failed email does not fail the submission; `notification` and `receipt` statuses are recorded.

### US3 — Approve + Send
10. As admin, open the requests modal → each request shows **Approve** then **Send**.
11. Click Approve → the request shows "Approved" in the list; approver/time recorded.
12. Click Send on an **un-approved** request → it still sends (approval does not gate send).

### US4 — Three-part body
13. In the editor, confirm three body inputs (Intro / Main / Closing) with sensible defaults and row
    counts.
14. Generate the PDF → intro is **bold**, the main block follows (paragraph breaks preserved), then the
    closing. Open an **old** saved draft → it still loads (legacy `closing` → Closing field).

### US5 — No letter type
15. The member request form and the admin editor show **no letter-type choice**; submission works; the
    leadership email has no "Letter type" row; old records still load.

### US6 — Scroll
16. With a long letter, the fields scroll within their pane (~70vh) while the action bar stays visible;
    the page does not grow a second scrollbar.

### Regression
17. Admin preview/send PDF is unchanged (signatures present, no watermark).
18. The public site and unrelated dashboard sections are visually and behaviourally unchanged.

## References

- Field/schema changes: [data-model.md](./data-model.md)
- Endpoints, PDF options, email contracts: [contracts/endpoints.md](./contracts/endpoints.md)
- Email HTML: [contracts/business_letter_request.email.html](./contracts/business_letter_request.email.html),
  [contracts/business_letter_receipt.email.html](./contracts/business_letter_receipt.email.html)
