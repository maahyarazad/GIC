import { NewsletterArticle } from "../types/newsletterArticle.types";
import { mapId } from "./objectId.mapper";

export const mapNewsletterArticle = (doc: any): NewsletterArticle => ({
  _id: mapId(doc?._id),
  title: doc.title,
  subject: doc.subject,
  html: doc.html,
  text: doc.text,
  sentAt: doc.sentAt ?? null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const mapNewsletterArticles = (docs: any[] = []): NewsletterArticle[] =>
  docs.map(mapNewsletterArticle);
