// src/components/ClockTower.jsx
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

/**
 * A simple 4-sided clock tower that shows the user's real local time.
 * - Analog faces on N/S/E/W sides (always current using Date()).
 * - Subtle emissive face so it reads at night.
 *
 * Props:
 *   position: [x,y,z] ground position of the tower base (y is ignored for base, tower sits on ground)
 *   height: total height of the tower (default ~4)
 *   faceSize: diameter of the clock face (default ~1.2)
 */
export default function ClockTower({ position = [-8, 0, -8], height = 4, faceSize = 1.2 }) {
  const hourRef = useRef();
  const minuteRef = useRef();
  const secondRef = useRef();
  const hourRefB = useRef();
  const minuteRefB = useRef();
  const secondRefB = useRef();
  const hourRefL = useRef();
  const minuteRefL = useRef();
  const secondRefL = useRef();
  const hourRefR = useRef();
  const minuteRefR = useRef();
  const secondRefR = useRef();

  // update hands every frame (cheap) using real time
  useFrame(() => {
    const now = new Date();
    const s = now.getSeconds() + now.getMilliseconds() / 1000;
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;

    // angles: 12 o'clock = up (+Y). We rotate around Z axis (faces look along ±Z or ±X).
    const secA = -((s / 60) * Math.PI * 2);
    const minA = -((m / 60) * Math.PI * 2);
    const hourA = -((h / 12) * Math.PI * 2);

    // Front (+Z)
    if (secondRef.current) secondRef.current.rotation.z = secA;
    if (minuteRef.current) minuteRef.current.rotation.z = minA;
    if (hourRef.current) hourRef.current.rotation.z = hourA;

    // Back (-Z)
    if (secondRefB.current) secondRefB.current.rotation.z = secA;
    if (minuteRefB.current) minuteRefB.current.rotation.z = minA;
    if (hourRefB.current) hourRefB.current.rotation.z = hourA;

    // Left (-X)
    if (secondRefL.current) secondRefL.current.rotation.z = secA;
    if (minuteRefL.current) minuteRefL.current.rotation.z = minA;
    if (hourRefL.current) hourRefL.current.rotation.z = hourA;

    // Right (+X)
    if (secondRefR.current) secondRefR.current.rotation.z = secA;
    if (minuteRefR.current) minuteRefR.current.rotation.z = minA;
    if (hourRefR.current) hourRefR.current.rotation.z = hourA;
  });

  const bodyW = 1.6;
  const bodyD = 1.6;
  const baseH = 0.5;
  const shaftH = Math.max(2.2, height - (baseH + 0.8));
  const capH = 0.3;
  const faceZ = (bodyD / 2) + 0.02;
  const faceX = (bodyW / 2) + 0.02;

  // Hand lengths (relative to face size)
  const r = faceSize * 0.48;
  const lenHour = r * 0.55;
  const lenMinute = r * 0.82;
  const lenSecond = r * 0.9;

  const Hand = ({ refObj, length, width = 0.04, color = "#111", emissive = "#000" }) => (
    <group ref={refObj}>
      {/* Position so the hand rotates around the center and extends upward */}
      <mesh position={[0, length / 2, 0.01]}>
        <boxGeometry args={[width, length, 0.02]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.15} />
      </mesh>
    </group>
  );

  const Face = ({ rotation = [0, 0, 0], hourR, minuteR, secondR }) => (
    <group rotation={rotation}>
      {/* Face plate (white) */}
      <mesh position={[0, 0, faceZ]}>
        <circleGeometry args={[faceSize * 0.5, 64]} />
        <meshStandardMaterial color="#ffffff" emissive="#94a3b8" emissiveIntensity={0.15} />
      </mesh>

      {/* Ticks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const rr = faceSize * 0.45;
        const x = Math.sin(a) * rr;
        const y = Math.cos(a) * rr;
        const long = i % 3 === 0;
        return (
          <mesh key={i} position={[x, y, faceZ + 0.01]} rotation={[0, 0, -a]}>
            <boxGeometry args={[long ? 0.04 : 0.02, long ? 0.16 : 0.08, 0.01]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        );
      })}

      {/* Hub */}
      <mesh position={[0, 0, faceZ + 0.015]}>
        <circleGeometry args={[0.04, 24]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Hands (drawn slightly above face) */}
      <group position={[0, 0, faceZ + 0.02]}>
        <Hand refObj={hourR} length={lenHour} width={0.06} color="#0f172a" />
        <Hand refObj={minuteR} length={lenMinute} width={0.045} color="#0f172a" />
        <Hand refObj={secondR} length={lenSecond} width={0.02} color="#e11d48" emissive="#e11d48" />
      </group>
    </group>
  );

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* Base */}
      <mesh position={[0, baseH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[bodyW * 1.4, baseH, bodyD * 1.4]} />
        <meshStandardMaterial color="#3b4256" />
      </mesh>

      {/* Shaft */}
      <mesh position={[0, baseH + shaftH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[bodyW, shaftH, bodyD]} />
        <meshStandardMaterial color="#4b556b" />
      </mesh>

      {/* Cap */}
      <mesh position={[0, baseH + shaftH + capH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[bodyW * 1.1, capH, bodyD * 1.1]} />
        <meshStandardMaterial color="#303648" />
      </mesh>

      {/* Clock faces mounted near top of shaft on all 4 sides */}
      <group position={[0, baseH + shaftH * 0.65, 0]}>
        {/* Front (+Z) */}
        <Face rotation={[0, 0, 0]} hourR={hourRef} minuteR={minuteRef} secondR={secondRef} />
        {/* Back (-Z) */}
        <group rotation={[0, Math.PI, 0]}>
          <Face rotation={[0, 0, 0]} hourR={hourRefB} minuteR={minuteRefB} secondR={secondRefB} />
        </group>
        {/* Left (-X) */}
        <group rotation={[0, -Math.PI / 2, 0]}>
          <Face rotation={[0, 0, 0]} hourR={hourRefL} minuteR={minuteRefL} secondR={secondRefL} />
        </group>
        {/* Right (+X) */}
        <group rotation={[0, Math.PI / 2, 0]}>
          <Face rotation={[0, 0, 0]} hourR={hourRefR} minuteR={minuteRefR} secondR={secondRefR} />
        </group>
      </group>

      {/* Subtle light so faces read at night */}
      <pointLight position={[0, baseH + shaftH * 0.7, 0]} intensity={0.7} distance={8} color="#cbd5e1" />
    </group>
  );
}
