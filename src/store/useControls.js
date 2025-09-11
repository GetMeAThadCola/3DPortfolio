// src/store/useControls.js
import { create } from "zustand";

const useControls = create((set, get) => ({
  // Driving input (you already had this)
  steer: { x: 0, y: 0 },
  setSteer: (x, y) => set({ steer: { x, y } }),

  // ---------------------------
  // Mobile "Enter" support
  // ---------------------------
  canEnter: false,                 // lit state for the button
  nearestStation: null,            // { label, url, x, z, r, dist }
  setCanEnter: (v) => set({ canEnter: v }),
  setNearestStation: (st) => set({ nearestStation: st, canEnter: !!st }),

  // Called by the Enter button (works on mobile; no fake keyboard needed)
  enterNearest: () => {
    const st = get().nearestStation;
    if (st && st.url) {
      // Use same-tab nav for best reliability on mobile (no popup blockers)
      window.location.href = st.url;
    } else {
      // Fallback to KeyE if nothing found (keeps desktop behavior)
      const ev = new KeyboardEvent("keydown", { key: "e", code: "KeyE" });
      document.dispatchEvent(ev);
      window.dispatchEvent(ev);
    }
  },
}));

export default useControls;
