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