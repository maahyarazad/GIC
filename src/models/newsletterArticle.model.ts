import { Schema, model, models } from "mongoose";

export interface NewsletterArticleDocument {
  title: string;
  subject: string;
  html: string;
  text?: string;
  /** Set when the article is sent to subscribers; null until then. */
  sentAt: Date | null;
  /** Visible to members on the landing page / newsletter pages. Independent of sending. */
  published: boolean;
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
    published: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const NewsletterArticleModel =
  models.NewsletterArticle ||
  model<NewsletterArticleDocument>("NewsletterArticle", NewsletterArticleSchema);
