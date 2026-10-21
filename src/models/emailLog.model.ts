import { Schema, model, models, type Model } from "mongoose";
import type { EmailLog, EmailLogAttachment, EmailLogStatus } from "../types/emailLog.types";

export interface EmailLogDocument {
  to: string[];
  cc: string[];
  bcc: string[];
  replyTo?: string;
  sender: "default" | "info";
  from?: string;
  subject: string;
  kind: string;
  runId?: string;
  attachments: EmailLogAttachment[];
  status: EmailLogStatus;
  messageId?: string;
  error?: string;
  finishedAt?: Date;
  createdAt?: Date;
}

const AddressList = { type: [{ type: String, lowercase: true, trim: true }], default: [] };

const EmailLogSchema = new Schema<EmailLogDocument>(
  {
    to: AddressList,
    cc: AddressList,
    bcc: AddressList,
    replyTo: { type: String, trim: true },
    sender: { type: String, enum: ["default", "info"], required: true },
    from: { type: String, trim: true },
    subject: { type: String, default: "" },
    kind: { type: String, required: true, default: "raw", trim: true },
    runId: { type: String },
    attachments: {
      type: [
        new Schema(
          { filename: String, contentType: String, size: Number },
          { _id: false }
        ),
      ],
      default: [],
    },
    status: { type: String, enum: ["pending", "sent", "failed"], required: true, default: "pending" },
    messageId: { type: String },
    error: { type: String },
    finishedAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

// Retention: records are removed 12 months after they are created.
EmailLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
EmailLogSchema.index({ status: 1, createdAt: -1 });
EmailLogSchema.index({ kind: 1, createdAt: -1 });
EmailLogSchema.index({ to: 1 });
EmailLogSchema.index({ runId: 1 }, { sparse: true });

export const EmailLogModel: Model<EmailLogDocument> =
  (models.EmailLog as Model<EmailLogDocument>) ||
  model<EmailLogDocument>("EmailLog", EmailLogSchema, "email_log");

const toIso = (value: any): string | null => (value ? new Date(value).toISOString() : null);

export const mapEmailLog = (doc: any): EmailLog => ({
  id: doc._id?.toString?.() || doc.id,
  to: doc.to ?? [],
  cc: doc.cc ?? [],
  bcc: doc.bcc ?? [],
  replyTo: doc.replyTo ?? null,
  sender: doc.sender,
  from: doc.from ?? null,
  subject: doc.subject ?? "",
  kind: doc.kind,
  runId: doc.runId ?? null,
  attachments: doc.attachments ?? [],
  status: doc.status,
  messageId: doc.messageId ?? null,
  error: doc.error ?? null,
  createdAt: toIso(doc.createdAt) ?? "",
  finishedAt: toIso(doc.finishedAt),
});
