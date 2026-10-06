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

/** Request body for POST /api/v1/business-letters. The requester email is taken from the user record. */
export interface CreateBusinessLetterRequest {
  requester: {
    name: string;
    phone?: string;
    company?: string;
  };
  letterType: BusinessLetterType;
  addressee: {
    address?: string;
  };
  purpose: string;
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
  addressee: {
    address?: string;
  };
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
