// src/components/EnterButton.jsx
import React from "react";
import useControls from "../store/useControls.js";

/**
 * Fixed overlay "Enter" button.
 * - Pulses red when canEnter is true (near a station).
 * - Calls enterNearest() from the store (mobile-safe direct nav).
 * - Pinned bottom-right by default. Use corner="left" to flip.
 */
export default function EnterButton({ corner = "right", label = "Enter" }) {
  const canEnter = useControls((s) => s.canEnter);
  const enterNearest = useControls((s) => s.enterNearest);
  const isRight = corner === "right";

  const style = {
    position: "fixed",
    bottom: "calc(20px + env(safe-area-inset-bottom))",
    [isRight ? "right" : "left"]:
      `calc(20px + env(safe-area-inset-${isRight ? "right" : "left"}))`,
    zIndex: 2147483647,
    padding: "16px 20px",         // bigger
    borderRadius: 18,
    border: "none",
    fontSize: "16px",
    fontWeight: 800,
    letterSpacing: "0.4px",
    color: "#fff",
    background: canEnter
      ? "linear-gradient(180deg, #ff3b3b, #d92626)" // red when active
      : "rgba(0,0,0,.78)",
    cursor: canEnter ? "pointer" : "default",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "manipulation",
    pointerEvents: "auto",
    transform: "translateZ(0) scale(1.12)", // a bit larger
    boxShadow: canEnter
      ? "0 0 14px rgba(255,60,60,.7), 0 0 30px rgba(255,60,60,.4)"
      : "0 8px 20px rgba(0,0,0,.28)",
    transition: "box-shadow .18s ease, background .18s ease, transform .12s ease",
  };

  const onClick = () => {
    if (!canEnter) return;
    enterNearest();
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <button
      style={style}
      className={canEnter ? "enter-btn glow-red" : "enter-btn"}
      onClick={onClick}
      aria-label="Enter building"
      aria-disabled={!canEnter}
    >
      {label}
    </button>
  );
}
