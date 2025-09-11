// src/components/HopButton.jsx
import React from "react";
import useControls from "../store/useControls.js";

export default function HopButton({ corner = "left" }) {
  const mode = useControls((s) => s.mode);
  const toggleMode = useControls((s) => s.toggleMode);
  const isRight = corner === "right";

  const style = {
    position: "fixed",
    bottom: "calc(92px + env(safe-area-inset-bottom))", // leave room over the wheel
    [isRight ? "right" : "left"]: "16px",
    zIndex: 2147483647,
    padding: "12px 16px",
    borderRadius: 14,
    border: "none",
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: "0.3px",
    color: "#fff",
    background: "rgba(0,0,0,.78)",
    boxShadow: "0 6px 18px rgba(0,0,0,.25)",
  };

  return (
    <button style={style} onClick={toggleMode}>
      {mode === "car" ? "Hop Out" : "Drive"}
    </button>
  );
}
