import { BaseModel } from "./base.types";

export interface NewsletterArticle extends BaseModel {
  title: string;
  subject: string;
  html: string;
  text?: string;
  /** Timestamp of when the article was sent to subscribers, or null. */
  sentAt: string | null;
  /** Whether members can see it on the landing page. */
  published: boolean;
}

export interface CreateNewsletterArticleRequest {
  title: string;
  subject: string;
  html: string;
  text?: string;
  published?: boolean;
}

export interface UpdateNewsletterArticleRequest
  extends Partial<CreateNewsletterArticleRequest> {}

/** Body for POST /newsletter-articles/{id}/send-test — the recipient of the test email. */
export interface SendTestNewsletterRequest {
  email: string;
}

/** Landing-page view of a sent article. `preview` is only present for authorized callers; never the HTML. */
export interface NewsletterTeaser {
  id: string;
  title: string;
  sentAt: string;
  preview?: string;
}

/** Full article for signed-in readers. */
export interface NewsletterPublicDetail {
  id: string;
  title: string;
  subject: string;
  sentAt: string;
  html: string;
}
