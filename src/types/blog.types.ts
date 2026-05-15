import { BaseModel } from "./base.types";

export interface BlogComment {
  _id?: string;
  body: string;
  authorName: string;
  authorEmail: string;
  approved: boolean;
  createdAt?: Date;
}

export interface Blog extends BaseModel {
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  authorName: string;
  coverImage?: string | null;
  tags?: string[] | null;
  published: boolean;
  comments: BlogComment[];
}

export interface CreateBlogRequest {
  title: string;
  content: string;
  authorName: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  published?: boolean;
}

export interface UpdateBlogRequest extends Partial<CreateBlogRequest> {}

export interface CreateCommentRequest {
  body: string;
  authorName: string;
  authorEmail: string;
}

export interface ApproveCommentRequest {
  approved: boolean;
}
