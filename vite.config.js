import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { plugin as markdown } from "vite-plugin-markdown";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  return {
    define: {
      "process.env": JSON.stringify(env),
    },
    plugins: [react(), markdown()],
    optimizeDeps: {
      include: ["prismjs"],
    },
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:5000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "markdown-vendor": [
              "markdown-it",
              "markdown-it-emoji",
              "markdown-it-footnote",
              "markdown-it-task-checkbox",
              "markdown-it-container",
              "markdown-it-anchor",
              "front-matter",
              "js-yaml",
              "prismjs",
            ],
            "redux-vendor": ["@reduxjs/toolkit", "react-redux"],
          },
        },
      },
    },
  };
});
