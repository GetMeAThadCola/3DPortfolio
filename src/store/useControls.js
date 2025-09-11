// src/store/useControls.js
import { create } from "zustand";

const useControls = create((set, get) => ({
  // driving & on-foot
  mode: "car", // "car" | "foot"
  toggleMode: () => set((s) => ({ mode: s.mode === "car" ? "foot" : "car" })),

  // joystick / keyboard vector
  steer: { x: 0, y: 0 },
  setSteer: (x, y) => set({ steer: { x, y } }),

  // enter prompt + nearest station info for UI
  canEnter: false,
  setCanEnter: (v) => set({ canEnter: v }),
  nearestStation: null,
  setNearestStation: (station) => set({ nearestStation: station }),
}));

export default useControls;
