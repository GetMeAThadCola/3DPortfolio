// src/components/BuildingStation.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Html, Text3D } from "@react-three/drei";
import usePlayer from "../store/usePlayer.js";

export default function BuildingStation({
  position = [0, 0, 0],
  size = [1.6, 1.2, 1.2],
  label = "Open",
  url = "/",
  radius = 1.6,
  color = "#1f2b46",
  litRatio = 0.5,
  neonColor = "#00e5ff",
}) {
  const playerPos = usePlayer((s) => s.pos);
  const [near, setNear] = useState(false);
  const ref = useRef();
  const [w, h, d] = size;

  // proximity
  useEffect(() => {
    const dx = playerPos[0] - position[0];
    const dz = playerPos[2] - position[2];
    const dist = Math.hypot(dx, dz);
    setNear(dist <= radius + 0.6);
  }, [playerPos, position, radius]);

  // open link with E
  useEffect(() => {
    const onKey = (e) => {
      if (!near) return;
      if (e.code === "KeyE") window.open(url, "_blank");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [near, url]);

  // windows
  const windows = useMemo(() => {
    const rows = Math.max(2, Math.round(h * 4));
    const colsFB = Math.max(2, Math.round(w * 4));
    const colsLR = Math.max(2, Math.round(d * 4));
    const list = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < colsFB; c++) {
        const X = -w / 2 + (c + 0.5) * (w / colsFB);
        const Y = -h / 2 + (r + 0.5) * (h / rows);
        list.push({ pos: [X, Y, d / 2 + 0.01], ry: 0, lit: Math.random() < litRatio });
        list.push({ pos: [X, Y, -d / 2 - 0.01], ry: Math.PI, lit: Math.random() < litRatio });
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < colsLR; c++) {
        const Z = -d / 2 + (c + 0.5) * (d / colsLR);
        const Y = -h / 2 + (r + 0.5) * (h / rows);
        list.push({ pos: [w / 2 + 0.01, Y, Z], ry: -Math.PI / 2, lit: Math.random() < litRatio });
        list.push({ pos: [-w / 2 - 0.01, Y, Z], ry: Math.PI / 2, lit: Math.random() < litRatio });
      }
    }
    return list;
  }, [w, h, d, litRatio]);

  // Sign placement
  const signY = h / 2 + 0.25;
  const signOffset = d / 2 + 0.06;

  const SignText = ({ back = false }) => {
    const z = back ? -signOffset : signOffset;
    const rotY = back ? Math.PI : 0;

    return (
      <group position={[0, signY, z]} rotation={[0, rotY, 0]}>
        <Text3D
          font="/fonts/helvetiker_regular.typeface.json"
          size={0.4}
          height={0.05}
          curveSegments={8}
          bevelEnabled={false}
          castShadow={false}
          receiveShadow={false}
        >
          {label}
          <meshStandardMaterial
            color="#ffffff"
            emissive={neonColor}
            emissiveIntensity={1.2}
            depthTest={false}
            toneMapped={false}
          />
        </Text3D>
      </group>
    );
  };

  return (
    <group ref={ref} position={[position[0], h / 2, position[2]]}>
      {/* Building */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Door on +Z */}
      <mesh position={[0, -h / 2 + 0.32, d / 2 + 0.02]}>
        <boxGeometry args={[0.48, 0.62, 0.04]} />
        <meshStandardMaterial color="#0e1422" />
      </mesh>
      <mesh position={[0.18, -h / 2 + 0.32, d / 2 + 0.05]}>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshStandardMaterial color="#b7c2d9" />
      </mesh>

      {/* Windows */}
      {windows.map((win, i) => (
        <mesh key={i} position={win.pos} rotation={[0, win.ry, 0]}>
          <planeGeometry args={[0.11, 0.11]} />
          <meshStandardMaterial
            emissive={win.lit ? "#b5d7ff" : "#0a0f18"}
            emissiveIntensity={win.lit ? 1.25 : 0.12}
            color={win.lit ? "#e9f5ff" : "#0a0f18"}
            toneMapped={false}
          />
        </mesh>
      ))}

      {/* Floating Text signs (front & back only) */}
      <SignText back={false} />
      <SignText back={true} />

      {/* Prompt (front only) */}
      <Html
        center
        transform
        position={[0, -h / 2 + 0.9, signOffset + 0.05]}
        distanceFactor={7.5}
        zIndexRange={[100, 0]}
      >
        <div
          className={`big-prompt ${near ? "active" : ""}`}
          style={{ pointerEvents: "none", fontSize: "1.1rem" }}
        >
          🚪 Press <b>E</b> to Enter
        </div>
      </Html>
    </group>
  );
}
