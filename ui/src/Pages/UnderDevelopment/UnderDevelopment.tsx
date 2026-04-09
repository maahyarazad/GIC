import React from "react";
import './UnderDevelopment.css';
const UnderDevelopment: React.FC = () => {
  return (
    <section className="underdev-page">
      <div className="underdev-card">
        <div className="underdev-badge">Coming Soon</div>

        <h1 className="underdev-title">Under Development</h1>

        <p className="underdev-text">
          We’re currently working on this page to make it better, faster, and
          more useful for you.
        </p>

        <p className="underdev-subtext">
          Please check back soon.
        </p>

        <div className="underdev-actions">
          <button
            className="underdev-btn primary"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>

          <button
            className="underdev-btn secondary"
            onClick={() => (window.location.href = "/")}
          >
            Go Home
          </button>
        </div>
      </div>
    </section>
  );
};

export default UnderDevelopment;