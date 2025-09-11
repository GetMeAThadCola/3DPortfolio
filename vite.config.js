// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // DO NOT alias "zustand" itself (causes prefix collisions).
      // Only alias sub-entries if your build ever needs them:
      "zustand/traditional": "zustand/traditional/index.mjs",
      "zustand/vanilla": "zustand/vanilla/index.mjs",
      "zustand/middleware": "zustand/middleware/index.mjs",
      // If you never import these subpaths directly, you can even remove all three lines.
    },
  },
  // Optional: sourcemaps help debug CI builds
  // build: { sourcemap: true },
});
