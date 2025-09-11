// src/store/useControls.js
import { create } from "zustand";

const useControls = create((set, get) => ({
  mode: "car",
  toggleMode: () => set((s) => ({ mode: s.mode === "car" ? "foot" : "car" })),
  steer: { x: 0, y: 0 },
  setSteer: (x, y) => set((s) => (s.mode === "car" ? { steer: { x, y } } : s)),
  canEnter: false,
  setCanEnter: (v) => set({ canEnter: v }),
  nearestStation: null,
  setNearestStation: (station) => set({ nearestStation: station }),
}));

export default useControls;
