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
      rollupOptions: {
        onwarn(warning, warn) {
          // Suppress gray-matter eval warning (third-party library issue, not a security problem	)
          if (
            warning.code === "EVAL" ||
            (warning.message && warning.message.includes("gray-matter"))
          ) {
            return;
          }
          warn(warning);
        },
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "mui-vendor": [
              "@mui/material",
              "@mui/icons-material",
              "@emotion/react",
              "@emotion/styled",
            ],
            "markdown-vendor": [
              "react-markdown",
              "remark-gfm",
              "remark-directive",
              "rehype-sanitize",
            ],
            "redux-vendor": ["@reduxjs/toolkit", "react-redux"],
          },
        },
      },
    },
  };
});
