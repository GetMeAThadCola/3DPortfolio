// src/store/useUI.js
import { create } from "zustand";
const useUI = create((set) => ({
  resumeOpen: false,
  openResume: () => set({ resumeOpen: true }),
  closeResume: () => set({ resumeOpen: false })
}));
export default useUI;
