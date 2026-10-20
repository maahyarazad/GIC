import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import StudioNew from "./Components/StudioEditor/StudioNewsletterEditor";
import StudioOld from "./Components/StudioEditor/StudioOld";
const StudioNewsletterEditor = new URLSearchParams(location.search).get("old") ? StudioOld : StudioNew;

const q = new URLSearchParams(location.search);
if (q.get("t")) document.documentElement.setAttribute("data-theme", q.get("t")!);
if (q.get("toggle")) setTimeout(() => document.getElementById("toggle")!.click(), Number(q.get("toggle")));
const App = () => {
  const [html, setHtml] = useState("<h1>Hello</h1><p>Test body</p>");
  return (
    <div style={{ padding: 16 }}>
      <button id="toggle" onClick={() => {
        const n = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", n);
      }}>toggle</button>
      <StudioNewsletterEditor value={html} onChange={setHtml} />
    </div>
  );
};
createRoot(document.getElementById("root")!).render(<App />);
