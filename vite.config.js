// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Force ESM entry points so Amplify doesn't pull CJS (prevents "require is not defined")
      "zustand": "zustand/index.mjs",
      "zustand/middleware": "zustand/middleware/index.mjs",
    },
  },
  // optional but handy for debugging prod builds:
  // build: { sourcemap: true },
});
