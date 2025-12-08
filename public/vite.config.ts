import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Vite SSR config
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    // Separate client and server builds
    ssr: false,

    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
  ssr: {
    // Externalize dependencies that should not be bundled in SSR
    external: ["react-helmet-async", "axios"],
    noExternal: ["@reduxjs/toolkit"], // bundle internal packages if needed
  },
  server: {
    port: 5173,
  },
});
