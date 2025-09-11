// src/components/EnterButton.jsx
import React from "react";
import useControls from "../store/useControls.js";

/**
 * Fixed overlay "Enter" button.
 * - Glows/pulses when `canEnter` is true (near a door).
 * - Fires the same logic as pressing the "E" key.
 * - Pinned bottom-right. Change `corner` to "left" if your wheel is on the right.
 */
export default function EnterButton({ corner = "right", label = "Enter" }) {
  const canEnter = useControls((s) => s.canEnter);
  const isRight = corner === "right";

  const base = {
    position: "fixed",
    bottom: "calc(18px + env(safe-area-inset-bottom))",
    [isRight ? "right" : "left"]:
      `calc(18px + env(safe-area-inset-${isRight ? "right" : "left"}))`,
    zIndex: 2147483647,
    padding: "14px 18px",
    borderRadius: 16,
    border: "none",
    fontSize: "16px",
    fontWeight: 800,
    letterSpacing: "0.4px",
    color: "#fff",
    background: canEnter
      ? "linear-gradient(180deg, rgba(0,229,255,.95), rgba(0,190,240,.95))"
      : "rgba(0,0,0,.78)",
    cursor: canEnter ? "pointer" : "default",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "manipulation",
    pointerEvents: "auto",
    transition: "transform .12s ease, box-shadow .2s ease, background .2s ease",
    // subtle scale so it's a bit bigger than before
    transform: "translateZ(0) scale(1.06)",
    // default shadow
    boxShadow: canEnter
      ? "0 0 14px rgba(0,229,255,.65), 0 0 28px rgba(0,229,255,.35)"
      : "0 6px 18px rgba(0,0,0,.25)",
  };

  const onTap = () => {
    if (!canEnter) return;
    // Trigger same behavior as pressing "E"
    const ev = new KeyboardEvent("keydown", { key: "e", code: "KeyE" });
    document.dispatchEvent(ev);
    window.dispatchEvent(ev);
    // (Optional) small haptic tap on mobile
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <button
      className={`enter-btn ${canEnter ? "glow" : ""}`}
      style={base}
      onClick={onTap}
      aria-label="Enter building"
      aria-disabled={!canEnter}
    >
      {label}
    </button>
  );
}
