/**
 * Event attendance configuration.
 *
 * Recipients can be overridden through environment variables, e.g. to send
 * notifications to a test inbox during development. The BOARD_MEETING_* names
 * from feature 003 are still read as a fallback so existing .env files keep working.
 */
import dotenv from "dotenv";
dotenv.config();

const DEFAULT_RECIPIENTS = [
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

const firstNonEmpty = (...lists: string[][]): string[] =>
  lists.find((list) => list.length > 0) ?? [];

/** CC of the new-attendance notification. */
export const EVENT_CC: string[] = firstNonEmpty(
  parseRecipients(process.env.EVENT_CC),
  parseRecipients(process.env.BOARD_MEETING_CC),
  DEFAULT_RECIPIENTS
);

/** Recipient of the new-attendance notification (the info@ mailbox itself by default). */
export const EVENT_NOTIFY_TO: string =
  process.env.EVENT_NOTIFY_TO?.trim() ||
  process.env.BOARD_MEETING_NOTIFY_TO?.trim() ||
  process.env.SMTP_INFO_SENDER?.trim() ||
  "info@german-industry-club.com";

/** Names of the email templates (emailtemplates collection). */
export const EVENT_TEMPLATES = {
  notification: "event_attendance_notification",
  confirmation: "event_attendance_confirmation",
} as const;

/** Feature 003 templates, no longer used; removed by `seed_event_templates.ts --remove-legacy`. */
export const LEGACY_BOARD_MEETING_TEMPLATES = [
  "board_meeting_request_notification",
  "board_meeting_request_receipt",
  "board_meeting_invitation",
] as const;

export const EVENT_TIMEZONE = "Asia/Dubai";

// Gulf Standard Time has no daylight saving.
export const DUBAI_UTC_OFFSET_HOURS = 4;
