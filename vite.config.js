// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "zustand": "zustand/index.mjs",
      "zustand/middleware": "zustand/middleware/index.mjs",
    },
  },
});
