/**
 * Business letter request configuration.
 *
 * Both values can be overridden through environment variables, e.g. to send
 * notifications to a test inbox or to point at a local copy of the template.
 */
import dotenv from "dotenv";
dotenv.config();

const DEFAULT_RECIPIENTS = [
  "ricco.deutscher@german-industry-club.com",
  "philip.hoelzer@german-industry-club.com",
  "jan.hussing@german-industry-club.com",
  "thomas.hochberger@german-industry-club.com",
];

// Email template record (emailtemplates collection) used for new request notifications.
const DEFAULT_EMAIL_TEMPLATE_ID = "6ac4970fe31c56f3436780a0";

const parseRecipients = (raw?: string): string[] =>
  (raw ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

const envRecipients = parseRecipients(process.env.BUSINESS_LETTER_RECIPIENTS);

export const BUSINESS_LETTER_RECIPIENTS: string[] =
  envRecipients.length > 0 ? envRecipients : DEFAULT_RECIPIENTS;

export const BUSINESS_LETTER_EMAIL_TEMPLATE_ID: string =
  process.env.BUSINESS_LETTER_EMAIL_TEMPLATE_ID || DEFAULT_EMAIL_TEMPLATE_ID;
