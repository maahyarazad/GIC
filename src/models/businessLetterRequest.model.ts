import { Schema, model } from "mongoose";
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
  },
  {
    timestamps: true,
  }
);

BusinessLetterRequestSchema.index({ userId: 1, createdAt: -1 });

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
