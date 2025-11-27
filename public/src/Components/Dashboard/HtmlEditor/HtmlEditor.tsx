import { useRef } from "react";
import Editor from "@monaco-editor/react";

interface HtmlCodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  height?: string | number;
}

export default function HtmlCodeEditor({
  value,
  onChange,
  height = "600px",
}: HtmlCodeEditorProps) {
  const editorRef = useRef(null);

  function handleEditorChange(value: string | undefined) {
    onChange(value || "");
  }

  return (
    <Editor
      height={'75vh'}
      defaultLanguage="html"
      theme="vs-dark"
      value={value}
      onChange={handleEditorChange}
      options={{
        fontSize: 14,
        minimap: { enabled: true },
        automaticLayout: true,
        wordWrap: "on",
        formatOnPaste: true,
        formatOnType: true,
        autoClosingTags: true,
        autoClosingBrackets: "always",
        tabSize: 2,
      }}
    />
  );
}
