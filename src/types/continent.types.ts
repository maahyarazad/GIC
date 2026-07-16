import { BaseModel } from "./base.types";
import {
  Product,
  ProductContent,
  ProductVariant,
  ProductMedia,
  ProductImportance,
} from "./product.types";

/**
 * The trimmed product shape the continent editor sends on save. Deliberately a
 * subset of Product (no heavy metadata / read-only fields) so the save request
 * stays small and validates cleanly.
 */
export interface ContinentProductInput {
  _id?: string;
  fileId: string;
  name: string;
  code: string;
  importance: ProductImportance;
  productVersion?: string | null;
  fileUpload_timeStamp?: number | null;
  content?: ProductContent | null;
  variant?: ProductVariant | null;
  media?: ProductMedia | null;
  tags?: string[] | null;
  downloadCount?: number;
  children?: string[] | null;
  recommended?: string[] | null;
}

export interface Continent extends BaseModel {
  name: string;
  slug: string;
  code?: string | null;
  description?: string | null;

  /**
   * country ids under this sub-region
   */
  products?: string[] | null;

  /**
   * optional country codes under this sub-region
   */
  productCodes?: string[] | null;

  parent: string | null;
  children: string[] | null;
  isActive: boolean;
  order?: number;

  image?: string | null;
  imageAlt?: string | null;

  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;

  /**
   * original label from source files
   */
  sourceLabel?: string | null;

  /**
   * region-level summary
   */
  summary?: {
    countryCount?: number | null;
    chapterCoverage?: string[] | null;
    notes?: string | null;
  } | null;
}

export interface ContinentViewModel extends Continent {
  productObjects?: Product[];
}

export interface CreateContinentRequest {
  name: string;
  slug: string;
  code?: string | null;
  description?: string | null;
  products?: string[] | null;
  productCodes?: string[] | null;
  productObjects?: ContinentProductInput[] | null;
  parent?: string | null;
  children?: string[] | null;
  isActive?: boolean;
  order?: number;
  image?: string | null;
  imageAlt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
  sourceLabel?: string | null;
  summary?: {
    countryCount?: number | null;
    chapterCoverage?: string[] | null;
    notes?: string | null;
  } | null;
}

/**
 * Declared explicitly (not `Partial<CreateContinentRequest>`) because tsoa drops
 * the `| null` from a Partial's nullable fields, which then rejects the `null`
 * values the client sends (code, description, parent, image, …).
 */
export interface UpdateContinentRequest {
  _id?: string;
  name?: string;
  slug?: string;
  code?: string | null;
  description?: string | null;
  products?: string[] | null;
  productCodes?: string[] | null;
  productObjects?: ContinentProductInput[] | null;
  parent?: string | null;
  children?: string[] | null;
  isActive?: boolean;
  order?: number;
  image?: string | null;
  imageAlt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
  sourceLabel?: string | null;
  summary?: {
    countryCount?: number | null;
    chapterCoverage?: string[] | null;
    notes?: string | null;
  } | null;
}
/** Body for POST /continents/data_packages/import — the folder name under chapter_data/. */
export interface ImportDataPackageRequest {
  package: string;
}
