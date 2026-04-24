import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
} from "react";
import ModalDialog from "../Components/Generic/Dialog/Dialog";
type ModalContent = ReactNode | (() => ReactNode);

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
    content?: ModalContent;  // ✅ can now be a function
    expert?: ExpertModalContent;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
        confirmClassName?: string;
        disabled?: boolean | (() => boolean);

}

interface ModalContextType {
    openModal: (options: ModalOptions) => void;
    closeModal: () => void;
    setModalDisabled: (disabled: boolean) => void; 
}

const ModalContext = createContext<ModalContextType | null>(null);

export const useModal = () => {
    const ctx = useContext(ModalContext);
    if (!ctx) throw new Error("useModal must be used inside ModalProvider");
    return ctx;
};

const ExpertModal: React.FC<{
    expert?: ExpertModalContent;
    visible: boolean;
    exiting: boolean;
    onClose: () => void;
}> = ({ expert, visible, exiting, onClose }) => {
    return (
        <div
            className={[
                "modal-ov",
                visible ? "open" : "hidden",
                exiting ? "closing" : "",
            ].join(" ")}
            id="expertModal"
            aria-hidden={!visible}
        >
            <div className="modal-box">
                <div className="modal-close" onClick={onClose}>
                    &#x2715;
                </div>

                {expert && (
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
                )}
            </div>
        </div>
    );
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [exiting, setExiting] = useState(false);
    const [modalDisabled, setModalDisabled] = useState(false);
    const [options, setOptions] = useState<ModalOptions>({
        variant: "default",
    });

    useEffect(() => {
        if (!isOpen) return;
        if (typeof window === "undefined") return;  // add this

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                closeModal();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const openModal = (opts: ModalOptions) => {
        setExiting(false);
        setOptions({
            variant: "default",
            ...opts,
        });
        setIsOpen(true);
    };

    const closeModal = () => {
        if (!isOpen) return;

        const currentOptions = options;

        setExiting(true);

        setTimeout(() => {
            setIsOpen(false);
            setExiting(false);
            currentOptions?.onCancel?.();
        }, 300);
    };

    const handleConfirm = () => {
        if (!isOpen) return;

        const currentOptions = options;

        setExiting(true);

        setTimeout(() => {
            setIsOpen(false);
            setExiting(false);
            currentOptions?.onConfirm?.();
        }, 300);
    };

    const showDefault = isOpen && options?.variant === "default";
    const showExpert = isOpen && options?.variant === "expert";





const renderContent = (content?: ModalContent): ReactNode => {
    return typeof content === "function" ? content() : content;
};

    return (
        <ModalContext.Provider value={{ openModal, closeModal, setModalDisabled }}>
            {children}

            {isOpen && showDefault && (

                <ModalDialog
                    title={options?.title}
                    content={renderContent(options?.content)}
                    confirmText={options?.confirmText}
                    cancelText={options?.cancelText}
                    onConfirm={handleConfirm}
                    onCancel={closeModal}
                    exiting={exiting}
                    confirmClassName={options?.confirmClassName}
                    disabled={modalDisabled}
                />
            )}

            <div
                className={[
                    "modal-layer",
                    isOpen ? "open" : "hidden",
                    exiting ? "closing" : "",
                ].join(" ")}
            >

                <div className={showExpert ? "modal-view active" : "modal-view hidden"}>
                    <ExpertModal
                        expert={options?.expert}
                        visible={showExpert}
                        exiting={exiting}
                        onClose={closeModal}
                    />
                </div>
            </div>
        </ModalContext.Provider>
    );
};