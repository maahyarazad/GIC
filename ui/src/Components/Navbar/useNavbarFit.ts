import { RefObject, useEffect, useLayoutEffect, useState } from "react";
import { NAVBAR_FIT_HYSTERESIS } from "./navbarConfig";

// useLayoutEffect warns during SSR; the measurement only matters in the browser.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * True when the desktop links no longer fit their column, so the navbar should fall back to the
 * hamburger at any width. Leaving compact mode needs NAVBAR_FIT_HYSTERESIS px of spare room, so the
 * bar doesn't flip back and forth at the boundary. Always false on the server and before the first
 * measurement, keeping server and client markup identical.
 */
export function useNavbarFit(
  middleRef: RefObject<HTMLElement | null>,
  linksRef: RefObject<HTMLElement | null>,
  deps: unknown[]
): boolean {
  const [compact, setCompact] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const middle = middleRef.current;
    const links = linksRef.current;
    if (!middle || !links || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const need = links.scrollWidth;
      const have = middle.clientWidth;
      setCompact((prev) => (prev ? need + NAVBAR_FIT_HYSTERESIS > have : need > have));
    };

    const observer = new ResizeObserver(measure);
    observer.observe(middle);
    measure();
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return compact;
}
