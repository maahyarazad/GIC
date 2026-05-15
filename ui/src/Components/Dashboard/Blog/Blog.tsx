import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/api/axiosInstance";
import { useToast } from "@/Providers/ToastContext";
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import Loader from "@/Components/Loader/Loader";
import { Blog as BlogType, BlogComment } from "../../../../../src/types/blog.types";
import "./Blog.css";

type View = "list" | "form" | "comments";

interface BlogForm {
  title: string;
  authorName: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string;
  published: boolean;
}

const emptyForm: BlogForm = {
  title: "",
  authorName: "",
  excerpt: "",
  content: "",
  coverImage: "",
  tags: "",
  published: false,
};

const Blog: React.FC = () => {
  const { show } = useToast();
  const { confirm } = useConfirm();

  const [view, setView] = useState<View>("list");
  const [blogs, setBlogs] = useState<BlogType[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [editingBlog, setEditingBlog] = useState<BlogType | null>(null);
  const [form, setForm] = useState<BlogForm>(emptyForm);

  const [selectedBlog, setSelectedBlog] = useState<BlogType | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/blogs");
      setBlogs(res.data.blogs ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      show({ type: "error", message: "Failed to fetch blogs" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const openCreate = () => {
    setEditingBlog(null);
    setForm(emptyForm);
    setView("form");
  };

  const openEdit = (blog: BlogType) => {
    setEditingBlog(blog);
    setForm({
      title: blog.title,
      authorName: blog.authorName,
      excerpt: blog.excerpt ?? "",
      content: blog.content,
      coverImage: blog.coverImage ?? "",
      tags: (blog.tags ?? []).join(", "),
      published: blog.published,
    });
    setView("form");
  };

  const openComments = async (blog: BlogType) => {
    setSelectedBlog(blog);
    setView("comments");
    setCommentsLoading(true);
    try {
      const res = await axiosInstance.get(`/blogs/${blog._id}/comments`);
      setComments(res.data.data?.comments ?? []);
    } catch {
      show({ type: "error", message: "Failed to fetch comments" });
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDelete = async (blog: BlogType) => {
    const ok = await confirm({
      title: "Delete Blog",
      message: `Are you sure you want to delete "${blog.title}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!ok) return;

    try {
      await axiosInstance.delete(`/blogs/${blog._id}`);
      show({ type: "success", message: "Blog deleted" });
      fetchBlogs();
    } catch {
      show({ type: "error", message: "Failed to delete blog" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title: form.title.trim(),
      authorName: form.authorName.trim(),
      excerpt: form.excerpt.trim() || undefined,
      content: form.content.trim(),
      coverImage: form.coverImage.trim() || undefined,
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : undefined,
      published: form.published,
    };

    try {
      if (editingBlog) {
        await axiosInstance.put(`/blogs/${editingBlog._id}`, payload);
        show({ type: "success", message: "Blog updated" });
      } else {
        await axiosInstance.post("/blogs", payload);
        show({ type: "success", message: "Blog created" });
      }
      setView("list");
      fetchBlogs();
    } catch {
      show({
        type: "error",
        message: editingBlog ? "Failed to update blog" : "Failed to create blog",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (comment: BlogComment, approved: boolean) => {
    try {
      const res = await axiosInstance.put(
        `/blogs/${selectedBlog?._id}/comments/${comment._id}/approve`,
        { approved }
      );
      const updated: BlogComment = res.data.data?.comment;
      setComments((prev) =>
        prev.map((c) => (c._id === comment._id ? { ...c, approved: updated.approved } : c))
      );
      show({ type: "success", message: approved ? "Comment approved" : "Comment rejected" });
    } catch {
      show({ type: "error", message: "Failed to update comment" });
    }
  };

  const handleField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.type === "checkbox" ? target.checked : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

  /* ── Form view ── */
  if (view === "form") {
    return (
      <div className="blog-section">
        <div className="blog-header">
          <h3>{editingBlog ? "Edit Blog" : "New Blog"}</h3>
          <button className="blog-btn-back" onClick={() => setView("list")}>
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="blog-form">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Title *</label>
              <input
                name="title"
                className="form-control"
                value={form.title}
                onChange={handleField}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Author Name *</label>
              <input
                name="authorName"
                className="form-control"
                value={form.authorName}
                onChange={handleField}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label">Excerpt</label>
              <input
                name="excerpt"
                className="form-control"
                value={form.excerpt}
                onChange={handleField}
                placeholder="Short description shown in listings"
              />
            </div>

            <div className="col-12">
              <label className="form-label">Content *</label>
              <textarea
                name="content"
                className="form-control"
                value={form.content}
                onChange={handleField}
                required
                rows={12}
              />
            </div>

            <div className="col-md-8">
              <label className="form-label">Cover Image URL</label>
              <input
                name="coverImage"
                className="form-control"
                value={form.coverImage}
                onChange={handleField}
                placeholder="https://..."
              />
            </div>

            <div className="col-md-4">
              <label className="form-label">Tags</label>
              <input
                name="tags"
                className="form-control"
                value={form.tags}
                onChange={handleField}
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div className="col-12">
              <div className="form-check">
                <input
                  id="published"
                  name="published"
                  type="checkbox"
                  className="form-check-input"
                  checked={form.published}
                  onChange={handleField}
                />
                <label htmlFor="published" className="form-check-label">
                  Published
                </label>
              </div>
            </div>

            <div className="col-12 blog-form-actions">
              <button
                type="button"
                className="blog-btn-back"
                onClick={() => setView("list")}
              >
                Cancel
              </button>
              <button type="submit" className="dashboard-btn" disabled={submitting}>
                {submitting ? "Saving…" : editingBlog ? "Save Changes" : "Create Blog"}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  /* ── Comments view ── */
  if (view === "comments" && selectedBlog) {
    const pending = comments.filter((c) => !c.approved);
    const approved = comments.filter((c) => c.approved);

    return (
      <div className="blog-section">
        <div className="blog-header">
          <h3>{selectedBlog.title}</h3>
          <button className="blog-btn-back" onClick={() => setView("list")}>
            ← Back to Blogs
          </button>
        </div>

        {commentsLoading ? (
          <Loader />
        ) : comments.length === 0 ? (
          <p className="blog-empty-comments">No comments yet.</p>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="mb-4">
                <p className="blog-comments-section-label">
                  Pending Approval ({pending.length})
                </p>
                <div className="blog-comments-list">
                  {pending.map((c) => (
                    <div key={c._id} className="blog-comment-card pending">
                      <div className="blog-comment-meta">
                        <span className="blog-comment-author">{c.authorName}</span>
                        <span className="blog-comment-email">{c.authorEmail}</span>
                        <span className="blog-badge blog-badge--pending">Pending</span>
                        {c.createdAt && (
                          <span className="blog-comment-date">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="blog-comment-body">{c.body}</p>
                      <div className="blog-comment-actions">
                        <button
                          className="blog-btn-approve"
                          onClick={() => handleApprove(c, true)}
                        >
                          Approve
                        </button>
                        <button
                          className="dashboard-btn--delete-ghost"
                          onClick={() => handleApprove(c, false)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {approved.length > 0 && (
              <div>
                <p className="blog-comments-section-label">
                  Approved ({approved.length})
                </p>
                <div className="blog-comments-list">
                  {approved.map((c) => (
                    <div key={c._id} className="blog-comment-card approved">
                      <div className="blog-comment-meta">
                        <span className="blog-comment-author">{c.authorName}</span>
                        <span className="blog-comment-email">{c.authorEmail}</span>
                        <span className="blog-badge blog-badge--approved">Approved</span>
                        {c.createdAt && (
                          <span className="blog-comment-date">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="blog-comment-body">{c.body}</p>
                      <div className="blog-comment-actions">
                        <button
                          className="blog-btn-revoke"
                          onClick={() => handleApprove(c, false)}
                        >
                          Revoke Approval
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  /* ── List view ── */
  return (
    <div className="blog-section">
      <div className="blog-header">
        <h3>
          Blog
          {total > 0 && <span className="blog-header-count">({total})</span>}
        </h3>
        <button className="dashboard-btn" onClick={openCreate}>
          + New Blog
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : blogs.length === 0 ? (
        <div className="blog-empty">
          <p>No blog posts yet.</p>
          <button className="dashboard-btn" onClick={openCreate}>
            Create the first post
          </button>
        </div>
      ) : (
        <div className="blog-table-wrapper">
          <table className="blog-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Tags</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog._id}>
                  <td className="blog-title-cell">{blog.title}</td>
                  <td>{blog.authorName}</td>
                  <td>
                    {blog.published ? (
                      <span className="blog-badge blog-badge--published">Published</span>
                    ) : (
                      <span className="blog-badge blog-badge--draft">Draft</span>
                    )}
                  </td>
                  <td>
                    {(blog.tags ?? []).slice(0, 3).map((t) => (
                      <span key={t} className="blog-tag-chip">{t}</span>
                    ))}
                  </td>
                  <td className="blog-date-cell">
                    {blog.createdAt
                      ? new Date(blog.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <div className="blog-row-actions">
                      <button
                        className="dashboard-btn--ghost-minimal"
                        onClick={() => openEdit(blog)}
                      >
                        Edit
                      </button>
                      <button
                        className="dashboard-btn--ghost-minimal"
                        onClick={() => openComments(blog)}
                      >
                        Comments
                      </button>
                      <button
                        className="dashboard-btn--delete-ghost"
                        onClick={() => handleDelete(blog)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Blog;
