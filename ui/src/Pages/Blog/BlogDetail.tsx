import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import DOMPurify from "dompurify";
import { usePage } from "@/Providers/PageContext";
import { useToast } from "@/Providers/ToastContext";
import Loader from "@/Components/Loader/Loader";
import { Blog, BlogComment } from "../../../../src/types/blog.types";
import { getBlogBySlug, submitComment } from "@/api/blog";
import "./BlogDetail.css";

interface CommentForm {
  body: string;
}

const emptyForm: CommentForm = { body: "" };

const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { activePage } = usePage();
  const { show } = useToast();
  const navigate = useNavigate();
  const user = useSelector((state: any) => state.auth.user);

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<CommentForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchBlog = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const res = await getBlogBySlug(slug);
      if (res.data?.blog) {
        setBlog(res.data.blog);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchBlog();
  }, [fetchBlog]);

  /* ── SEO: dynamic title + meta tags ── */
  useEffect(() => {
    if (!blog) return;

    const prevTitle = document.title;
    document.title = `${blog.title} | German Industry Club`;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const setOG = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const description = blog.excerpt ?? `${blog.content.slice(0, 160).trim()}…`;

    setMeta("description", description);
    setMeta("author", blog.authorName);
    setOG("og:title", blog.title);
    setOG("og:description", description);
    setOG("og:type", "article");
    setOG("og:url", window.location.href);
    if (blog.coverImage) setOG("og:image", blog.coverImage);

    return () => {
      document.title = prevTitle;
    };
  }, [blog]);

  const handleField = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blog?._id) return;
    setSubmitting(true);
    try {
      await submitComment(String(blog._id), {
        authorName: user?.name ?? "",
        authorEmail: user?.email ?? "",
        body: form.body.trim(),
      });
      setForm(emptyForm);
      setSubmitted(true);
      show({ type: "success", message: "Comment submitted and pending approval." });
    } catch {
      show({ type: "error", message: "Failed to submit comment." });
    } finally {
      setSubmitting(false);
    }
  };



  /* ── States ── */
  if (loading) {
    return (
      <div className="bd-loading">
        <Loader />
      </div>
    );
  }

  if (notFound || !blog) {
    return (
      <div className="bd-not-found">
        <h2>Post not found</h2>
        <p>This blog post does not exist or has been removed.</p>
        <button className="bd-back-btn" onClick={() => navigate("/blog")}>
          ← Back to Blog
        </button>
      </div>
    );
  }

  const approvedComments = (blog.comments ?? []).filter((c: BlogComment) => c.approved);

  return (
    <div id="page-blog-detail" className={`page ${activePage === `/blog/${slug}` ? "active" : ""}`}>
      <div className="ptnav" />

      {/* Hero / Cover */}
      <header className="bd-hero" style={blog.coverImage ? { backgroundImage: `url("${blog.coverImage}")` } : {}}>
        <div className={`bd-hero-overlay${blog.coverImage ? " bd-hero-overlay--img" : ""}`}>
          <div className="bd-hero-inner">
            <button className="bd-back-btn" onClick={() => navigate("/blog")}>
              ← Blog
            </button>

            {blog.tags && blog.tags.length > 0 && (
              <div className="bd-tags">
                {blog.tags.map((t: string) => (
                  <span key={t} className="bd-tag">{t}</span>
                ))}
              </div>
            )}

            <h1 className="bd-title">{blog.title}</h1>

            <div className="bd-meta">
              <span className="bd-author">{blog.authorName}</span>
              {blog.createdAt && (
                <span className="bd-date">
                  {new Date(blog.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Article body */}
      <main className="bd-body">
        <div className="bd-content">
          {blog.excerpt && <p className="bd-excerpt">{blog.excerpt}</p>}
          <div
            className="bd-text bd-html-content"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(blog.content, { USE_PROFILES: { html: true } }),
            }}
          />
        </div>

        {/* Comments */}
        <aside className="bd-comments">
          <div className="bd-comments-header">
            <span className="bd-section-label">
              Comments
              {approvedComments.length > 0 && (
                <span className="bd-comments-count"> ({approvedComments.length})</span>
              )}
            </span>
          </div>

          {approvedComments.length === 0 ? (
            <p className="bd-no-comments">No comments yet. Be the first to share your thoughts.</p>
          ) : (
            <div className="bd-comments-list">
              {approvedComments.map((c: BlogComment) => (
                <div key={String(c._id)} className="bd-comment">
                  <div className="bd-comment-meta">
                    <span className="bd-comment-author">{c.authorName}</span>
                    {c.createdAt && (
                      <span className="bd-comment-date">
                        {new Date(c.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="bd-comment-body">{c.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Comment form */}
          <div className="bd-comment-form-wrap">
            <span className="bd-section-label">Leave a Comment</span>
            {submitted ? (
              <p className="bd-submitted-msg">
                Thank you — your comment is pending approval.
              </p>
            ) : (
              <form className="bd-comment-form" onSubmit={handleSubmitComment}>
                <div className="bd-form-group">
                  <label className="bd-form-label">Comment *</label>
                  <textarea
                    name="body"
                    className="bd-form-input bd-form-textarea"
                    value={form.body}
                    onChange={handleField}
                    required
                    rows={5}
                    placeholder="Share your thoughts…"
                  />
                </div>
                <div className="bd-form-footer">
                  <p className="bd-form-note">
                    Comments are reviewed before publication.
                  </p>
                  <button type="submit" className="bd-submit-btn" disabled={submitting}>
                    {submitting ? "Submitting…" : "Submit Comment"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
};

export default BlogDetail;
