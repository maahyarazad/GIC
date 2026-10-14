import { useEffect, useRef, useState } from "react";

interface LetterPreviewProps<F> {
    /** The selected request, or null when nothing is open. */
    requestId: string | null;
    /** The values to render. Updated by the editor on field focus-out, so this changes per edit, not per keystroke. */
    fields: F | null;
    /** PDF generator for the current role/letter (admin = final, member = DRAFT, business = preview). */
    pdf: (id: string, fields: F, disposition: "inline" | "attachment") => Promise<Blob>;
    /** BEM-style class prefix; the host page styles `${classPrefix}__frame|__msg|__empty`. */
    classPrefix?: string;
    /** Shown when there is no request/fields to preview. */
    emptyText?: string;
    /** Shown when the last render failed (most often an incomplete draft). */
    errorText?: string;
}

/**
 * Live PDF preview: renders the real generated PDF (inline) in an <iframe>, refreshing whenever
 * `fields` changes. Reuses the role's inline PDF endpoint (read-only). Refreshes are debounced and
 * skipped when the values are unchanged; a render that fails server-side (e.g. an incomplete draft)
 * shows a short message instead of a PDF.
 */
function LetterPreview<F>({
    requestId,
    fields,
    pdf,
    classPrefix = "rl-preview",
    emptyText = "Select a request to preview the letter.",
    errorText = "Fill in the required fields to preview the letter.",
}: LetterPreviewProps<F>) {
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
        return <div className={`${classPrefix}__empty`}>{emptyText}</div>;
    }

    if (!url) {
        return (
            <div className={`${classPrefix}__msg`}>
                {state === "loading"
                    ? "Generating preview…"
                    : state === "error"
                    ? errorText
                    : "Preview will appear here."}
            </div>
        );
    }

    return (
        <iframe
            className={`${classPrefix}__frame`}
            title="Letter preview"
            src={url}
        />
    );
}

export default LetterPreview;
