// src/components/EnterButton.jsx
import React from "react";

export default function EnterButton() {
  const onTap = () => {
    // Fire the same event your desktop users trigger with E
    const ev = new KeyboardEvent("keydown", { key: "e", code: "KeyE" });
    document.dispatchEvent(ev);
    window.dispatchEvent(ev);
  };

  return (
    <button
      className="enter-btn"
      onClick={onTap}
      aria-label="Enter building"
    >
      Enter
    </button>
  );
}
