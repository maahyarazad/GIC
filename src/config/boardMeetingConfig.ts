/**
 * Board meeting request configuration.
 *
 * Recipients can be overridden through environment variables, e.g. to send
 * notifications to a test inbox during development.
 */
import dotenv from "dotenv";
dotenv.config();

const DEFAULT_RECIPIENTS = [
  "ricco.deutscher@german-industry-club.com",
  "philip.hoelzer@german-industry-club.com",
  "jan.hussing@german-industry-club.com",
  "thomas.hochberger@german-industry-club.com",
  "office6@german-emirates-club.com",
];

const parseRecipients = (raw?: string): string[] =>
  (raw ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

const envCc = parseRecipients(process.env.BOARD_MEETING_CC);

/** CC of the new-request notification. */
export const BOARD_MEETING_CC: string[] =
  envCc.length > 0 ? envCc : DEFAULT_RECIPIENTS;

/** Recipient of the new-request notification (the info@ mailbox itself by default). */
export const BOARD_MEETING_NOTIFY_TO: string =
  process.env.BOARD_MEETING_NOTIFY_TO?.trim() ||
  process.env.SMTP_INFO_SENDER?.trim() ||
  "info@german-industry-club.com";

/** Names of the email templates (emailtemplates collection). */
export const BOARD_MEETING_TEMPLATES = {
  notification: "board_meeting_request_notification",
  receipt: "board_meeting_request_receipt",
  invitation: "board_meeting_invitation",
} as const;

export const BOARD_MEETING_TIMEZONE = "Asia/Dubai";

// Gulf Standard Time has no daylight saving.
export const DUBAI_UTC_OFFSET_HOURS = 4;
