// src/store/usePlayer.js
import { create } from "zustand";

const usePlayer = create((set) => ({
  pos: [0, 0, 0],
  setPos: (x, y, z) => set({ pos: [x, y, z] }),

  // (Optional) anything else you track:
  // speed: 0,
  // setSpeed: (v) => set({ speed: v }),
}));

export default usePlayer;