// src/store/useControls.js
import { create } from "zustand";

export default create((set, get) => ({
  // virtual stick (shared by car + foot)
  steer: { x: 0, y: 0 },
  setSteer: (x, y) => set({ steer: { x, y } }),

  // "car" | "foot"
  mode: "car",
  toggleMode: () => set((s) => ({ mode: s.mode === "car" ? "foot" : "car" })),

  // building enter UX
  canEnter: false,
  setCanEnter: (v) => set({ canEnter: v }),
  nearestStation: null,               // { label, url, x, z, r }
  setNearestStation: (station) => set({ nearestStation: station }),

  enterNearest: () => {
    const s = get().nearestStation;
    if (s?.url) window.open(s.url, s.external ? "_blank" : "_self", "noopener");
  },
}));
