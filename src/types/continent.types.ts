import { BaseModel } from "./base.types";
import { Product } from "./product.types";
import { ObjectId } from "mongodb";
export interface Continent extends BaseModel {
  name: string;
  slug: string;

  description?: string | null;

  // Continent now stores full Product objects
    products?: (ObjectId | null)[];

  parent: string | null;      // parent continent
  children: string[] | null;  // child continent IDs

  isActive: boolean;
  order?: number;
  image?: string | null;             
  imageAlt?: string | null;             
  seoTitle?: string | null;          
  seoDescription?: string | null;    
  seoKeywords?: string[] | null;     
}


export interface ContinetViewModel extends Continent{
    productObjects?: Product[],
}

// Request when creating a continent
export interface CreateContinentRequest {
  name: string;
  slug: string;
  description?: string | null;

  // Accept full product objects now
products?: (ObjectId | null)[] | null;
productObject?: Product[] | null;
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

// Request when updating a continent
export interface UpdateContinentRequest extends Partial<CreateContinentRequest> {
  updatedAt?: Date;
}
