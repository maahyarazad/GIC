import { BaseModel } from "./base.types";

/** Derived at read time: internal = the email belongs to a registered user. */
export type SubscriberType = "internal" | "external";

export interface NewsletterSubscriber extends BaseModel {
  email: string;
  active: boolean;
  type?: SubscriberType;
}

export interface BulkAddSubscribersRequest {
  emails: string[];
}

export interface BulkAddSubscribersResult {
  added: number;
  reactivated: number;
  duplicates: number;
  invalid: string[];
}

export interface CreateNewsletterSubscriberRequest {
  email: string;
  active?: boolean;
}

export interface UpdateNewsletterSubscriberRequest {
  active?: boolean;
}
