import { Schema, model, models } from "mongoose";

export interface NewsletterSubscriberDocument {
  email: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const NewsletterSubscriberSchema = new Schema<NewsletterSubscriberDocument>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    active: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const NewsletterSubscriberModel =
  models.NewsletterSubscriber || model<NewsletterSubscriberDocument>("NewsletterSubscriber", NewsletterSubscriberSchema);
