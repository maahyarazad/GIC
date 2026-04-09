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
                className={`dashboard-modal-backdrop ${exiting ? "dashboard-exit" : ""}`}
                onClick={onCancel}
            />

            {/* Modal */}
            <div
                className={`dashboard-modal ${exiting ? "dashboard-exit" : ""}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? "dashboard-modal-title" : undefined}
                aria-describedby="dashboard-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                {title && (
                    <h2 id="dashboard-modal-title" className="dashboard-modal-title">
                        {title}
                    </h2>
                )}

                <div id="dashboard-modal-content" className="dashboard-modal-content">
                    {content}
                </div>

                <div className="dashboard-modal-actions">
                    {cancelText && (
                        <button
                            className="dashboard-btn dashboard-btn--ghost-minimal dashboard-modal-btn-cancel"
                            onClick={onCancel}
                        >
                            {cancelText}
                        </button>
                    )}

                    {confirmText && (
                        <button
                            className="dashboard-btn dashboard-modal-btn-confirm"
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
