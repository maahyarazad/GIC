import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";

import svgMap from "./AdobeStock_222932619-_Converted_-Artboard_5.svg";
import Loader from "../Loader/Loader";
type Props = {
    src?: string;
    hoverFill?: string;
    hoverStroke?: string;
    hoverStrokeWidth?: number;
    className?: string;

    // NEW
    maskFill?: string; // gray layer color
    maskStroke?: string;
    maskStrokeWidth?: number;
};

export default function AfricaMiddleEastHoverMap({
    src = svgMap,
    hoverFill = "#fa5007",
    hoverStroke = "#111827",
    hoverStrokeWidth = 1,
    className,

    // NEW defaults
    maskFill = "#00000",
    maskStroke = "#fcfaf7",
    maskStrokeWidth = 0.4,
}: Props) {
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const [svgMarkup, setSvgMarkup] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const hoveredRef = useRef<{
        el: SVGElement;
        fill: string | null;
        stroke: string | null;
        strokeWidth: string | null;
    } | null>(null);

    const restorePrev = () => {
        const prev = hoveredRef.current;
        if (!prev) return;

        // ✅ NEW: restore to masked state (gray), not original
        prev.el.setAttribute("fill", maskFill);
        prev.el.setAttribute("stroke", maskStroke);
        prev.el.setAttribute("stroke-width", String(maskStrokeWidth));

        hoveredRef.current = null;
    };

    const onPointerOver = (e: Event) => {
        const target = e.target as Element | null;
        if (!isHoverable(target)) return;

        if (hoveredRef.current?.el === target) return;

        restorePrev();

        const el = target as SVGElement;
        hoveredRef.current = {
            el,
            fill: el.getAttribute("fill"),
            stroke: el.getAttribute("stroke"),
            strokeWidth: el.getAttribute("stroke-width"),
        };

        // Hover highlight
        el.setAttribute("fill", hoverFill);
        el.setAttribute("stroke", hoverStroke);
        el.setAttribute("stroke-width", String(hoverStrokeWidth));
    };

    const onPointerOut = (e: Event) => {
        const related = (e as PointerEvent).relatedTarget as Element | null;
        if (isHoverable(related)) return;
        restorePrev();
    };
    const isHoverable = (el: Element | null): el is SVGElement => {
        if (!el) return false;
        const tag = el.tagName?.toLowerCase();
        if (tag !== "path" && tag !== "polygon") return false;

        const fill = (el as SVGElement).getAttribute("fill")?.toLowerCase() ?? "";
        if (fill === "#e1f0f7") return false; // big blue background rect
        if (fill === "none") return false;

        return true;
    };


    const applyMask = (wrap: HTMLDivElement) => {
        const svg = wrap.querySelector("svg");
        if (!svg) return;

        const nodes = svg.querySelectorAll("path, polygon");

        nodes.forEach((node) => {
            if (!isHoverable(node)) return;
            const el = node as SVGElement;

            // Save originals (only once)
            if (!el.dataset.origFill) el.dataset.origFill = el.getAttribute("fill") ?? "";
            if (!el.dataset.origStroke) el.dataset.origStroke = el.getAttribute("stroke") ?? "";
            if (!el.dataset.origStrokeWidth)
                el.dataset.origStrokeWidth = el.getAttribute("stroke-width") ?? "";

            // Apply mask (gray)
            el.setAttribute("fill", maskFill);
            el.setAttribute("stroke", maskStroke);
            el.setAttribute("stroke-width", String(maskStrokeWidth));

            // nice UX
            el.style.cursor = "pointer";
            el.style.transition = "fill 120ms ease, stroke 120ms ease, stroke-width 120ms ease";
        });
    };

    const loadMap = useCallback(async () => {
        const res = await fetch(src);
        const txt = await res.text();
        setSvgMarkup(txt);


    }, [src])



    useEffect(() => {
        loadMap()

    }, [loadMap]);

    useLayoutEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;

        applyMask(wrap);
        wrap.addEventListener("pointerover", onPointerOver);
        wrap.addEventListener("pointerout", onPointerOut);

        setIsLoading(false);


        return () => {

            wrap.removeEventListener("pointerover", onPointerOver);
            wrap.removeEventListener("pointerout", onPointerOut);
            restorePrev();
        };
    }, [svgMarkup]);





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
        </div>
    );


}