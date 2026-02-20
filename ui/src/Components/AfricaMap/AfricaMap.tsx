import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import svgMap from "./AdobeStock_222932619-_Converted_-Artboard_5.svg";
import Loader from "../Loader/Loader";

type Props = {
  src?: string;
  hoverFill?: string;
  hoverStroke?: string;
  hoverStrokeWidth?: number;
  className?: string;

  maskFill?: string;
  maskStroke?: string;
  maskStrokeWidth?: number;

    enableMutation?: boolean;
  mutateIntervalMs?: number;
  mutationPalette?: string[]; // optional colors list
};

export default function AfricaMiddleEastHoverMap({
  src = svgMap,
  hoverFill = "#fa5007",
  hoverStroke = "#111827",
  hoverStrokeWidth = 1,
  className,

  // ✅ FIX: valid hex color (you had "#00000")
  maskFill = "#000000",
  maskStroke = "#fcfaf7",
  maskStrokeWidth = 0.4,

    enableMutation = true,
  mutateIntervalMs = 500,
  mutationPalette,

}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const hoveredRef = useRef<SVGElement | null>(null);
  // Track whether user is interacting, so mutation doesn't fight them
  const userInteractingRef = useRef(false);

  // Cache hoverable elements after mask is applied
  const hoverablesRef = useRef<SVGElement[]>([]);


  const isHoverable = useCallback((el: Element | null): el is SVGElement => {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    if (tag !== "path" && tag !== "polygon") return false;

    const fill = (el as SVGElement).getAttribute("fill")?.toLowerCase() ?? "";
    if (fill === "#e1f0f7") return false; // background water
    if (fill === "none") return false;

    return true;
  }, []);





  // Restore previously hovered country back to masked state
  const restorePrev = useCallback(() => {
    const prev = hoveredRef.current;
    if (!prev) return;

    prev.setAttribute("fill", maskFill);
    prev.setAttribute("stroke", maskStroke);
    prev.setAttribute("stroke-width", String(maskStrokeWidth));

    hoveredRef.current = null;
  }, [maskFill, maskStroke, maskStrokeWidth]);


      const applyHighlight = useCallback(
    (el: SVGElement, fill: string) => {
      // remove any previous highlight
      restorePrev();
      hoveredRef.current = el;

      el.setAttribute("fill", fill);
      el.setAttribute("stroke", hoverStroke);
      el.setAttribute("stroke-width", String(hoverStrokeWidth));
    },
    [hoverStroke, hoverStrokeWidth, restorePrev]
  );


  const onPointerOver = useCallback(
    (e: Event) => {
      const target = e.target as Element | null;
      if (!isHoverable(target)) return;

      const el = target as SVGElement;
      if (hoveredRef.current === el) return;

      restorePrev();
      hoveredRef.current = el;

      el.setAttribute("fill", hoverFill);
      el.setAttribute("stroke", hoverStroke);
      el.setAttribute("stroke-width", String(hoverStrokeWidth));
    },
    [hoverFill, hoverStroke, hoverStrokeWidth, isHoverable, restorePrev]
  );

  const onPointerOut = useCallback(
    (e: Event) => {
      const related = (e as PointerEvent).relatedTarget as Element | null;
      if (isHoverable(related)) return;
      restorePrev();
    },
    [isHoverable, restorePrev]
  );


  const applyMask = useCallback(
    (wrap: HTMLDivElement) => {
      const svg = wrap.querySelector("svg");
      if (!svg) return;

      const nodes = Array.from(svg.querySelectorAll("path, polygon"));

      const hoverables: SVGElement[] = [];
      nodes.forEach((node) => {
        if (!isHoverable(node)) return;

        const el = node as SVGElement;

        // Save originals once (optional)
        if (el.dataset.origFill == null) el.dataset.origFill = el.getAttribute("fill") ?? "";
        if (el.dataset.origStroke == null) el.dataset.origStroke = el.getAttribute("stroke") ?? "";
        if (el.dataset.origStrokeWidth == null)
          el.dataset.origStrokeWidth = el.getAttribute("stroke-width") ?? "";

        // Apply mask baseline
        el.setAttribute("fill", maskFill);
        el.setAttribute("stroke", maskStroke);
        el.setAttribute("stroke-width", String(maskStrokeWidth));

        el.style.cursor = "pointer";
        el.style.transition = "fill 200ms ease, stroke 200ms ease, stroke-width 200ms ease";
        (el.style as any).touchAction = "manipulation";

        hoverables.push(el);
      });

      hoverablesRef.current = hoverables;
    },
    [isHoverable, maskFill, maskStroke, maskStrokeWidth]
  );

  
const loadMap = useCallback(async () => {
  setIsLoading(true);

  try {
    const res = await fetch(src);
    const txt = await res.text();

    // Parse the SVG string
    const parser = new DOMParser();
    const doc = parser.parseFromString(txt, "image/svg+xml");

    const nodes = doc.querySelectorAll("path, polygon");

    nodes.forEach((node) => {
      const el = node as SVGElement;
      if (!isHoverable(el)) return;

      // Apply mask BEFORE rendering
      el.setAttribute("fill", maskFill);
      el.setAttribute("stroke", maskStroke);
      el.setAttribute("stroke-width", String(maskStrokeWidth));
    });

    // Serialize back to string
    const serialized = new XMLSerializer().serializeToString(doc);
    setSvgMarkup(serialized);

  } catch (err) {
    console.error("SVG load failed", err);
  } finally {
    setIsLoading(false);
  }
}, [src, maskFill, maskStroke, maskStrokeWidth, isHoverable]);


  useEffect(() => {
    loadMap();
  }, [loadMap]);

  // ✅ After svgMarkup is rendered into DOM, apply mask & attach listeners
  useLayoutEffect(() => {
    if (!svgMarkup) return;

    const wrap = wrapRef.current;
    if (!wrap) return;

    // ensure innerHTML committed
    const raf = requestAnimationFrame(() => {
        
      applyMask(wrap);
      setIsLoading(false);
    });

    wrap.addEventListener("pointerover", onPointerOver);
    wrap.addEventListener("pointerout", onPointerOut);

    return () => {
      cancelAnimationFrame(raf);
      wrap.removeEventListener("pointerover", onPointerOver);
      wrap.removeEventListener("pointerout", onPointerOut);
      restorePrev();
    };
  }, [svgMarkup, applyMask, onPointerOver, onPointerOut, restorePrev]);


  useEffect(() => {
    if (!enableMutation) return;
    if (!svgMarkup) return;

    const palette =
      mutationPalette && mutationPalette.length
        ? mutationPalette
        : [
            "#fa5007",
            "#22c55e",
            "#3b82f6",
            "#a855f7",
            "#f59e0b",
            "#ef4444",
            "#14b8a6",
          ];

    const pickRandom = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    const interval = window.setInterval(() => {
      // Don’t fight the user
      if (userInteractingRef.current) return;

      const els = hoverablesRef.current;
      if (!els || els.length === 0) return;

      const el = pickRandom(els);
      const color = pickRandom(palette);

      applyHighlight(el, color);
    }, mutateIntervalMs);

    return () => window.clearInterval(interval);
  }, [enableMutation, mutateIntervalMs, mutationPalette, svgMarkup, applyHighlight]);


  return (
    <div style={{ position: "relative", width: "100%" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
            zIndex: 10,
            transition: "opacity 200ms ease",
          }}
        >
          <Loader />
        </div>
      )}

      <div
        ref={wrapRef}
        className={className}
        style={{
          width: "100%",
          opacity: isLoading ? 0 : 1,
          transition: "opacity 250ms ease",
          
        }}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />

      {/* Optional but strongly recommended for responsive behavior */}
      <style>{`
        .${className ?? "map"} svg {
        
          width: 100%;
          height: 100vh;
          display: block;
        }
      `}</style>
    </div>
  );
}