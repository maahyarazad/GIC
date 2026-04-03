import { Schema, model, models, Types } from "mongoose";

export interface ContinentDocument {
  name: string;
  slug: string;
  description?: string | null;
  products?: Types.ObjectId[] | null;
  parent: Types.ObjectId | null;
  children: Types.ObjectId[] | null;
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

const ContinentSchema = new Schema<ContinentDocument>(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, default: null },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    parent: { type: Schema.Types.ObjectId, ref: "Continent", default: null },
    children: [{ type: Schema.Types.ObjectId, ref: "Continent" }],
    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
    image: { type: String, default: null },
    imageAlt: { type: String, default: null },
    seoTitle: { type: String, default: null },
    seoDescription: { type: String, default: null },
    seoKeywords: { type: [String], default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const ContinentModel = models.Continent || model<ContinentDocument>("Continent", ContinentSchema);
