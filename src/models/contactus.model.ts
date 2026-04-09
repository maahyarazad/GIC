import { Schema, model } from "mongoose";

const ContactUsSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    company: { type: String, default: "", trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "", trim: true },
    industry: { type: String, required: true, trim: true },
    countryOfInterest: { type: String, default: "", trim: true },
    meaObjective: { type: String, required: true, trim: true },
    referredBy: { type: String, default: "", trim: true },
    attachment: {
      fieldname: { type: String, default: null },
      originalname: { type: String, default: null },
      mimetype: { type: String, default: null },
      size: { type: Number, default: null },
      filename: { type: String, default: null },
      path: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

export const ContactUsModel = model("ContactUs", ContactUsSchema);

export const mapContactUsSubmission = (doc: any) => ({
  id: doc._id?.toString?.() || doc.id,
  fullName: doc.fullName,
  company: doc.company,
  email: doc.email,
  phone: doc.phone,
  industry: doc.industry,
  countryOfInterest: doc.countryOfInterest,
  meaObjective: doc.meaObjective,
  referredBy: doc.referredBy,
  attachment: doc.attachment,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export interface ContactUsSubmission {
  id: string;
  fullName: string;
  company?: string;
  email: string;
  phone?: string;
  industry: string;
  countryOfInterest?: string;
  meaObjective: string;
  referredBy?: string;
  attachment?: {
    fieldname?: string | null;
    originalname?: string | null;
    mimetype?: string | null;
    size?: number | null;
    filename?: string | null;
    path?: string | null;
  } | null;
  createdAt?: Date;
  updatedAt?: Date;
}