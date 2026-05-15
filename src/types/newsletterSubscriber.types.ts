import { BaseModel } from "./base.types";

export interface NewsletterSubscriber extends BaseModel {
  email: string;
  active: boolean;
}

export interface CreateNewsletterSubscriberRequest {
  email: string;
  active?: boolean;
}

export interface UpdateNewsletterSubscriberRequest {
  active?: boolean;
}
