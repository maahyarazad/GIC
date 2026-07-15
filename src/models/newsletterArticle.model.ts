import { Schema, model, models } from "mongoose";

export interface NewsletterArticleDocument {
  title: string;
  subject: string;
  html: string;
  text?: string;
  /** Set when the article is sent to subscribers; null until then. */
  sentAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const NewsletterArticleSchema = new Schema<NewsletterArticleDocument>(
  {
    title: { type: String, required: true, trim: true, index: true },
    subject: { type: String, required: true, trim: true },
    html: { type: String, required: true },
    text: { type: String, default: undefined },
    sentAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const NewsletterArticleModel =
  models.NewsletterArticle ||
  model<NewsletterArticleDocument>("NewsletterArticle", NewsletterArticleSchema);
