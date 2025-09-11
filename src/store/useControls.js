// src/store/useControls.js
import { create } from "zustand";

const useControls = create((set, get) => ({
  mode: "car", // "car" | "foot"
  toggleMode: () => set((s) => ({ mode: s.mode === "car" ? "foot" : "car" })),

  // joystick vector (only meaningful in car mode)
  steer: { x: 0, y: 0 },
  setSteer: (x, y) => set((s) => (s.mode === "car" ? { steer: { x, y } } : s)),

  // enter prompt + station info for UI
  canEnter: false,
  setCanEnter: (v) => set({ canEnter: v }),
  nearestStation: null,
  setNearestStation: (station) => set({ nearestStation: station }),
}));

export default useControls;
