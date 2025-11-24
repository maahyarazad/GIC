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
      <div className="confirm-dialog-backdrop" onClick={onCancel} />

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
          <button
            onClick={onCancel}
            className="confirm-dialog__button confirm-dialog__button--cancel"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="confirm-dialog__button confirm-dialog__button--confirm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </>
  );
};

export default ConfirmDialog;
