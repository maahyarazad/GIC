import { BaseModel } from "./base.types";
import { Product } from "./product.types";

export interface Continent extends BaseModel {
  name: string;
  slug: string;

  description?: string | null;

  products: Product[];

  parent: string | null;
  children: string[] | null;

  isActive: boolean;
  order?: number;
}


export interface CreateContinentRequest {
  name: string;
  slug: string;
  description?: string | null;

  products: string[]; // product IDs
  parent: string | null;
  children: string[] | null;

  isActive: boolean;
  order?: number;
}

export interface UpdateContinentRequest extends Partial<CreateContinentRequest> {
  description?: string | null;
  parent?: string | null;
  children?: string[] | null;
  products?: string[] | null;
  updatedAt?: Date;
}
