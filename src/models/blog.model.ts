import { Schema, model, models } from "mongoose";

export interface CommentDocument {
  body: string;
  authorName: string;
  authorEmail: string;
  approved: boolean;
  createdAt: Date;
}

export interface BlogDocument {
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  authorName: string;
  coverImage: string | null;
  tags: string[] | null;
  published: boolean;
  comments: CommentDocument[];
  createdAt?: Date;
  updatedAt?: Date;
}

const CommentSchema = new Schema<CommentDocument>(
  {
    body: { type: String, required: true, trim: true },
    authorName: { type: String, required: true, trim: true },
    authorEmail: { type: String, required: true, trim: true },
    approved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true, versionKey: false }
);

const BlogSchema = new Schema<BlogDocument>(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    content: { type: String, required: true },
    excerpt: { type: String, default: null },
    authorName: { type: String, required: true, trim: true },
    coverImage: { type: String, default: null },
    tags: { type: [String], default: null },
    published: { type: Boolean, default: false, index: true },
    comments: { type: [CommentSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

export const BlogModel = models.Blog || model<BlogDocument>("Blog", BlogSchema);
