import nodemailer, { SendMailOptions } from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
import { EmailLogModel } from "../models/emailLog.model";
import type { EmailLogAttachment } from "../types/emailLog.types";

/**
 * The only module that talks to nodemailer. Every send is recorded in `email_log`
 * (pending -> sent/failed); logging failures never affect the send itself.
 */

export interface EmailAttachment {
  filename?: string;
  path?: string;
  content?: any;
  contentType?: string;
}

/** "default" sends from SMTP_SENDER (do-not-reply@), "info" from SMTP_INFO_SENDER (info@). */
export type EmailSender = "default" | "info";

export interface SendRawEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  bcc?: string | string[];
  cc?: string | string[];
  replyTo?: string;
  sender?: EmailSender;
  /** Recorded in the email log: template name or a named kind. Defaults to "raw". */
  kind?: string;
  /** Recorded in the email log: shared by all sends of one bulk run. */
  runId?: string;
}

const SMTP_ACCOUNTS: Record<EmailSender, { user?: string; pass?: string; from?: string }> = {
  default: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS, from: process.env.SMTP_SENDER },
  info: { user: process.env.SMTP_INFO_USER, pass: process.env.SMTP_INFO_PASS, from: process.env.SMTP_INFO_SENDER },
};

function toAddressList(value?: string | string[]): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value])
    .filter((address) => typeof address === "string" && address.trim())
    .map((address) => address.trim().toLowerCase());
}

function toAttachmentMeta(attachments: EmailAttachment[] = []): EmailLogAttachment[] {
  return attachments.map((attachment) => {
    const content = attachment?.content;
    const size = Buffer.isBuffer(content) || typeof content === "string" ? content.length : undefined;
    return { filename: attachment?.filename, contentType: attachment?.contentType, size };
  });
}

async function createLogRecord(params: SendRawEmailParams, sender: EmailSender): Promise<string | null> {
  try {
    const record = await EmailLogModel.create({
      to: toAddressList(params.to),
      cc: toAddressList(params.cc),
      bcc: toAddressList(params.bcc),
      replyTo: params.replyTo,
      sender,
      from: SMTP_ACCOUNTS[sender]?.from,
      subject: params.subject ?? "",
      kind: params.kind || "raw",
      runId: params.runId,
      attachments: toAttachmentMeta(params.attachments),
      status: "pending",
    });
    return record._id.toString();
  } catch (error) {
    console.error("Email log insert failed:", error);
    return null;
  }
}

/** Fire-and-forget: the caller never waits for, or sees, a failed update. */
function finishLogRecord(id: string | null, update: Record<string, any>) {
  if (!id) return;
  try {
    void EmailLogModel.updateOne({ _id: id }, { $set: { ...update, finishedAt: new Date() } })
      .exec()
      .catch((error: unknown) => console.error("Email log update failed:", error));
  } catch (error) {
    console.error("Email log update failed:", error);
  }
}

export async function sendLoggedEmail({
  to,
  subject,
  html,
  text = "",
  attachments = [],
  bcc = [],
  cc,
  replyTo,
  sender = "default",
  kind,
  runId,
}: SendRawEmailParams) {
  const logId = await createLogRecord({ to, subject, html, attachments, bcc, cc, replyTo, kind, runId }, sender);

  try {
    const account = SMTP_ACCOUNTS[sender];
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT!),
      secure: false,
      auth: {
        user: account.user!,
        pass: account.pass!,
      },
    });

    const mailOptions: SendMailOptions = {
      from: account.from!,
      to,
      cc,
      replyTo,
      subject,
      html,
      text,
      attachments,
      bcc,
    };

    const response = await transporter.sendMail(mailOptions);
    console.log("Email sent:", response.messageId);
    finishLogRecord(logId, { status: "sent", messageId: response.messageId });
    return response;
  } catch (error: any) {
    console.error("SMTP send error:", error);
    finishLogRecord(logId, { status: "failed", error: String(error?.message ?? error).slice(0, 500) });
    throw error;
  }
}
