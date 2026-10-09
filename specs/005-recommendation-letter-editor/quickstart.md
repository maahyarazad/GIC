# Quickstart: Validate the Recommendation Letter Editor

This guide proves the feature works end to end. Endpoints are in [contracts/recommendation-letters.api.md](./contracts/recommendation-letters.api.md), and field rules are in [data-model.md](./data-model.md).

## Prerequisites

1. **The info@ SMTP account authenticates.** It did on 2026-10-09:
   ```bash
   node -e 'require("dotenv").config();require("nodemailer").createTransport({host:process.env.SMTP_HOST,port:+process.env.SMTP_PORT,secure:false,auth:{user:process.env.SMTP_INFO_USER,pass:process.env.SMTP_INFO_PASS}}).verify().then(()=>console.log("AUTH OK"),e=>console.log(e.message))'
   ```
2. **Test accounts.** Use an admin, plus a member account **whose email is a test inbox you own**. Send goes to the requester's email.
3. **Requests to work with.** Submit at least two letter requests as that member through Dashboard → Request for letter of recommendation: one with a company and a multi-line addressee address, and one with an empty company.

## Build and run

```bash
npm run build && ls dist/email_templates dist/assets   # the copy step must have run (research R11)
(cd ui && npm run build)
npm run dev
```

## Scenarios

| # | Scenario | Steps | Expected |
|---|---|---|---|
| 1 | Access | As a member, look for the tab and call `GET /api/v1/admin/letter-requests` | No menu item; the call returns 403 |
| 2 | List | As admin, open Dashboard → Recommendation Letters | Requests appear on the left, newest first, each with status *New*. The right half says "Select a request". |
| 3 | Prefill (US1) | Select the request that has a company | The company name, recipient lines (split from the address), project (from the purpose) and today's date are filled in. Industry and products are empty. The line reads "Not saved yet". |
| 4 | Validation | Click Save with industry empty | Field errors appear and nothing is saved |
| 5 | Save and return | Fill industry and products, change the salutation, Save. Switch to another tab and back, then reload. | "Letter saved". The edited values are still there after both. The status is *Draft*, with "Last saved by <admin>". |
| 6 | Unsaved guard | Edit a field, then select another request | "Discard unsaved changes?" Cancel keeps the edit. |
| 7 | View (US2) | Change the company name without saving and click View | A new tab shows the PDF with the new name in the subject and all three sections. The edit is still unsaved. |
| 8 | Download | Click Download PDF | `<reference>.pdf` downloads and matches the View output. Check the logo, sender block, header, the "n / N" footer, and both signatories with their titles. |
| 9 | Long text | Put ~800 characters in Closing and click View | The text wraps within the margins, the signature block moves to page 2 intact, and the header and footer appear on both pages. |
| 10 | Unicode hint | Type an Arabic name in Company name | A hint says some characters will print as "?". View shows "?" in their place and doesn't error. |
| 11 | Send (US3) | Click Send on the saved request and confirm | "Letter sent to <email>". The test inbox receives the email from info@ with `<reference>.pdf` attached. The row shows *Sent* with the date. |
| 12 | Send while dirty | Edit the open request, then click its Send | The dialog offers "Save & send". The email carries the saved edit. |
| 13 | Send without draft | Click Send on a request that was never saved | Nothing is sent. The request opens in the editor with "Complete and save the letter before sending". `POST …/send` returns 409 `LETTER_NOT_SAVED`. |
| 14 | Send again | Send scenario 11's request again | The confirm says "Already sent on <date>". After confirming, `count` is 2. |
| 15 | Send failure | Restart with `SMTP_INFO_PASS=wrong` and click Send | An error snackbar appears and the row shows *Send failed*. Restore the password and retry: *Sent*. |
| 16 | Template provisioning | Delete `recommendation_letter_delivery` from `emailtemplates`, then Send | The template is recreated automatically and the email arrives. An admin-edited template is not overwritten. |
| 17 | Production layout | `node dist/server.js` (after `npm run build`), then View | The PDF renders, which proves the logo resolves from `dist/assets`. |

## Done when

All scenarios pass, both builds are clean, and no other dashboard tab has changed.
