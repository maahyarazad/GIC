import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import SlideMenu from "../Components/Generic/SlideMenu/SlideMenu";

interface SlideMenuContextType {
  openMenu: (content: ReactNode, title?: string, onCloseCallback?: () => void) => void;
  closeMenu: () => void;
}

const SlideMenuContext = createContext<SlideMenuContextType | null>(null);

export const SlideMenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuContent, setMenuContent] = useState<ReactNode>(null);
  const [headerTitle, setHeaderTitle] = useState<string | undefined>();
  
  // Use a ref to store onClose callback to avoid re-creating functions and stale closures
  const onCloseCallbackRef = useRef<(() => void) | null>(null);

  const openMenu = useCallback((
    content: ReactNode, 
    title?: string, 
    onCloseCallback?: () => void
  ) => {
    setMenuContent(content);
    setHeaderTitle(title);
    if (onCloseCallback) {
      onCloseCallbackRef.current = onCloseCallback;
    } else {
      onCloseCallbackRef.current = null;
    }
    setIsOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setMenuContent(null);
    setHeaderTitle(undefined);

    // Call your optional close callback if set
    if (onCloseCallbackRef.current) {
      onCloseCallbackRef.current();
      onCloseCallbackRef.current = null; // reset after calling
    }
  }, []);

  return (
    <SlideMenuContext.Provider value={{ openMenu, closeMenu }}>
      {children}
      <SlideMenu
        isOpen={isOpen}
        onClose={closeMenu}
        headerTitle={headerTitle}
      >
        {menuContent}
      </SlideMenu>
    </SlideMenuContext.Provider>
  );
};

export const useSlideMenu = () => {
  const context = useContext(SlideMenuContext);
  if (!context) {
    throw new Error("useSlideMenu must be used within a SlideMenuProvider");
  }
  return {
    openMenu: context.openMenu,
    onClose: context.closeMenu,
  };
};

export { SlideMenuContext };
