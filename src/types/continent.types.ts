import { BaseModel } from "./base.types";
import { Product } from "./product.types";

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
  productObjects?: Product[] | null;
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

export interface UpdateContinentRequest extends Partial<CreateContinentRequest> {
  _id?: string;
}
/** Body for POST /continents/data_packages/import — the folder name under chapter_data/. */
export interface ImportDataPackageRequest {
  package: string;
}
