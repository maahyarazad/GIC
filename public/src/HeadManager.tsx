import React, { createContext, useContext, ReactNode } from "react";

export interface MetaTag {
  name?: string;
  property?: string;
  content: string;
  rel?: string;
  href?: string;
}

export interface LinkTag {
  rel: string;
  href: string;
}

export interface HeadManager {
  pushTitle(title: string): void;
  pushMeta(meta: MetaTag): void;
  pushLink(link: LinkTag): void;
  pushScript(scriptStr: string): void;
  renderToString(): string;
  getState(): {
    title: string | null;
    metas: MetaTag[];
    links: LinkTag[];
    scripts: string[];
  };
}

export function createHeadManager(): HeadManager {
  const state = {
    title: null as string | null,
    metas: [] as MetaTag[],
    links: [] as LinkTag[],
    scripts: [] as string[],
  };

  return {
    pushTitle(title: string) {
      state.title = title;
    },
    pushMeta(meta: MetaTag) {
      state.metas.push(meta);
    },
    pushLink(link: LinkTag) {
      state.links.push(link);
    },
    pushScript(scriptStr: string) {
      state.scripts.push(scriptStr);
    },
    renderToString() {
      let out = "";
      if (state.title) out += `<title>${escapeHtml(state.title)}</title>\n`;
      state.metas.forEach((m) => {
        if (m.name) out += `<meta name="${escapeHtml(m.name)}" content="${escapeHtml(m.content)}">\n`;
        else if (m.property) out += `<meta property="${escapeHtml(m.property)}" content="${escapeHtml(m.content)}">\n`;
      });
      state.links.forEach((l) => {
        out += `<link rel="${escapeHtml(l.rel)}" href="${escapeHtml(l.href)}">\n`;
      });
      state.scripts.forEach((s) => {
        out += `<script type="application/ld+json">${s}</script>\n`;
      });
      return out;
    },
    getState() {
      return { ...state };
    },
  };
}

function escapeHtml(s: string = ""): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const HeadContext = createContext<HeadManager | null>(null);

interface HeadProviderProps {
  manager: HeadManager;
  children: ReactNode;
}

export function HeadProvider({ manager, children }: HeadProviderProps) {
  return <HeadContext.Provider value={manager}>{children}</HeadContext.Provider>;
}

export function useHeadManager(): HeadManager {
  const manager = useContext(HeadContext);
  if (!manager) {
    throw new Error("useHeadManager must be used within a HeadProvider");
  }
  return manager;
}
