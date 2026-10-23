import React from "react";

export type UploadStatus = "queued" | "uploading" | "processing" | "done" | "failed";

export interface UploadItem {
  name: string;
  /** Bytes. */
  size: number;
  /** Bytes the server has received so far. */
  loaded: number;
  status: UploadStatus;
  error?: string;
}

interface UploadOverlayProps {
  items: UploadItem[];
  /** 0–100, weighted by bytes across the batch. */
  batchPercent: number;
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Finished items (uploaded or failed) count as complete so the batch bar reaches 100%. */
export const itemPercent = (item: UploadItem): number =>
  item.status === "done" || item.status === "failed"
    ? 100
    : item.size > 0
      ? clamp((item.loaded / item.size) * 100)
      : 0;

export const batchPercentOf = (items: UploadItem[]): number => {
  const total = items.reduce((sum, i) => sum + i.size, 0);
  if (total === 0) return 0;
  const loaded = items.reduce((sum, i) => sum + (i.size * itemPercent(i)) / 100, 0);
  return clamp((loaded / total) * 100);
};

const statusLabel = (item: UploadItem): string => {
  switch (item.status) {
    case "queued":
      return "Queued";
    case "uploading":
      return "Uploading";
    case "processing":
      return "Processing…";
    case "done":
      return "Uploaded";
    case "failed":
      return `Failed – ${item.error ?? "Upload failed"}`;
  }
};

const ProgressBar: React.FC<{ percent: number; label: string; tone?: UploadStatus }> = ({
  percent,
  label,
  tone,
}) => (
  <div
    className={`file-upload-overlay__bar${tone ? ` file-upload-overlay__bar--${tone}` : ""}`}
    role="progressbar"
    aria-label={label}
    aria-valuenow={clamp(percent)}
    aria-valuemin={0}
    aria-valuemax={100}
  >
    <span className="file-upload-overlay__bar-fill" style={{ width: `${clamp(percent)}%` }} />
  </div>
);

/** Blocking overlay over the File Manager while a batch uploads: one row per file plus the batch total. */
const UploadOverlay: React.FC<UploadOverlayProps> = ({ items, batchPercent }) => {
  const finished = items.filter((i) => i.status === "done" || i.status === "failed").length;

  return (
    <div
      className="file-upload-overlay"
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-label="Uploading files"
    >
      <div className="file-upload-overlay__card">
        <h4 className="file-upload-overlay__title">Uploading files</h4>

        <ul className="file-upload-overlay__list">
          {items.map((item, index) => (
            <li key={`${index}-${item.name}`} className="file-upload-overlay__row">
              <div className="file-upload-overlay__row-head">
                <span className="file-upload-overlay__name" title={item.name}>
                  {item.name}
                </span>
                <span className={`file-upload-overlay__status file-upload-overlay__status--${item.status}`}>
                  {statusLabel(item)}
                </span>
              </div>
              <div className="file-upload-overlay__row-bar">
                <ProgressBar percent={itemPercent(item)} label={item.name} tone={item.status} />
                <span className="file-upload-overlay__pct">
                  {item.status === "failed" ? "—" : `${itemPercent(item)}%`}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="file-upload-overlay__footer">
          <div className="file-upload-overlay__row-bar">
            <ProgressBar percent={batchPercent} label="All files" />
            <span className="file-upload-overlay__pct">{clamp(batchPercent)}%</span>
          </div>
          <span className="file-upload-overlay__count">
            {finished} of {items.length} files
          </span>
        </div>
      </div>
    </div>
  );
};

export default UploadOverlay;
