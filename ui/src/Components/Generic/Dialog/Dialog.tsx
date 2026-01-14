import React from "react";
import './Dialog.css';
interface ModalDialogProps {
  title?: string;
  content: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  exiting?: boolean;
}

const ModalDialog: React.FC<ModalDialogProps> = ({
  title,
  content,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  exiting = false,
}) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`modal-backdrop ${exiting ? "exit" : ""}`}
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        className={`modal ${exiting ? "exit" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        aria-describedby="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 id="modal-title" className="modal__title">
            {title}
          </h2>
        )}

        <div id="modal-content" className="modal__content">
          {content}
        </div>

        <div className="modal__actions">
          {cancelText && (
            <button
              className="dashboard-btn dashboard-btn--ghost-minimal modal__btn--cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}

          {confirmText && (
            <button
              className="dashboard-btn modal__btn--confirm"
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default ModalDialog;
