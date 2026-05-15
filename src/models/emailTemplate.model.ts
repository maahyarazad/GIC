import { Schema, model, models } from "mongoose";

export interface EmailTemplateDocument {
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const EmailTemplateSchema = new Schema<EmailTemplateDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    subject: { type: String, required: true, trim: true },
    html: { type: String, required: true },
    text: { type: String, default: undefined },
    variables: { type: [String], default: undefined },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const EmailTemplateModel = models.EmailTemplate || model<EmailTemplateDocument>("EmailTemplate", EmailTemplateSchema);
