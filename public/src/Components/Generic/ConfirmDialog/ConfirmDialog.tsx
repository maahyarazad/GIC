import React from "react";
import "./ConfirmDialog.css";

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  title?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  title,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="confirm-dialog-backdrop" onClick={onCancel} />

      {/* Dialog */}
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        {title && (
          <h2 id="confirm-dialog-title" className="confirm-dialog__title">
            {title}
          </h2>
        )}

        <p id="confirm-dialog-description" className="confirm-dialog__message">
          {message}
        </p>

        <div className="confirm-dialog__buttons">
          {/* Cancel button with ghost minimal style */}
          <button
            onClick={onCancel}
          className="dashboard-btn confirm-dialog__button--confirm"
          >
            {cancelText}
          </button>

          {/* Confirm button with default style */}
          <button
            onClick={onConfirm}
              className="dashboard-btn dashboard-btn--ghost-minimal confirm-dialog__button--cancel"
            
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
};

export default ConfirmDialog;
