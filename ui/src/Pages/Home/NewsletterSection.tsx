import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import Loader from "@/Components/Loader/Loader";
import { getNewsletterTeasers } from "@/api/newsletterPublic";
import type { NewsletterTeaser } from "../../../../src/types/newsletterArticle.types";
import "./NewsletterSection.css";

export interface NewsletterConfig {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  limit?: number;
  ctaLabel?: string;
}

const clampLimit = (n: unknown) => Math.min(Math.max(Math.floor(Number(n)) || 6, 1), 24);

const NewsletterSection: React.FC<{ config: NewsletterConfig }> = ({ config }) => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const limit = clampLimit(config.limit);

  const [items, setItems] = useState<NewsletterTeaser[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Refetch on login/logout: previews are only returned to signed-in users.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getNewsletterTeasers(limit)
      .then((res) => {
        if (cancelled) return;
        setItems(res.data?.items ?? []);
        setFailed(false);
      })
      .catch(() => !cancelled && setFailed(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [limit, user]);

  const open = (id: string) => navigate(user ? `/newsletter/${id}` : "/contact");

  return (
    <div className="sec nl-sec" style={{ background: "var(--bgp)" }}>
      <div className="slbl">{config.eyebrow ?? "Member Insights"}</div>
      <h2 className="stit">{config.title ?? "Newsletter"}</h2>
      {config.subtitle && <p className="nl-sub">{config.subtitle}</p>}

      {loading ? (
        <div className="nl-state"><Loader /></div>
      ) : failed ? (
        <p className="nl-state">Newsletters are unavailable right now.</p>
      ) : items.length === 0 ? (
        <p className="nl-state">No newsletters published yet.</p>
      ) : (
        <div className="nl-grid">
          {items.map((item) => (
            <article
              key={item.id}
              role="link"
              tabIndex={0}
              className={`nl-card${user ? "" : " nl-card--locked"}`}
              onClick={() => open(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open(item.id);
                }
              }}
            >
              <div className="nl-card-body">
                <h3 className="nl-card-title">{item.title}</h3>
                <p className="nl-card-excerpt">
                  {user
                    ? item.preview
                    : "Industry intelligence for Club members. Apply for membership to read the full newsletter and access every edition."}
                </p>
                <span className="nl-card-date">
                  {new Date(item.sentAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {!user && (
                <div className="nl-lock">
                  <span>{config.ctaLabel ?? "Apply for membership"} →</span>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsletterSection;
