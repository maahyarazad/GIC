import axiosInstance from "./axiosInstance";
import type {
  NewsletterTeaser,
  NewsletterPublicDetail,
} from "../../../src/types/newsletterArticle.types";

export async function getNewsletterTeasers(limit = 6) {
  const res = await axiosInstance.get("/newsletter-articles/public", { params: { limit } });
  return res.data as { data?: { items: NewsletterTeaser[]; authorized: boolean } };
}

export async function getNewsletterArticle(id: string) {
  const res = await axiosInstance.get(`/newsletter-articles/public/${encodeURIComponent(id)}`);
  return res.data as { data?: NewsletterPublicDetail };
}
