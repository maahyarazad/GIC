import React from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import './index.css';
import RootProviders from "./RootProviders";
import { store } from "./store"; // adjust path if needed
import { HeadProvider, HeadManager } from "./HeadManager";

interface ClientMeta {
  name?: string;
  property?: string;
  content?: string;
}

interface ClientLink {
  rel: string;
  href: string;
}

// On client, head manager can be a no-op that updates nothing.
// Provide same API to avoid runtime errors.
const clientHeadManager: HeadManager = {
  pushTitle: (t?: string) => {
    if (t) document.title = t;
  },
  pushMeta: (m?: ClientMeta) => {
    if (!m) return;
    const meta = document.createElement("meta");
    if (m.name) meta.setAttribute("name", m.name);
    if (m.property) meta.setAttribute("property", m.property);
    meta.setAttribute("content", m.content || "");
    document.head.appendChild(meta);
  },
  pushLink: (l?: ClientLink) => {
    if (!l) return;
    const link = document.createElement("link");
    link.rel = l.rel;
    link.href = l.href;
    document.head.appendChild(link);
  },
  pushScript: (s?: string) => {
    // No-op on client
  },
  renderToString: () => "", // optional for client; returns empty string
  getState: () => ({ title: null, metas: [], links: [], scripts: [] }) // optional
};

// Hydrate React app
const rootElement = document.getElementById("root");
if (rootElement) {
  hydrateRoot(
    rootElement,
    <HeadProvider manager={clientHeadManager}>
      <RootProviders store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </RootProviders>
    </HeadProvider>
  );
}
