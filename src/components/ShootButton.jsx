// src/components/ShootButton.jsx
import React from "react";
import useControls from "../store/useControls.js";

export default function ShootButton({ corner = "right" }) {
  const mode = useControls((s) => s.mode);
  const footPose = useControls((s) => s.footPose);
  const spawnBullet = useControls((s) => s.spawnBullet);
  const isRight = corner === "right";

  if (mode !== "foot") return null;

  const style = {
    position: "fixed",
    bottom: "calc(20px + env(safe-area-inset-bottom))",
    [isRight ? "right" : "left"]: "16px",
    zIndex: 2147483647,
    padding: "16px 20px",
    borderRadius: 18,
    border: "none",
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: "0.4px",
    color: "#fff",
    background: "linear-gradient(180deg, #ff3b3b, #d92626)",
    boxShadow: "0 0 14px rgba(255,60,60,.7), 0 0 30px rgba(255,60,60,.4)",
  };

  const onShoot = () => {
    // spawn from foot pose heading
    const { x, y, z, heading } = footPose;
    const dir = [Math.sin(heading), 0, Math.cos(heading)];
    const pos = [x + dir[0] * 0.35, (y ?? 0.02) + 0.25, z + dir[2] * 0.35];
    spawnBullet({ pos, dir, speed: 18 });
    if (navigator.vibrate) navigator.vibrate(10);
  };

  return (
    <button style={style} onClick={onShoot} aria-label="Shoot">
      Shoot
    </button>
  );
}
