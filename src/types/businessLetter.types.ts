import type { LetterFields } from "./recommendationLetter.types";

export type BusinessLetterType = "business_recommendation" | "partner_recommendation";

export type BusinessLetterLanguage = "en" | "de";

export type NotificationStatus = "pending" | "sent" | "failed";

export const LETTER_TYPE_LABELS: Record<BusinessLetterType, string> = {
  business_recommendation: "Business Recommendations",
  partner_recommendation: "Partner Recommendations",
};

export const LANGUAGE_LABELS: Record<BusinessLetterLanguage, string> = {
  en: "English",
  de: "German",
};

export const formatLetterType = (type: BusinessLetterType): string =>
  LETTER_TYPE_LABELS[type] ?? type;

/**
 * The letter's addressee and project/tender reference (recommendation letter v2).
 * `reference` is the subject reference — Project Name / Tender Number or Name / Business
 * Initiative — NOT the request's BL-… tracking id.
 */
export interface AddresseeFields {
  title: string;
  fullName: string;
  attn: string;
  city: string;
  country: string;
  address: string;
  reference: string;
}

/** Field length limits for the addressee block (shared by client and server validation). */
export const ADDRESSEE_LIMITS: Record<keyof AddresseeFields, number> = {
  title: 120,
  fullName: 160,
  attn: 160,
  city: 120,
  country: 120,
  address: 300,
  reference: 200,
};

/** Request body for POST /api/v1/business-letters. The requester email is taken from the user record. */
export interface CreateBusinessLetterRequest {
  requester: {
    name: string;
    phone?: string;
    company?: string;
  };
  /** @deprecated Removed from the UI (feature 010); defaulted server-side when omitted. */
  letterType?: BusinessLetterType;
  addressee: AddresseeFields;
  purpose: string;
  /**
   * The drafted letter of recommendation (feature 010). The member now writes the full letter on the
   * request form, so it is seeded here instead of being auto-generated on first open.
   */
  letter?: LetterFields;
  /** Date only, YYYY-MM-DD */
  neededBy: string;
  language: BusinessLetterLanguage;
}

export interface BusinessLetterRequestDto {
  id: string;
  reference: string;
  requester: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  letterType: BusinessLetterType;
  letterTypeLabel: string;
  addressee: AddresseeFields;
  purpose: string;
  /** Date only, YYYY-MM-DD */
  neededBy: string;
  language: BusinessLetterLanguage;
  notificationStatus: NotificationStatus;
  createdAt: string;
}

export interface BusinessLetterRequestList {
  items: BusinessLetterRequestDto[];
  total: number;
  page: number;
  pages: number;
}
