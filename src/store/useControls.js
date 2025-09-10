// src/store/useControls.js
import { create } from "zustand";

/**
 * On-screen joystick.
 * steer.x, steer.y are in range [-1, 1].
 *   x: -1 left, +1 right
 *   y: -1 up (forward), +1 down (backward)
 */
const useControls = create((set) => ({
  steer: { x: 0, y: 0 },
  setSteer: (x, y) => set({ steer: { x, y } }),
}));

export default useControls;
