// src/components/EnterButton.jsx
import React from "react";

/**
 * A fixed overlay button that fires the same logic as pressing "E".
 * - corner: "right" | "left" (bottom corner to pin to)
 * - label: button text (default: "Enter")
 */
export default function EnterButton({ corner = "right", label = "Enter" }) {
  const isRight = corner === "right";

  const style = {
    position: "fixed",
    bottom: "calc(16px + env(safe-area-inset-bottom))",
    [isRight ? "right" : "left"]: `calc(16px + env(safe-area-inset-${isRight ? "right" : "left"}))`,
    zIndex: 2147483647, // stay above everything
    padding: "12px 16px",
    borderRadius: 14,
    border: "none",
    background: "rgba(0,0,0,0.78)",
    color: "#fff",
    fontWeight: 700,
    letterSpacing: "0.4px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    cursor: "pointer",
    userSelect: "none",
    WebkitUserSelect: "none",
    touchAction: "manipulation",
    pointerEvents: "auto",
  };

  const onTap = () => {
    // Trigger the same handler your desktop users get with the E key
    const ev = new KeyboardEvent("keydown", { key: "e", code: "KeyE" });
    document.dispatchEvent(ev);
    window.dispatchEvent(ev);
  };

  return (
    <button style={style} onClick={onTap} aria-label="Enter building">
      {label}
    </button>
  );
}
