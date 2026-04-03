import { NewsletterSubscriber } from "../types/newsletterSubscriber.types";
import { mapId } from "./objectId.mapper";

export const mapNewsletterSubscriber = (doc: any): NewsletterSubscriber => ({
  _id: mapId(doc?._id),
  email: doc.email,
  active: Boolean(doc.active),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const mapNewsletterSubscribers = (docs: any[] = []): NewsletterSubscriber[] =>
  docs.map(mapNewsletterSubscriber);
