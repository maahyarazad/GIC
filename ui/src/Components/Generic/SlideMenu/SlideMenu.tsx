import React , {useEffect, useState} from "react";
import "./SlideMenu.css";

interface SlideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  headerTitle?: string;
}

const SlideMenu: React.FC<SlideMenuProps> = ({ isOpen, onClose, children, headerTitle }) => {
    const [isMobile, setIsMobile] = useState(false);
     useEffect(() => {
        const onResize = () => {
          setIsMobile(window.innerWidth <= 768);
        };
    
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
      }, []);

    useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    


    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup listener on unmount or when menu closes
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`slide-menu-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />



      {/* Sliding menu */}
      <div className={`slide-menu ${isOpen ? "open" : ""}`} role="dialog" aria-modal="true" style={{width: isMobile ? "100%" : "80%"}}>
        {/* Sticky header */}
        <div className="slide-menu__header">

          <button
            className="slide-menu__close-button"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            ×
          </button>

          <h2 className="slide-menu__title">{headerTitle}</h2>

          <div className="slide-menu__spacer" />
        </div>

        {/* Content passed as children */}
        <div className="slide-menu__content">{children}</div>
      </div>
    </>
  );
};

export default SlideMenu;