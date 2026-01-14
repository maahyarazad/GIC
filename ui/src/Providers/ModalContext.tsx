import React, { createContext, useContext, useState, ReactNode } from "react";
import ModalDialog from "../Components/Generic/Dialog/Dialog"

interface ModalOptions {
  title?: string;
  content: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModalContextType {
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside ModalProvider");
  return ctx;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [options, setOptions] = useState<ModalOptions | null>(null);

  const openModal = (opts: ModalOptions) => {
    setOptions(opts);
    setIsOpen(true);
    setExiting(false);
  };

  const closeModal = () => {
    if (!isOpen) return;
    setExiting(true);
    setTimeout(() => {
      setIsOpen(false);
      setExiting(false);
      options?.onCancel?.();
    }, 300); // animation duration
  };

  const handleConfirm = () => {
    setExiting(true);
    setTimeout(() => {
      setIsOpen(false);
      setExiting(false);
      options?.onConfirm?.();
    }, 300);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}

      {isOpen && options && (
        <ModalDialog
          title={options.title}
          content={options.content}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          onConfirm={handleConfirm}
          onCancel={closeModal}
          exiting={exiting}
        />
      )}
    </ModalContext.Provider>
  );
};
