import { Schema, model } from "mongoose";

const letterText = (maxlength: number) => ({ type: String, trim: true, default: "", maxlength });

// Admin-edited letter of recommendation (feature 005). Absent until first saved.
const LetterSchema = new Schema(
  {
    recipientCompany: letterText(160),
    recipientStreet: letterText(200),
    recipientCity: letterText(120),
    recipientCountry: letterText(120),
    letterDate: letterText(10),
    companyName: letterText(160),
    reference: letterText(200),
    salutation: letterText(160),
    companyLocation: letterText(80),
    industry: letterText(200),
    productsServices: letterText(300),
    projectName: letterText(200),
    closing: letterText(1000),
    savedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    savedAt: { type: Date, default: null },
  },
  { _id: false }
);

// Email delivery of the letter. Absent until first sent.
const LetterDeliverySchema = new Schema(
  {
    status: { type: String, enum: ["sent", "failed"] },
    sentAt: { type: Date, default: null },
    sentBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    sentTo: { type: String, default: "" },
    attemptedAt: { type: Date, default: null },
    count: { type: Number, default: 0 },
    error: { type: String, default: null, maxlength: 500 },
  },
  { _id: false }
);
import {
  BusinessLetterRequestDto,
  formatLetterType,
} from "../types/businessLetter.types";

const BusinessLetterRequestSchema = new Schema(
  {
    reference: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requester: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, default: "", trim: true, maxlength: 40 },
      company: { type: String, default: "", trim: true, maxlength: 160 },
    },
    letterType: {
      type: String,
      required: true,
      enum: [
        "business_recommendation",
        "partner_recommendation",
      ],
    },
    addressee: {
      address: { type: String, default: "", trim: true, maxlength: 500 },
    },
    purpose: { type: String, required: true, trim: true, maxlength: 2000 },
    neededBy: { type: Date, required: true },
    language: { type: String, required: true, enum: ["en", "de"], default: "en" },
    notification: {
      status: {
        type: String,
        enum: ["pending", "sent", "failed"],
        default: "pending",
      },
      attemptedAt: { type: Date, default: null },
      error: { type: String, default: null },
    },
    letter: { type: LetterSchema, default: undefined },
    delivery: { type: LetterDeliverySchema, default: undefined },
  },
  {
    timestamps: true,
  }
);

BusinessLetterRequestSchema.index({ userId: 1, createdAt: -1 });
BusinessLetterRequestSchema.index({ createdAt: -1 });

export const BusinessLetterRequestModel = model(
  "BusinessLetterRequest",
  BusinessLetterRequestSchema
);

const toDateOnly = (value: Date | string): string =>
  new Date(value).toISOString().slice(0, 10);

export const mapBusinessLetterRequest = (doc: any): BusinessLetterRequestDto => ({
  id: doc._id?.toString?.() || doc.id,
  reference: doc.reference,
  requester: {
    name: doc.requester?.name,
    email: doc.requester?.email,
    phone: doc.requester?.phone || "",
    company: doc.requester?.company || "",
  },
  letterType: doc.letterType,
  letterTypeLabel: formatLetterType(doc.letterType),
  addressee: {
    address: doc.addressee?.address || "",
  },
  purpose: doc.purpose,
  neededBy: toDateOnly(doc.neededBy),
  language: doc.language,
  notificationStatus: doc.notification?.status ?? "pending",
  createdAt: new Date(doc.createdAt).toISOString(),
});
