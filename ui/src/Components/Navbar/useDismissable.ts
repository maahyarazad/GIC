import { RefObject, useEffect } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), [role="button"]';

interface DismissableOptions {
  open: boolean;
  onClose: () => void;
  /** The panel; clicks inside it don't close it. */
  panelRef: RefObject<HTMLElement | null>;
  /** The button that opens the panel; it gets focus back on Escape. */
  toggleRef: RefObject<HTMLElement | null>;
}

/**
 * While `open`: Escape closes the panel and returns focus to the toggle, a pointerdown outside
 * both the panel and the toggle closes it, and opening moves focus to the panel's first item.
 */
export function useDismissable({ open, onClose, panelRef, toggleRef }: DismissableOptions) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      onClose();
      toggleRef.current?.focus();
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || toggleRef.current?.contains(target)) return;
      onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onClose, panelRef, toggleRef]);

  // Only on opening, so re-renders while open never pull focus back.
  useEffect(() => {
    if (!open) return;
    // Wait a frame so the panel is rendered (and its slide-in started) before moving focus.
    const frame = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open, panelRef]);
}
