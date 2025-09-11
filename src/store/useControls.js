// src/store/useControls.js
import { create } from "zustand";

const useControls = create((set, get) => ({
  // virtual joystick
  steer: { x: 0, y: 0 },
  setSteer: (x, y) => set({ steer: { x, y } }),

  // mode: "car" or "foot"
  mode: "car",
  setMode: (mode) => set({ mode }),
  toggleMode: () => set((s) => ({ mode: s.mode === "car" ? "foot" : "car" })),

  // building enter UX
  canEnter: false,
  setCanEnter: (v) => set({ canEnter: v }),
  nearestStation: null, // { label, url, x, z, r }
  setNearestStation: (station) => set({ nearestStation: station }),
  enterNearest: () => {
    const st = get().nearestStation;
    if (st?.url) window.open(st.url, st.external ? "_blank" : "_self", "noopener");
  },
}));

export default useControls;
