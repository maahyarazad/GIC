import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import ModalDialog from "../Components/Generic/Dialog/Dialog";

// --- Expert data shape ---
interface ExpertModalContent {
  init: string;
  name: string;
  role: string;
  tag: string;
  bio: string;
  exp: string[];
  bg: string;
}

interface ModalOptions {
  title?: string;
  content?: ReactNode;
  expert?: ExpertModalContent;   // ← new: pass expert data directly
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

// --- Expert modal content component ---
const ExpertModalBody: React.FC<{ expert: ExpertModalContent }> = ({ expert }) => (
  <>
    <div className="modal-hd">
      <div className="modal-port">
        <div className="modal-init">{expert.init}</div>
      </div>
      <div className="modal-hi">
        <div className="modal-name">{expert.name}</div>
        <div className="modal-role">{expert.role}</div>
        <div className="modal-tag">{expert.tag}</div>
      </div>
    </div>
    <div className="modal-bd">
      <div className="modal-st">Background</div>
      <p className="modal-tx">{expert.bio}</p>
      <div className="modal-st">Areas of Expertise</div>
      <ul className="modal-ul">
        {expert.exp.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <div className="modal-st">Role in the Club</div>
      <p className="modal-tx">{expert.bg}</p>
    </div>
  </>
);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [options, setOptions] = useState<ModalOptions | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

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
      setOptions(null);
    }, 300);
  };

  const handleConfirm = () => {
    setExiting(true);
    setTimeout(() => {
      setIsOpen(false);
      setExiting(false);
      options?.onConfirm?.();
      setOptions(null);
    }, 300);
  };

  // Resolve content: expert layout takes priority over generic content
  const resolvedContent = options?.expert
    ? <ExpertModalBody expert={options.expert} />
    : options?.content;

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {isOpen && options && (
        <ModalDialog
          title={options.title}
          content={resolvedContent}
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