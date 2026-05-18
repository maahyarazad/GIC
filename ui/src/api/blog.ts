import axiosInstance from './axiosInstance';
import { CreateCommentRequest } from '../../../src/types/blog.types';

export async function getPublishedBlogs(page = 1, limit = 12) {
  const skip = (page - 1) * limit;
  const res = await axiosInstance.post('/blogs/published', { params: { limit, skip } });
  return res.data;
}

export async function getBlogBySlug(slug: string) {
  const res = await axiosInstance.get(`/blogs/by-slug/${slug}`);
  return res.data;
}

export async function submitComment(blogId: string, data: CreateCommentRequest) {
  const res = await axiosInstance.post(`/blogs/${blogId}/comments`, data);
  return res.data;
}
