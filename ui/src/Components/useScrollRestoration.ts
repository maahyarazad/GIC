import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useScrollRestoration() {
  const { pathname } = useLocation();

 useEffect(() => {
  const saved = sessionStorage.getItem(`scroll-${pathname}`);
  if (saved) {
    // Delay scrolling until next frame, to ensure layout is ready
    requestAnimationFrame(() => {
      window.scrollTo(0, parseInt(saved, 10));
    });
  }

  const saveScroll = () => {
    sessionStorage.setItem(`scroll-${pathname}`, String(window.scrollY));
  };

  window.addEventListener("scroll", saveScroll);
  return () => window.removeEventListener("scroll", saveScroll);
}, [pathname]);

}
