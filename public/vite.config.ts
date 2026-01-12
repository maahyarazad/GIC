import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // IMPORTANT
    },
  },
build: {
    rollupOptions: {
      input: "index.html",
    },
    outDir: "dist/client",
  },
ssr: {
  noExternal: [
    "react-router-dom",
    "react",
    "react-dom"
  ],
}
});