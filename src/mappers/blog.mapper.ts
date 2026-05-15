import slugify from "slugify";
import { Blog, BlogComment, CreateBlogRequest } from "../types/blog.types";
import { mapId } from "./objectId.mapper";

export const mapComment = (doc: any): BlogComment => ({
  _id: mapId(doc?._id),
  body: doc.body,
  authorName: doc.authorName,
  authorEmail: doc.authorEmail,
  approved: doc.approved,
  createdAt: doc.createdAt,
});

export const mapBlog = (doc: any): Blog => ({
  _id: mapId(doc?._id),
  title: doc.title,
  slug: doc.slug,
  content: doc.content,
  excerpt: doc.excerpt ?? null,
  authorName: doc.authorName,
  coverImage: doc.coverImage ?? null,
  tags: doc.tags ?? null,
  published: doc.published,
  comments: (doc.comments ?? []).map(mapComment),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const mapBlogs = (docs: any[] = []): Blog[] => docs.map(mapBlog);

export const makeSlug = (title: string): string =>
  slugify(title, { lower: true, strict: true });

export const mapCreateBlogRequestToDb = (body: CreateBlogRequest) => ({
  title: body.title,
  slug: makeSlug(body.title),
  content: body.content,
  excerpt: body.excerpt ?? null,
  authorName: body.authorName,
  coverImage: body.coverImage ?? null,
  tags: body.tags ?? null,
  published: body.published ?? false,
  comments: [],
});

export const mapUpdateBlogRequestToDb = (body: Partial<CreateBlogRequest>) => ({
  ...(body.title !== undefined ? { title: body.title, slug: makeSlug(body.title) } : {}),
  ...(body.content !== undefined ? { content: body.content } : {}),
  ...(body.excerpt !== undefined ? { excerpt: body.excerpt ?? null } : {}),
  ...(body.authorName !== undefined ? { authorName: body.authorName } : {}),
  ...(body.coverImage !== undefined ? { coverImage: body.coverImage ?? null } : {}),
  ...(body.tags !== undefined ? { tags: body.tags ?? null } : {}),
  ...(body.published !== undefined ? { published: body.published } : {}),
  updatedAt: new Date(),
});
