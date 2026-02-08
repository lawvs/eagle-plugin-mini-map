import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // Use relative path for Eagle Plugin, but absolute path for GitHub Pages deployment
  base: mode === "production" ? "/eagle-plugin-mini-map/" : "./",
  plugins: [react(), tailwindcss()],
}));
