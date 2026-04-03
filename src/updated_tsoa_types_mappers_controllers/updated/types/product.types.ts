import { BaseModel } from "./base.types";

export type ProductSortKey =
  | "fileId"
  | "name"
  | "downloadCount"
  | "importance"
  | "createdAt"
  | "updatedAt";

export type SortOrder = "asc" | "desc";
export type ProductImportance = "A" | "B" | "C" | "D";

export interface ProductSort {
  key: ProductSortKey;
  order: SortOrder;
}

export type ProductFilter = {
  name?: { $regex: RegExp };
  downloadCount?: { $gte?: number; $lte?: number };
  tags?: string[];
  importance?: ProductImportance;
};

export interface ProductContent {
  description?: string | null;
  shortDescription?: string | null;
  highlights?: string[] | null;
  features?: string[] | null;
}

export interface ProductVariant {
  variantName?: string | null;
  variantValue?: string | null;
}

export interface ProductMedia {
  images?: string[] | null;
  imageAlt?: string | null;
  video?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
}

export interface Product extends BaseModel {
  fileId: string;
  name: string;
  code: string;
  content: ProductContent | null;
  variant: ProductVariant | null;
  media: ProductMedia | null;
  tags: string[] | null;
  downloadCount: number;
  importance: ProductImportance;
  parent?: string | null;
  children: string[] | null;
  recommended: string[] | null;
}

export interface CreateProductRequest {
  fileId: string;
  name: string;
  code: string;
  content?: ProductContent | null;
  variant?: ProductVariant | null;
  media?: ProductMedia | null;
  tags?: string[] | null;
  downloadCount?: number;
  importance: ProductImportance;
  parent?: string | null;
  children?: string[] | null;
  recommended?: string[] | null;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}
