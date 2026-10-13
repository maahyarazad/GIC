import { Schema, model, models, Types } from "mongoose";
import { INDUSTRY_SECTORS } from "../config/industrySectors";
import { TenderListItem } from "../types/tender.types";

export interface TenderAttachmentDocument {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
}

export interface TenderCreatorDocument {
  userId: Types.ObjectId;
  name: string;
  email: string;
}

export interface TenderDocument {
  sector: string;
  publisher: string;
  announcement: string;
  publishedAt: Date;
  deadline: Date;
  closedByAdminAt: Date | null;
  attachment: TenderAttachmentDocument | null;
  creator: TenderCreatorDocument;
  createdAt?: Date;
  updatedAt?: Date;
}

const TenderAttachmentSchema = new Schema<TenderAttachmentDocument>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const TenderCreatorSchema = new Schema<TenderCreatorDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false }
);

const TenderSchema = new Schema<TenderDocument>(
  {
    sector: { type: String, enum: INDUSTRY_SECTORS, required: true, index: true },
    publisher: { type: String, required: true, trim: true, maxlength: 160 },
    announcement: { type: String, required: true, trim: true, maxlength: 2000 },
    publishedAt: { type: Date, required: true },
    deadline: { type: Date, required: true },
    closedByAdminAt: { type: Date, default: null },
    attachment: { type: TenderAttachmentSchema, default: null },
    creator: { type: TenderCreatorSchema, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

TenderSchema.index({ createdAt: -1 });

export const TenderModel = models.Tender || model<TenderDocument>("Tender", TenderSchema);

/** Closed once an admin closes it early, or once its deadline passes — whichever comes first (research R4). */
export const deriveTenderStatus = (doc: Pick<TenderDocument, "closedByAdminAt" | "deadline">): "open" | "closed" =>
  doc.closedByAdminAt != null || new Date() > new Date(doc.deadline) ? "closed" : "open";

export const mapTenderToListItem = (doc: any): TenderListItem => ({
  id: String(doc._id),
  sector: doc.sector,
  publisher: doc.publisher,
  announcement: doc.announcement,
  publishedAt: new Date(doc.publishedAt).toISOString(),
  deadline: new Date(doc.deadline).toISOString(),
  status: deriveTenderStatus(doc),
  attachment: doc.attachment
    ? {
        filename: doc.attachment.filename,
        originalName: doc.attachment.originalName,
        mimetype: doc.attachment.mimetype,
        size: doc.attachment.size,
      }
    : null,
  creator: { name: doc.creator.name, email: doc.creator.email },
  createdAt: new Date(doc.createdAt).toISOString(),
});
