import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePage } from "@/Providers/PageContext";
import { useToast } from "@/Providers/ToastContext";
import Loader from "@/Components/Loader/Loader";
import { Blog } from "../../../../src/types/blog.types";
import {getPublishedBlogs} from "@/api/blog";
import "./BlogPosts.css";

const PAGE_SIZE = 12;

const BlogPosts: React.FC = () => {
  const { activePage } = usePage();
  const { show } = useToast();
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);
      
      const res = await getPublishedBlogs(page, PAGE_SIZE);
      setBlogs(res.data?.blogs ?? []);
      setTotal(res.data?.total ?? 0);
    } catch {
      show({ type: "error", message: "Failed to load blog posts" });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div id="page-blog" className={`page ${activePage === "/blog" ? "active" : ""}`}>
      <div className="ptnav" />

      <section className="bp-hero">
        <div className="bp-hero-inner">
          <span className="bp-slbl">Insights & Analysis</span>
          <h1 className="bp-title">Blog</h1>
          <p className="bp-sub">
            Perspectives on industry, investment, and economic intelligence across MEA.
          </p>
        </div>
      </section>

      <section className="bp-content">
        {loading ? (
          <div className="bp-loader">
            <Loader />
          </div>
        ) : blogs.length === 0 ? (
          <div className="bp-empty">
            <p>No blog posts published yet.</p>
          </div>
        ) : (
          <>
            <div className="bp-grid">
              {blogs.map((blog) => (
                <article
                  key={String(blog._id)}
                  className="bp-card"
                  onClick={() => navigate(`/blog/${blog.slug}`)}
                >
                  {blog.coverImage ? (
                    <div
                      className="bp-card-img"
                      style={{ backgroundImage: `url("${blog.coverImage}")` }}
                    />
                  ) : (
                    <div className="bp-card-img bp-card-img--placeholder" />
                  )}

                  <div className="bp-card-body">
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="bp-card-tags">
                        {blog.tags.slice(0, 3).map((t: string) => (
                          <span key={t} className="bp-tag">{t}</span>
                        ))}
                      </div>
                    )}

                    <h2 className="bp-card-title">{blog.title}</h2>

                    {blog.excerpt && (
                      <p className="bp-card-excerpt">{blog.excerpt}</p>
                    )}

                    <div className="bp-card-meta">
                      <span className="bp-card-author">{blog.authorName}</span>
                      {blog.createdAt && (
                        <span className="bp-card-date">
                          {new Date(blog.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="bp-pagination">
                <button
                  className="bp-page-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Previous
                </button>
                <span className="bp-page-info">{page} / {totalPages}</span>
                <button
                  className="bp-page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default BlogPosts;
