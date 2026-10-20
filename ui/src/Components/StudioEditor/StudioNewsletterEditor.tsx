import React, { useCallback, useEffect, useRef, useState } from "react";
import StudioEditor from "@grapesjs/studio-sdk/react";
import type {
  CustomThemeConfig,
  ProjectData,
  ProjectFile,
  OnUploadAssetsProps,
} from "@grapesjs/studio-sdk";
import type { Editor } from "grapesjs";
import "@grapesjs/studio-sdk/style";
import "./StudioNewsletterEditor.css";
import axiosInstance from "../../api/axiosInstance";

interface Props {
  /** Current article HTML to load into the editor. */
  value: string;
  /** Called with the exported, email-ready HTML on each change ("" when empty). */
  onChange: (html: string) => void;
}

/** How long after the last edit to export + propagate the HTML. */
const EXPORT_DEBOUNCE_MS = 400;

type AppTheme = "dark" | "light";

const readAppTheme = (): AppTheme =>
  document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";

/** Current app theme ("data-theme" on <html>, toggled by the navbar); updates when it changes. */
const useAppTheme = (): AppTheme => {
  const [theme, setTheme] = useState<AppTheme>(readAppTheme);
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(readAppTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  return theme;
};

/** Builds the Studio theme from the app's CSS variables (index.css) for the active theme. */
const buildCustomTheme = (): CustomThemeConfig => {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    default: {
      colors: {
        global: {
          background1: v("--bg"),
          background2: v("--bgp"),
          background3: v("--bgp2"),
          backgroundHover: v("--bg2"),
          text: v("--txt"),
          border: v("--bdrs"),
          focus: v("--ora"),
          placeholder: v("--mu"),
        },
        primary: {
          background1: v("--ora"),
          background2: v("--or2"),
          background3: v("--or3"),
          backgroundHover: v("--or2"),
          text: "#ffffff",
        },
      },
    },
  };
};

/** Read a File as a base64 data URL (used so images embed inline, with no upload). */
const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * Export the project's single page as a self-contained HTML string.
 *
 * `studio:projectFiles` exports the (web) project with styles inlined into the
 * elements (email-client friendly). If the SDK externalises base64 images into
 * separate asset files, we re-inline them so the returned HTML keeps its `data:`
 * image sources (base64, no server links).
 */
const exportInlinedHtml = async (editor: Editor): Promise<string> => {
  const files: ProjectFile[] = await editor.runCommand("studio:projectFiles", {
    styles: "inline",
    skipProject: true,
  });

  if (!Array.isArray(files) || files.length === 0) return "";

  const htmlFile =
    files.find((f) => /html/i.test(f.mimeType)) ??
    files.find((f) => /\.html?$/i.test(f.filename));
  let html = htmlFile?.content ?? "";
  if (!html) return "";

  // Re-inline any externalised image assets back into the HTML as data URLs.
  const imageFiles = files.filter(
    (f) => f !== htmlFile && /^image\//i.test(f.mimeType)
  );
  for (const file of imageFiles) {
    const dataUrl = file.content.startsWith("data:")
      ? file.content
      : `data:${file.mimeType};base64,${file.content}`;
    const refPath = `${file.path ? file.path.replace(/\/$/, "") + "/" : ""}${file.filename}`;
    html = html.split(refPath).join(dataUrl);
    if (refPath !== file.filename) {
      html = html.split(file.filename).join(dataUrl);
    }
  }

  // Treat a page with no visible text and no images as empty (matches the
  // Newsletter submit guard that rejects empty content).
  const doc = new DOMParser().parseFromString(html, "text/html");
  const hasText = (doc.body?.textContent ?? "").trim().length > 0;
  const hasImg = !!doc.body?.querySelector("img");
  return hasText || hasImg ? html : "";
};

/**
 * Studio SDK (GrapesJS) visual editor adapted to the same `{ value, onChange }`
 * contract the newsletter previously used with Quill. Uses the web/HTML project
 * type so plain (incl. legacy Quill) HTML loads and round-trips. Client-only —
 * loaded via React.lazy + Suspense so it never runs during SSR.
 */
const StudioNewsletterEditor: React.FC<Props> = ({ value, onChange }) => {
  const editorRef = useRef<Editor | null>(null);
  const valueRef = useRef<string>(value);
  valueRef.current = value;
  const appTheme = useAppTheme();
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const onChangeRef = useRef(onChange);
  const readyRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The license key lives on the server; fetch it before mounting the editor.
  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get("/newsletter-articles/studio-license-key")
      .then((res) => {
        if (!cancelled) setLicenseKey(res.data?.data?.licenseKey ?? "DEMO_LOCALHOST_KEY");
      })
      .catch(() => {
        if (!cancelled) setLicenseKey("DEMO_LOCALHOST_KEY");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // The editor is remounted when the app theme changes; wait for it to be ready again.
  useEffect(() => {
    readyRef.current = false;
  }, [appTheme]);

  // Keep the latest onChange without re-creating the editor options.
  onChangeRef.current = onChange;

  const emitChange = useCallback((editor: Editor) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const html = await exportInlinedHtml(editor);
        onChangeRef.current(html);
      } catch {
        // Export failures are non-fatal; the next edit retries.
      }
    }, EXPORT_DEBOUNCE_MS);
  }, []);

  if (!licenseKey) return <div className="newsletter-studio-host" />;

  return (
    <div className="newsletter-studio-host">
      <StudioEditor
        key={appTheme}
        options={{
          licenseKey,
          theme: appTheme,
          customTheme: buildCustomTheme(),
          project: { type: "web" },
          assets: {
            storageType: "self",
            // Embed images inline as base64 data URLs — no upload endpoint (FR-003).
            onUpload: async ({ files }: OnUploadAssetsProps) => {
              const uploaded = await Promise.all(
                files.map(async (file) => ({
                  src: await fileToDataUrl(file),
                  name: file.name,
                  mimeType: file.type,
                  size: file.size,
                }))
              );
              return uploaded;
            },
            // Nothing is stored server-side; deleting just drops the inline data URL.
            onDelete: async () => {},
          },
          storage: {
            type: "self",
            // Seed the editor from the existing article HTML (legacy Quill HTML included).
            onLoad: async () => {
              const html = valueRef.current || "";
              const project: ProjectData = {
                pages: [{ name: "Newsletter", component: html }],
              };
              return { project };
            },
            // Autosave fires this; export the HTML and push it to the host.
            onSave: async ({ editor }: { editor: Editor; project: ProjectData }) => {
              const html = await exportInlinedHtml(editor);
              onChangeRef.current(html);
            },
            autosaveChanges: 100,
            autosaveIntervalMs: 10000,
          },
        }}
        onEditor={(editor: Editor) => {
          editorRef.current = editor;
        }}
        onReady={() => {
          readyRef.current = true;
        }}
        onUpdate={(_projectData: ProjectData, editor: Editor) => {
          // Ignore updates emitted while loading the initial project.
          if (!readyRef.current) return;
          emitChange(editor);
        }}
      />
    </div>
  );
};

export default StudioNewsletterEditor;
