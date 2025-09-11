// src/store/useControls.js
import { create } from "zustand";

const useControls = create((set, get) => ({
  // ---- Driving joystick (existing) ----
  steer: { x: 0, y: 0 },
  setSteer: (x, y) => set({ steer: { x, y } }),

  // ---- Enter button state (existing from prior steps) ----
  canEnter: false,
  nearestStation: null,
  setCanEnter: (v) => set({ canEnter: v }),
  setNearestStation: (st) => set({ nearestStation: st, canEnter: !!st }),
  enterNearest: () => {
    const st = get().nearestStation;
    if (st?.url) {
      window.location.href = st.url;
    } else {
      const ev = new KeyboardEvent("keydown", { key: "e", code: "KeyE" });
      document.dispatchEvent(ev);
      window.dispatchEvent(ev);
    }
  },

  // ---- NEW: mode switching (car <-> foot) ----
  mode: "car", // 'car' | 'foot'
  setMode: (m) => set({ mode: m }),
  toggleMode: () => set((s) => ({ mode: s.mode === "car" ? "foot" : "car" })),

  // ---- NEW: foot pose (for spawning bullets from player heading) ----
  footPose: { x: 0, y: 0.02, z: 0, heading: 0 },
  setFootPose: (pose) => set({ footPose: pose }),

  // ---- NEW: bullet event queue (OnFoot -> World/BulletLayer) ----
  bulletQueue: [], // array of { pos:[x,y,z], dir:[x,y,z], speed?:number }
  spawnBullet: (b) => set((s) => ({ bulletQueue: [...s.bulletQueue, b] })),
  shiftBullet: () => set((s) => ({ bulletQueue: s.bulletQueue.slice(1) })),
}));

export default useControls;
