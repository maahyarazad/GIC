import { ObjectId } from "mongodb";
import { Continent, ContinentViewModel, CreateContinentRequest } from "../types/continent.types";
import { mapId, toObjectId, toObjectIdArray } from "./objectId.mapper";
import { mapProduct, ProductDb } from "./product.mapper";

export interface ContinentDb {
  _id?: ObjectId;
  name: string;
  slug: string;
  description?: string | null;
  products?: ObjectId[] | null;
  parent: ObjectId | null;
  children: ObjectId[] | null;
  isActive: boolean;
  order?: number;
  image?: string | null;
  imageAlt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export const mapContinent = (doc: any): Continent => ({
  _id: mapId(doc?._id),
  name: doc.name,
  slug: doc.slug,
  description: doc.description ?? null,
  products: (doc.products ?? []).map((x: any) => mapId(x)!).filter(Boolean),
  parent: mapId(doc.parent) ?? null,
  children: (doc.children ?? []).map((x: any) => mapId(x)!).filter(Boolean),
  isActive: Boolean(doc.isActive),
  order: doc.order,
  image: doc.image ?? null,
  imageAlt: doc.imageAlt ?? null,
  seoTitle: doc.seoTitle ?? null,
  seoDescription: doc.seoDescription ?? null,
  seoKeywords: doc.seoKeywords ?? null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const mapContinentViewModel = (doc: any, productDocs?: ProductDb[]): ContinentViewModel => ({
  ...mapContinent(doc),
  productObjects: (productDocs ?? []).map(mapProduct),
});

export const mapCreateContinentRequestToDb = (body: CreateContinentRequest): ContinentDb => ({
  name: body.name,
  slug: body.slug,
  description: body.description ?? null,
  products: toObjectIdArray(body.products),
  parent: toObjectId(body.parent),
  children: toObjectIdArray(body.children),
  isActive: body.isActive ?? true,
  order: body.order,
  image: body.image ?? null,
  imageAlt: body.imageAlt ?? null,
  seoTitle: body.seoTitle ?? null,
  seoDescription: body.seoDescription ?? null,
  seoKeywords: body.seoKeywords ?? null,
  createdAt: new Date(),
  updatedAt: new Date(),
});
