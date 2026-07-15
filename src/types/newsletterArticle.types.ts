import { BaseModel } from "./base.types";

export interface NewsletterArticle extends BaseModel {
  title: string;
  subject: string;
  html: string;
  text?: string;
  /** Timestamp of when the article was sent to subscribers, or null. */
  sentAt: string | null;
}

export interface CreateNewsletterArticleRequest {
  title: string;
  subject: string;
  html: string;
  text?: string;
}

export interface UpdateNewsletterArticleRequest
  extends Partial<CreateNewsletterArticleRequest> {}

/** Body for POST /newsletter-articles/{id}/send-test — the recipient of the test email. */
export interface SendTestNewsletterRequest {
  email: string;
}
