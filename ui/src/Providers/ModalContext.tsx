import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from "react";
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

type ModalVariant = "default" | "expert";

interface ModalOptions {
    variant?: ModalVariant;
    title?: string;
    content?: ReactNode;
    expert?: ExpertModalContent;
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

// --- Standalone Expert modal ---
const ExpertModal: React.FC<{
    expert: ExpertModalContent;
    exiting: boolean;
    onClose: () => void;
}> = ({ expert, exiting, onClose }) => {


    debugger;
    return (

        <>
            <div className="modal-ov open" id="expertModal">
                <div className="modal-box">
                    <div className="modal-close" id="modalClose" onClick={onClose}>&#x2715;</div>
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
                </div>
            </div>

        </>
    );
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [exiting, setExiting] = useState(false);
    const [options, setOptions] = useState<ModalOptions | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeModal();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const openModal = (opts: ModalOptions) => {

        
        setOptions({
            variant: opts.variant,
            ...opts,
        });
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

    return (
        <ModalContext.Provider value={{ openModal, closeModal }}>
            {children}

            {isOpen && options?.variant === "default" && (
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

            {isOpen && options?.variant === "expert" && options.expert && (
                <ExpertModal
                    expert={options.expert}
                    exiting={exiting}
                    onClose={closeModal}
                />
            )}
        </ModalContext.Provider>
    );
};