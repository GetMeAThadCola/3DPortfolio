// src/store/useControls.js
import { create } from "zustand";

const useControls = create((set) => ({
  // existing fields…
  steer: { x: 0, y: 0 },
  setSteer: (x, y) => set({ steer: { x, y } }),

  // NEW: enter availability
  canEnter: false,
  setCanEnter: (v) => set({ canEnter: v }),
}));

export default useControls;
