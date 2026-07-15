import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from "react";
import axiosInstance from "@/api/axiosInstance";
import { useToast } from "@/Providers/ToastContext";
import { useConfirm } from "@/Providers/ConfirmDialogProvider";
import { useModal } from "@/Providers/ModalContext";
import Loader from "@/Components/Loader/Loader";
import { GenericDataGrid, Column, PaginationModel } from "@/Components/GenericDataGrid/GenericDataGrid";
import type { NewsletterArticle } from "../../../../../src/types/newsletterArticle.types";
import "./Newsletter.css";

const QuillEditor = lazy(() => import("@/Components/QuillEditor/QuillEditor"));

type View = "list" | "form";

interface ArticleForm {
  title: string;
  subject: string;
  html: string;
}

const emptyForm: ArticleForm = {
  title: "",
  subject: "",
  html: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Small controlled input for the "Send Test Email" modal. Writes to a ref the parent reads on confirm. */
const TestEmailInput: React.FC<{
  emailRef: React.MutableRefObject<string>;
  onValidityChange: (valid: boolean) => void;
}> = ({ emailRef, onValidityChange }) => {
  const [value, setValue] = useState("");
  return (
    <div className="newsletter-test-modal">
      <label className="form-label">Test recipient email</label>
      <input
        type="email"
        className="form-control"
        value={value}
        placeholder="you@example.com"
        onChange={(e) => {
          setValue(e.target.value);
          emailRef.current = e.target.value.trim();
          onValidityChange(EMAIL_RE.test(e.target.value.trim()));
        }}
      />
    </div>
  );
};

const Newsletter: React.FC = () => {
  const { show } = useToast();
  const { confirm } = useConfirm();
  const { openModal, setModalDisabled } = useModal();

  const [view, setView] = useState<View>("list");
  const [articles, setArticles] = useState<NewsletterArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const [editingArticle, setEditingArticle] = useState<NewsletterArticle | null>(null);
  const [form, setForm] = useState<ArticleForm>(emptyForm);
  const [paginationModel, setPaginationModel] = useState<PaginationModel>({ page: 1, pageSize: 10 });

  const testEmailRef = useRef<string>("");

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/newsletter-articles");
      setArticles(res.data.data ?? []);
    } catch {
      show({ type: "error", message: "Failed to fetch newsletter articles" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const openCreate = () => {
    setEditingArticle(null);
    setForm(emptyForm);
    setView("form");
  };

  const openEdit = (article: NewsletterArticle) => {
    setEditingArticle(article);
    setForm({ title: article.title, subject: article.subject, html: article.html });
    setView("form");
  };

  const handleField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await axiosInstance.post("/files", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const { fileId, extension } = res.data.data;
    return `/uploads/${fileId}.${extension}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.subject.trim()) {
      show({ type: "error", message: "Title and subject are required." });
      return;
    }
    if (!form.html || form.html === "<p><br></p>") {
      show({ type: "error", message: "Content cannot be empty." });
      return;
    }
    setSubmitting(true);

    const payload = {
      title: form.title.trim(),
      subject: form.subject.trim(),
      html: form.html,
    };

    try {
      if (editingArticle) {
        await axiosInstance.put(`/newsletter-articles/${editingArticle._id}`, payload);
        show({ type: "success", message: "Newsletter article updated" });
      } else {
        await axiosInstance.post("/newsletter-articles", payload);
        show({ type: "success", message: "Newsletter article created" });
      }
      setView("list");
      fetchArticles();
    } catch {
      show({
        type: "error",
        message: editingArticle ? "Failed to update article" : "Failed to create article",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (article: NewsletterArticle) => {
    const ok = await confirm({
      title: "Delete Newsletter Article",
      message: `Are you sure you want to delete "${article.title}"? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!ok) return;

    try {
      await axiosInstance.delete(`/newsletter-articles/${article._id}`);
      show({ type: "success", message: "Article deleted" });
      fetchArticles();
    } catch {
      show({ type: "error", message: "Failed to delete article" });
    }
  };

  const handlePreview = (article: NewsletterArticle) => {
    openModal({
      variant: "default",
      title: article.subject || article.title,
      content: (
        <div
          className="newsletter-preview"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      ),
      cancelText: "Close",
    });
  };

  const handleSendTest = (article: NewsletterArticle) => {
    testEmailRef.current = "";
    openModal({
      variant: "default",
      title: `Send Test Email — ${article.title}`,
      content: (
        <TestEmailInput
          emailRef={testEmailRef}
          onValidityChange={(valid) => setModalDisabled(!valid)}
        />
      ),
      confirmText: "Send Test",
      disabled: true,
      onConfirm: async () => {
        const email = testEmailRef.current;
        if (!EMAIL_RE.test(email)) return;
        try {
          const res = await axiosInstance.post(
            `/newsletter-articles/${article._id}/send-test`,
            { email }
          );
          if (res.data.success) {
            show({ type: "success", message: res.data.message || "Test email sent" });
          }
        } catch (err: any) {
          show({ type: "error", message: err.message || "Failed to send test email" });
        }
      },
    });
  };

  const handleSendToSubscribers = async (article: NewsletterArticle) => {
    const ok = await confirm({
      title: "Send to Subscribers",
      message: `Send "${article.title}" to all active subscribers?`,
      confirmText: "Send",
      cancelText: "Cancel",
    });
    if (!ok) return;

    try {
      setSendingId(article._id ?? null);
      const res = await axiosInstance.post(`/newsletter-articles/${article._id}/send`);
      if (res.data.success) {
        show({ type: "success", message: res.data.message || "Newsletter sent" });
        fetchArticles();
      } else {
        show({ type: "error", message: res.data.message || "Failed to send newsletter" });
      }
    } catch (err: any) {
      show({ type: "error", message: err.message || "Failed to send newsletter" });
    } finally {
      setSendingId(null);
    }
  };

  /* ── Form view ── */
  if (view === "form") {
    return (
      <div className="newsletter-section">
        <div className="newsletter-header">
          <h3>{editingArticle ? "Edit Newsletter Article" : "New Newsletter Article"}</h3>
          <button className="newsletter-btn-back" onClick={() => setView("list")}>
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="newsletter-form">
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
              <label className="form-label">Email Subject *</label>
              <input
                name="subject"
                className="form-control"
                value={form.subject}
                onChange={handleField}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label">Content *</label>
              <Suspense fallback={<Loader />}>
                <QuillEditor
                  value={form.html}
                  onChange={(html) => setForm((prev) => ({ ...prev, html }))}
                  onImageUpload={handleImageUpload}
                />
              </Suspense>
            </div>

            <div className="col-12 newsletter-form-actions">
              <button type="button" className="newsletter-btn-back" onClick={() => setView("list")}>
                Cancel
              </button>
              <button type="submit" className="dashboard-btn" disabled={submitting}>
                {submitting ? "Saving…" : editingArticle ? "Save Changes" : "Create Article"}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  /* ── List view ── */
  const start = (paginationModel.page - 1) * paginationModel.pageSize;
  const pageArticles = articles.slice(start, start + paginationModel.pageSize);

  const columns: Column<NewsletterArticle>[] = [
    {
      headerName: "Title",
      field: "title",
      width: "24%",
      sortable: true,
      filterable: true,
      renderCell: (a) => (
        <span className="newsletter-title-cell" title={a.title}>{a.title}</span>
      ),
    },
    {
      headerName: "Subject",
      field: "subject",
      width: "22%",
      renderCell: (a) => <span title={a.subject}>{a.subject}</span>,
    },
    {
      headerName: "Sent Date",
      field: "sentAt",
      width: "16%",
      sortable: true,
      renderCell: (a) =>
        a.sentAt ? (
          <span className="newsletter-badge newsletter-badge--sent">
            {new Date(a.sentAt).toLocaleString()}
          </span>
        ) : (
          <span className="newsletter-badge newsletter-badge--draft">Not sent</span>
        ),
    },
    {
      headerName: "Created",
      field: "createdAt",
      width: "10%",
      sortable: true,
      renderCell: (a) =>
        a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—",
    },
    {
      headerName: "Actions",
      width: "28%",
      renderCell: (a) => (
        <div className="newsletter-row-actions">
          <button className="dashboard-btn--ghost-minimal" onClick={() => handlePreview(a)}>
            Preview
          </button>
          <button className="dashboard-btn--ghost-minimal" onClick={() => openEdit(a)}>
            Edit
          </button>
          <button className="dashboard-btn--ghost-minimal" onClick={() => handleSendTest(a)}>
            Send Test
          </button>
          <button
            className="dashboard-btn"
            disabled={sendingId === a._id}
            onClick={() => handleSendToSubscribers(a)}
          >
            {sendingId === a._id ? "Sending…" : "Send to Subscribers"}
          </button>
          <button className="dashboard-btn--delete-ghost" onClick={() => handleDelete(a)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="newsletter-section">
      <div className="newsletter-header">
        <h3>
          Newsletter
          {articles.length > 0 && (
            <span className="newsletter-header-count">({articles.length})</span>
          )}
        </h3>
        <button className="dashboard-btn" onClick={openCreate}>
          + New Article
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : articles.length === 0 ? (
        <div className="newsletter-empty">
          <p>No newsletter articles yet.</p>
          <button className="dashboard-btn" onClick={openCreate}>
            Create the first article
          </button>
        </div>
      ) : (
        <GenericDataGrid<NewsletterArticle>
          rows={pageArticles}
          columns={columns}
          rowCount={articles.length}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          prevButtonClassName="dashboard-btn--ghost-minimal"
          nextButtonClassName="dashboard-btn--ghost-minimal"
          getRowId={(a) => String(a._id)}
        />
      )}
    </div>
  );
};

export default Newsletter;
