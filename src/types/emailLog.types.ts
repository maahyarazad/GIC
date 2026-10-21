// Shared with ui/: keep this file free of mongoose/node imports.

export type EmailLogStatus = "pending" | "sent" | "failed";

export interface EmailLogAttachment {
  filename?: string;
  contentType?: string;
  size?: number;
}

export interface EmailLog {
  id: string;
  to: string[];
  cc: string[];
  bcc: string[];
  replyTo: string | null;
  sender: "default" | "info";
  from: string | null;
  subject: string;
  /** Template name or a named kind ("newsletter", "newsletter_test", "bulk", "raw"). */
  kind: string;
  /** Shared by all records of one bulk send. */
  runId: string | null;
  attachments: EmailLogAttachment[];
  status: EmailLogStatus;
  messageId: string | null;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

export type EmailLogSortKey = "createdAt" | "subject" | "kind" | "status" | "sender";
