import { BaseModel } from "./base.types";

export type ProductSortKey =
  | "sku"
  | "name"
  | "price"
  | "product_type"
  | "partner"
  | "set"
  | "sale_price"
  | "sale_period"
  | "createdAt"
  | "updatedAt";

  
  export type SortOrder = "asc" | "desc";

export interface ProductSort {
  key: ProductSortKey;
  order: SortOrder;
}


export type ProductFilter = {
  name?: { $regex: RegExp };
  price?: { $gte?: number; $lte?: number };
  product_type?: string;
  tags?: string[];
};


export interface Product extends BaseModel {
  
  sku: string;
  name: string;
  price: number;
  product_type: string;
  partner: string | null;
  set: string | null;

  content: ProductContent | null;
  variant: ProductVariant | null;
  media: ProductMedia | null;

  tags: string[]  | null;

  sale_price: string | number | null;
  sale_period: string | null;

  parent: (string | null)[]  | null;
  children: string[]  | null;
  recommended: string[]  | null;
}

export interface ProductContent {
  description: string;
  feature: string[];
  care: string[];
}

export interface ProductVariant {
  color: string[];
  size: string[];
}

export interface ProductMedia {
  images: string[];
  video: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  price: number;
  product_type: string;
  partner: string | null;
  set: string | null;

  content: ProductContent | null;
  variant: ProductVariant | null;
  media: ProductMedia | null;

  tags: string[]  | null;

  sale_price: string | number | null;
  sale_period: string | null;

  parent: (string | null)[];
  children: string[]  | null;
  recommended: string[]  | null;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  updatedAt?: Date;
}

