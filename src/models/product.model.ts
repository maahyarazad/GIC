import { Schema, model, models, Types } from "mongoose";
import { ProductImportance, ProductContent, ProductVariant, ProductMedia } from "../types/product.types";

export interface ProductDocument {
  fileId: string;
  name: string;
  code: string;
  productVersion?: string | null;
  fileUpload_timeStamp?: number | null;
  content: ProductContent | null;
  variant: ProductVariant | null;
  media: ProductMedia | null;
  tags: string[] | null;
  downloadCount: number;
  importance: ProductImportance;
  parent?: Types.ObjectId | null;
  children: Types.ObjectId[] | null;
  recommended: Types.ObjectId[] | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductContentSchema = new Schema<ProductContent>(
  {
    description: { type: String, default: null },
    shortDescription: { type: String, default: null },
    highlights: { type: [String], default: null },
    features: { type: [String], default: null },
  },
  { _id: false }
);

const ProductVariantSchema = new Schema<ProductVariant>(
  {
    variantName: { type: String, default: null },
    variantValue: { type: String, default: null },
  },
  { _id: false }
);

const ProductMediaSchema = new Schema<ProductMedia>(
  {
    images: { type: [String], default: null },
    imageAlt: { type: String, default: null },
    video: { type: String, default: null },
    seoTitle: { type: String, default: null },
    seoDescription: { type: String, default: null },
    seoKeywords: { type: [String], default: null },
  },
  { _id: false }
);

const ProductSchema = new Schema<ProductDocument>(
  {
    fileId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, trim: true, unique: true, index: true },
    productVersion: { type: String, default: null },
    fileUpload_timeStamp: { type: Number, default: null },
    content: { type: ProductContentSchema, default: null },
    variant: { type: ProductVariantSchema, default: null },
    media: { type: ProductMediaSchema, default: null },
    tags: { type: [String], default: null },
    downloadCount: { type: Number, default: 0, min: 0 },
    importance: {
      type: String,
      enum: ["A", "B", "C", "D"],
      required: true,
      default: "D",
      index: true,
    },
    parent: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    children: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    recommended: [{ type: Schema.Types.ObjectId, ref: "Product" }],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ProductModel = models.Product || model<ProductDocument>("Product", ProductSchema);
