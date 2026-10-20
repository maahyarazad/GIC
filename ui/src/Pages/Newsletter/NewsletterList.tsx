import React from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";
import NewsletterSection from "../Home/NewsletterSection";

/** /newsletter: the same cards as the landing page section, with the maximum card count. */
const NewsletterList: React.FC = () => {
  const siteData = useSelector((state: RootState) => state.app.siteData);
  return (
    <div className="page active">
      <div className="ptnav" />
      <NewsletterSection config={{ ...(siteData?.newsletter ?? {}), limit: 24 }} />
    </div>
  );
};

export default NewsletterList;
