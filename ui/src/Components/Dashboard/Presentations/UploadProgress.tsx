import React from "react";

interface UploadProgressProps {
  /** 0–100; drives the determinate bar. */
  percent: number;
  /** Optional error message to surface instead of progress. */
  error?: string | null;
}

/** Determinate upload progress bar so users can see how far along an upload is. */
const UploadProgress: React.FC<UploadProgressProps> = ({ percent, error }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  if (error) {
    return <p className="presentation-upload__error" role="alert">{error}</p>;
  }

  return (
    <div className="presentation-upload__progress" aria-label="Upload progress">
      <div
        className="presentation-upload__bar"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="presentation-upload__bar-fill" style={{ width: `${clamped}%` }} />
      </div>
      <span className="presentation-upload__pct">{clamped}%</span>
    </div>
  );
};

export default UploadProgress;
