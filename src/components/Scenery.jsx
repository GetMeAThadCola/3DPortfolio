// src/components/Scenery.jsx
import React, { useMemo } from "react";
import * as THREE from "three";

/**
 * Scenery: distributes light poles, stop signs, grass patches, and bushes.
 *
 * Props:
 *  - islandRadius: number (default 14)
 *  - buildingZones: Array<{ x:number, z:number, r:number }>
 *  - roadBand: number (default 1.2) width of X/Z axis roads to keep clear
 *  - seed: number (optional) for deterministic placement
 *  - counts: { poles:number, signs:number, grass:number, bushes:number }
 */
export default function Scenery({
  islandRadius = 14,
  buildingZones = [],
  roadBand = 1.2,
  seed = 42,
  counts = { poles: 12, signs: 10, grass: 120, bushes: 60 },
}) {
  // simple seeded RNG
  function makeRNG(s) {
    let state = s >>> 0;
    return () => {
      state |= 0;
      state = (state + 0x6D2B79F5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rnd = useMemo(() => makeRNG(seed), [seed]);

  const margin = 1.2;
  const maxR = islandRadius - margin;

  const insideIsland = (x, z) => Math.hypot(x, z) <= maxR;
  const outsideRoads = (x, z) => Math.abs(x) > roadBand && Math.abs(z) > roadBand;
  const outsideBuildings = (x, z) =>
    buildingZones.every((bz) => Math.hypot(x - bz.x, z - bz.z) > bz.r);

  function samplePos(tries = 50) {
    for (let i = 0; i < tries; i++) {
      const r = Math.sqrt(rnd()) * maxR;
      const a = rnd() * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      if (insideIsland(x, z) && outsideRoads(x, z) && outsideBuildings(x, z)) {
        return [x, z];
      }
    }
    return null;
  }

  // generate placements
  const { poles, signs, grass, bushes } = useMemo(() => {
    const poles = [];
    const signs = [];
    const grass = [];
    const bushes = [];

    // Light poles
    for (let i = 0; i < counts.poles; i++) {
      const p = samplePos();
      if (!p) continue;
      const rot = rnd() * Math.PI * 2;
      poles.push({ x: p[0], z: p[1], rot });
    }

    // Stop signs (roughly face toward center)
    for (let i = 0; i < counts.signs; i++) {
      const p = samplePos();
      if (!p) continue;
      const rot = Math.atan2(-p[0], -p[1]);
      signs.push({ x: p[0], z: p[1], rot });
    }

    // Grass patches (store HSL as numbers)
    for (let i = 0; i < counts.grass; i++) {
      const p = samplePos();
      if (!p) continue;
      const s = 0.28 + rnd() * 0.35;
      const hue = 110 + rnd() * 30; // 110..140
      const sat = 55 + rnd() * 25;  // 55..80
      const light = 30 + rnd() * 20; // 30..50
      grass.push({ x: p[0], z: p[1], s, color: { h: hue, s: sat, l: light } });
    }

    // Bush clusters (store HSL as numbers)
    for (let i = 0; i < counts.bushes; i++) {
      const p = samplePos();
      if (!p) continue;
      const count = 2 + Math.floor(rnd() * 3); // 2..4 blobs
      const blobs = [];
      const base = 0.25 + rnd() * 0.28;
      for (let k = 0; k < count; k++) {
        const offA = rnd() * Math.PI * 2;
        const offR = rnd() * 0.18;
        const sx = Math.cos(offA) * offR;
        const sz = Math.sin(offA) * offR;
        const sy = rnd() * 0.12;
        const scale = base * (0.85 + rnd() * 0.5);
        const hue = 105 + rnd() * 30;
        const sat = 45 + rnd() * 30;
        const light = 24 + rnd() * 16;
        blobs.push({
          x: p[0] + sx,
          y: sy,
          z: p[1] + sz,
          s: scale,
          color: { h: hue, s: sat, l: light },
        });
      }
      bushes.push({ blobs });
    }

    return { poles, signs, grass, bushes };
  }, [counts, maxR, buildingZones, roadBand, rnd]);

  return (
    <group>
      {/* Light Poles */}
      {poles.map((p, i) => (
        <group key={`pole-${i}`} position={[p.x, 0, p.z]} rotation={[0, p.rot, 0]}>
          <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.06, 0.08, 0.04, 12]} />
            <meshStandardMaterial color="#2b2f3a" />
          </mesh>
          <mesh position={[0, 1.4, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 2.8, 12]} />
            <meshStandardMaterial color="#3b4252" metalness={0.5} roughness={0.6} />
          </mesh>
          <mesh position={[0.28, 2.55, 0]} rotation={[0, 0, Math.PI * 0.02]}>
            <boxGeometry args={[0.6, 0.04, 0.04]} />
            <meshStandardMaterial color="#3b4252" metalness={0.4} roughness={0.7} />
          </mesh>
          <mesh position={[0.58, 2.55, 0]}>
            <boxGeometry args={[0.26, 0.10, 0.14]} />
            <meshStandardMaterial color="#dbeafe" emissive="#9cc1ff" emissiveIntensity={0.85} />
          </mesh>
          <pointLight position={[0.60, 2.52, 0]} intensity={0.85} distance={6} color="#cfe3ff" />
        </group>
      ))}

      {/* Stop Signs */}
      {signs.map((s, i) => (
        <group key={`sign-${i}`} position={[s.x, 0, s.z]} rotation={[0, s.rot, 0]}>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 1.8, 12]} />
            <meshStandardMaterial color="#7a7f89" metalness={0.2} roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.75, 0.01]}>
            <circleGeometry args={[0.28, 8]} />
            <meshStandardMaterial color="#dc2626" emissive="#ff2d2d" emissiveIntensity={0.25} />
          </mesh>
          <mesh position={[0, 1.75, 0.012]}>
            <ringGeometry args={[0.24, 0.28, 32]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Simple "STOP" bars for readability */}
          <group position={[0, 1.75, 0.015]} scale={[0.22, 0.22, 1]}>
            <mesh position={[-0.46, 0.10, 0]}>
              <boxGeometry args={[0.16, 0.12, 0.001]} />
              <meshStandardMaterial color="#fff" />
            </mesh>
            <mesh position={[-0.20, 0.10, 0]}>
              <boxGeometry args={[0.16, 0.12, 0.001]} />
              <meshStandardMaterial color="#fff" />
            </mesh>
            <mesh position={[0.06, 0.10, 0]}>
              <boxGeometry args={[0.16, 0.12, 0.001]} />
              <meshStandardMaterial color="#fff" />
            </mesh>
            <mesh position={[0.32, 0.10, 0]}>
              <boxGeometry args={[0.16, 0.12, 0.001]} />
              <meshStandardMaterial color="#fff" />
            </mesh>
          </group>
        </group>
      ))}

      {/* Grass patches (HSL via THREE.Color) */}
      {grass.map((g, i) => {
        const c = new THREE.Color().setHSL(g.color.h / 360, g.color.s / 100, g.color.l / 100);
        return (
          <mesh
            key={`grass-${i}`}
            position={[g.x, 0.008, g.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <circleGeometry args={[g.s, 16]} />
            <meshStandardMaterial
              color={c}
              roughness={1}
              metalness={0}
              side={THREE.DoubleSide}
              emissive={c}
              emissiveIntensity={0.12}
            />
          </mesh>
        );
      })}

      {/* Bush clusters (HSL via THREE.Color) */}
      {bushes.map((b, i) => (
        <group key={`bush-${i}`}>
          {b.blobs.map((bl, k) => {
            const c = new THREE.Color().setHSL(
              bl.color.h / 360,
              bl.color.s / 100,
              bl.color.l / 100
            );
            return (
              <mesh
                key={k}
                position={[bl.x, bl.y + bl.s * 0.6, bl.z]}
                castShadow
                receiveShadow
              >
                <sphereGeometry args={[bl.s, 12, 12]} />
                <meshStandardMaterial
                  color={c}
                  roughness={0.9}
                  metalness={0.0}
                  emissive={c}
                  emissiveIntensity={0.1}
                />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}
