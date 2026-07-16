import { ObjectId } from "mongodb";
import { Product, CreateProductRequest, ProductImportance } from "../types/product.types";
import { mapId, toObjectId, toObjectIdArray } from "./objectId.mapper";

export interface ProductDb {
  _id?: ObjectId;
  fileId: string;
  name: string;
  code: string;
  productVersion?: string | null;
  fileUpload_timeStamp?: number | null;
  content: Product["content"];
  variant: Product["variant"];
  media: Product["media"];
  tags: string[] | null;
  downloadCount: number;
  importance: ProductImportance;
  parent?: ObjectId | null;
  children: ObjectId[] | null;
  recommended: ObjectId[] | null;
  createdAt?: Date;
  updatedAt?: Date;
}

//@ts-ignore
export const mapProduct = (doc: any): Product => ({
  _id: mapId(doc?._id),
  fileId: doc.fileId,
  name: doc.name,
  slug: doc.slug,
  code: doc.code,
  productVersion: doc.productVersion ?? null,
  fileUpload_timeStamp: doc.fileUpload_timeStamp ?? null,
  subRegion: doc.subRegion,
  content: doc.content ?? null,
  variant: doc.variant ?? null,
  media: doc.media ?? null,
  tags: doc.tags ?? null,
  downloadCount: doc.downloadCount ?? 0,
  importance: doc.importance,
  parent: mapId(doc.parent) ?? null,
  children: (doc.children ?? []).map((x: any) => mapId(x)!).filter(Boolean),
  recommended: (doc.recommended ?? []).map((x: any) => mapId(x)!).filter(Boolean),
  metadata: doc.metadata ?? null,
  sourceFiles: doc.sourceFiles ?? null,
  sourceSheets: doc.sourceSheets ?? null,
  isActive: doc.isActive,
  order: doc.order,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const mapProducts = (docs: any[] = []): Product[] => docs.map(mapProduct);

export const mapCreateProductRequestToDb = (body: CreateProductRequest): ProductDb => ({
  fileId: body.fileId,
  name: body.name,
  code: body.code,
  productVersion: body.productVersion ?? null,
  fileUpload_timeStamp: body.fileUpload_timeStamp ?? null,
  content: body.content ?? null,
  variant: body.variant ?? null,
  media: body.media ?? null,
  tags: body.tags ?? null,
  downloadCount: body.downloadCount ?? 0,
  importance: body.importance,
  parent: toObjectId(body.parent),
  children: toObjectIdArray(body.children),
  recommended: toObjectIdArray(body.recommended),
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const mapUpdateProductRequestToDb = (body: Partial<CreateProductRequest>): Partial<ProductDb> => ({
  ...(body.fileId !== undefined ? { fileId: body.fileId } : {}),
  ...(body.name !== undefined ? { name: body.name } : {}),
  ...(body.code !== undefined ? { code: body.code } : {}),
  ...(body.productVersion !== undefined
    ? { productVersion: body.productVersion ?? null }
    : {}),
  ...(body.fileUpload_timeStamp !== undefined
    ? { fileUpload_timeStamp: body.fileUpload_timeStamp ?? null }
    : {}),
  ...(body.content !== undefined ? { content: body.content ?? null } : {}),
  ...(body.variant !== undefined ? { variant: body.variant ?? null } : {}),
  ...(body.media !== undefined ? { media: body.media ?? null } : {}),
  ...(body.tags !== undefined ? { tags: body.tags ?? null } : {}),
  ...(body.downloadCount !== undefined ? { downloadCount: body.downloadCount } : {}),
  ...(body.importance !== undefined ? { importance: body.importance } : {}),
  ...(body.parent !== undefined ? { parent: toObjectId(body.parent) } : {}),
  ...(body.children !== undefined ? { children: toObjectIdArray(body.children) } : {}),
  ...(body.recommended !== undefined ? { recommended: toObjectIdArray(body.recommended) } : {}),
  updatedAt: new Date(),
});
