export type Nullable<T> = T | null;

export interface SourceNote {
  source?: string | null;
  year?: number | string | null;
  note?: string | null;
}

export interface SeoFields {
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
}

export interface ImageFields {
  image?: string | null;
  imageAlt?: string | null;
}