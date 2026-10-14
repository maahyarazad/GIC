import React, { useEffect, useRef, useState } from "react";
import type { LetterFields } from "../../../../../src/types/recommendationLetter.types";

interface LetterPreviewProps {
    /** The selected request, or null when nothing is open. */
    requestId: string | null;
    /** The values to render. Updated by the editor on field focus-out, so this changes per edit, not per keystroke. */
    fields: LetterFields | null;
    /** PDF generator for the current role (admin = final, member = DRAFT). */
    pdf: (id: string, fields: LetterFields, disposition: "inline" | "attachment") => Promise<Blob>;
}

/**
 * Live PDF preview: renders the real generated PDF (inline) in an <iframe>, refreshing whenever
 * `fields` changes. Reuses the existing `POST /admin/letter-requests/{id}/letter/pdf?disposition=inline`
 * endpoint (read-only). Refreshes are debounced and skipped when the values are unchanged; an
 * incomplete draft that fails server validation shows a short message instead of a PDF.
 */
const LetterPreview: React.FC<LetterPreviewProps> = ({ requestId, fields, pdf }) => {
    const [url, setUrl] = useState<string | null>(null);
    const [state, setState] = useState<"idle" | "loading" | "error">("idle");
    // Current blob URL and the last-rendered values key, kept in refs for cleanup/dedup.
    const urlRef = useRef<string | null>(null);
    const lastKeyRef = useRef<string>("");

    const setPreviewUrl = (next: string | null) => {
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = next;
        setUrl(next);
    };

    useEffect(() => {
        if (!requestId || !fields) {
            lastKeyRef.current = "";
            setPreviewUrl(null);
            setState("idle");
            return;
        }

        const key = `${requestId}:${JSON.stringify(fields)}`;
        if (key === lastKeyRef.current) return;

        let cancelled = false;
        const handle = setTimeout(async () => {
            setState("loading");
            try {
                const blob = await pdf(requestId, fields, "inline");
                if (cancelled) return;
                setPreviewUrl(URL.createObjectURL(blob));
                lastKeyRef.current = key;
                setState("idle");
            } catch {
                if (cancelled) return;
                // Most commonly a 400 from an incomplete draft; show a hint, keep any prior preview URL.
                setState("error");
            }
        }, 400);

        return () => {
            cancelled = true;
            clearTimeout(handle);
        };
    }, [requestId, fields]);

    // Revoke the last blob URL when the component unmounts.
    useEffect(
        () => () => {
            if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        },
        []
    );

    if (!requestId || !fields) {
        return <div className="rl-preview__empty">Select a request to preview the letter.</div>;
    }

    if (!url) {
        return (
            <div className="rl-preview__msg">
                {state === "loading"
                    ? "Generating preview…"
                    : state === "error"
                    ? "Fill in the required fields to preview the letter."
                    : "Preview will appear here."}
            </div>
        );
    }

    return (
        <iframe
            className="rl-preview__frame"
            title="Letter preview"
            src={url}
        />
    );
};

export default LetterPreview;
