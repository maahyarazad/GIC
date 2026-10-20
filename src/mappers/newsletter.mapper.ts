import { NewsletterSubscriber, SubscriberType } from "../types/newsletterSubscriber.types";
import { mapId } from "./objectId.mapper";

export const mapNewsletterSubscriber = (doc: any, type?: SubscriberType): NewsletterSubscriber => ({
  _id: mapId(doc?._id),
  email: doc.email,
  active: Boolean(doc.active),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  ...(type ? { type } : {}),
});

export const mapNewsletterSubscribers = (docs: any[] = []): NewsletterSubscriber[] =>
  docs.map((doc) => mapNewsletterSubscriber(doc));
