import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loader from "@/Components/Loader/Loader";
import { getNewsletterArticle } from "@/api/newsletterPublic";
import type { NewsletterPublicDetail } from "../../../../src/types/newsletterArticle.types";
import "./NewsletterDetail.css";

const NewsletterDetail: React.FC = () => {
  const { id = "" } = useParams();
  const [article, setArticle] = useState<NewsletterPublicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getNewsletterArticle(id)
      .then((res) => {
        if (cancelled) return;
        if (res.data) setArticle(res.data);
        else setNotFound(true);
      })
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Size the frame to its content; "allow-same-origin" is needed for this, scripts stay disabled.
  const fitFrame = () => {
    const doc = frameRef.current?.contentDocument;
    if (frameRef.current && doc) frameRef.current.style.height = `${doc.documentElement.scrollHeight}px`;
  };

  return (
    <div className="page active nd-page">
      <div className="ptnav" />
      <div className="nd-wrap">
        <Link to="/" className="nd-back">← Back</Link>
        {loading ? (
          <Loader />
        ) : notFound || !article ? (
          <p>This newsletter could not be found.</p>
        ) : (
          <>
            <h1 className="nd-title">{article.title}</h1>
            <p className="nd-date">
              {new Date(article.sentAt).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
            <iframe
              ref={frameRef}
              className="nd-frame"
              title={article.title}
              sandbox="allow-same-origin"
              srcDoc={article.html}
              onLoad={fitFrame}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default NewsletterDetail;
