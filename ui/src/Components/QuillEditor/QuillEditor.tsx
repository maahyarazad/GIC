import React, { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "./QuillEditor.css";

interface Props {
  value: string;
  onChange: (html: string) => void;
  onImageUpload: (file: File) => Promise<string>;
  placeholder?: string;
}

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  [{ size: ["small", false, "large", "huge"] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote"],
  ["link", "image"],
  ["clean"],
];

const QuillEditor: React.FC<Props> = ({
  value,
  onChange,
  onImageUpload,
  placeholder,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  const onImageUploadRef = useRef(onImageUpload);
  const isInternalChange = useRef(false);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onImageUploadRef.current = onImageUpload; }, [onImageUpload]);

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    const quill = new Quill(containerRef.current, {
      theme: "snow",
      placeholder: placeholder ?? "Write your content here…",
      modules: {
        toolbar: {
          container: TOOLBAR_OPTIONS,
          handlers: {
            image() {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.click();
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                try {
                  const url = await onImageUploadRef.current(file);
                  const range = quill.getSelection(true);
                  quill.insertEmbed(range.index, "image", url);
                  quill.setSelection(range.index + 1, 0);
                } catch {
                  // error handled by caller via toast
                }
              };
            },
          },
        },
      },
    });

    quillRef.current = quill;

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    quill.on("text-change", () => {
      isInternalChange.current = true;
      const html = quill.root.innerHTML;
      onChangeRef.current(html === "<p><br></p>" ? "" : html);
      isInternalChange.current = false;
    });

    return () => {
      quillRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync when parent swaps content (e.g. opening a different blog to edit)
  useEffect(() => {
    if (!quillRef.current || isInternalChange.current) return;
    const current = quillRef.current.root.innerHTML;
    const normalized = current === "<p><br></p>" ? "" : current;
    if (value !== normalized) {
      quillRef.current.clipboard.dangerouslyPasteHTML(value || "");
    }
  }, [value]);

  return (
    <div className="quill-editor-wrap">
      <div ref={containerRef} />
    </div>
  );
};

export default QuillEditor;
