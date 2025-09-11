// src/store/usePlayer.js
import { create } from "zustand";

const usePlayer = create((set) => ({
  pos: [0, 0.02, 2.5],
  setPos: (x, y, z) => set({ pos: [x, y, z] }),
}));

export default usePlayer;
