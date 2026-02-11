import { BaseModel } from "./base.types";
import { ObjectId } from "mongodb";
export type ProductSortKey =
  | "fileId"
  | "name"
  | "downloadCount"
  | "importance"
  | "createdAt"
  | "updatedAt";

export type SortOrder = "asc" | "desc";

export interface ProductSort {
  key: ProductSortKey;
  order: SortOrder;
}

export type ProductFilter = {
  name?: { $regex: RegExp };
  downloadCount?: { $gte?: number; $lte?: number };
  tags?: string[];
  importance?: number;
};

export interface Product extends BaseModel {
  fileId: string; // replaced sku with fileId
  name: string;
  code: string;
  content: ProductContent | null;
  variant: ProductVariant | null;
  media: ProductMedia | null;

  tags: string[] | null;

  downloadCount: number; // new field
  importance: "A" | "B" | "C" | "D";

parent?: ObjectId | null;
  children: string[] | null;
  recommended: string[] | null;
}
export interface ProductContent {
  // UI content fields
  description?: string | null;
  shortDescription?: string | null;
  highlights?: string[] | null;
  features?: string[] | null;
}

export interface ProductVariant {
  // If you don't need color/size anymore, can use variant for UI purposes
  variantName?: string | null;
  variantValue?: string | null;
}

export interface ProductMedia {
  // SEO and UI media
  images?: string[] | null;         // multiple images
  imageAlt?: string | null;         // alt text for main image
  video?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
}

export interface CreateProductRequest {
  fileId: string;
  name: string;

  content: ProductContent | null;
  variant: ProductVariant | null;
  media: ProductMedia | null;

  tags: string[] | null;

  downloadCount?: number;
  importance?: number;

parent?: ObjectId | null;
  children: string[] | null;
  recommended: string[] | null;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  updatedAt?: Date;
}
