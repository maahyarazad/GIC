import { BaseModel } from "./base.types";
import { Product } from "./product.types";

export interface Continent extends BaseModel {
  name: string;
  slug: string;
  description?: string | null;
  products?: string[] | null;
  parent: string | null;
  children: string[] | null;
  isActive: boolean;
  order?: number;
  image?: string | null;
  imageAlt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
}

export interface ContinentViewModel extends Continent {
  productObjects?: Product[];
}

export interface CreateContinentRequest {
  name: string;
  slug: string;
  description?: string | null;
  products?: string[] | null;
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
}

export interface UpdateContinentRequest extends Partial<CreateContinentRequest> {
  _id?: string;
}
