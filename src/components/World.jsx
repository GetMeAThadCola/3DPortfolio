// src/components/World.jsx
import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { PositionalAudio } from "@react-three/drei";
import * as THREE from "three";
import usePlayer from "../store/usePlayer.js";
import useControls from "../store/useControls.js";

/** ---- Tunables ---- */
const HIT_DIST   = 0.6;   // car→ped collision radius (meters)
const GHOST_RISE = 0.9;   // m/s upward
const GHOST_FADE = 0.35;  // opacity per second
const GHOST_SPIN = 0.6;   // rad/s spin while rising

// Audio (place your file in public/audio/)
const SCREAM_URL = "/audio/ped_scream.mp3";
const SCREAM_VOL = 0.7;       // 0..1
const SCREAM_MIN_RATE = 0.95; // randomize pitch slightly
const SCREAM_MAX_RATE = 1.10;

/** Match the links you use in App.jsx **/
const LINKS = {
  resumeUrl: "/resume.pdf",
  githubUrl: "https://github.com/GetMeAThadCola",
  linkedinUrl: "https://www.linkedin.com/in/huntertcarbone",
  projectsUrl: "https://github.com/GetMeAThadCola?tab=repositories",
  moreinfoUrl: "https://hunter-resume.vercel.app",
};

/** Stations: same centers as your <BuildingStation/>s
 *  r = larger usable area (tweak per station if you want)
 */
const STATIONS = [
  { label: "Resume",    x:  0,  z: -4, r: 3.0, url: LINKS.resumeUrl },
  { label: "GitHub",    x: 10,  z:  0, r: 2.8, url: LINKS.githubUrl },
  { label: "LinkedIn",  x:-10,  z:  0, r: 2.8, url: LINKS.linkedinUrl },
  { label: "Projects",  x:  0,  z: 10, r: 3.2, url: LINKS.projectsUrl },
  { label: "More Info", x:  3,  z: -5, r: 2.8, url: LINKS.moreinfoUrl },
];

/** small props **/
function Tree({ pos = [0, 0, 0], scale = 1 }) {
  return (
    <group position={pos} scale={scale}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.8, 10]} />
        <meshStandardMaterial color="#6b4b2a" />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#2d6a4f" />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#2a9d8f" />
      </mesh>
    </group>
  );
}

function StreetLamp({ pos = [0, 0, 0] }) {
  return (
    <group position={pos}>
      <mesh castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.4, 12]} />
        <meshStandardMaterial color="#2e3e60" />
      </mesh>
      <mesh position={[0, 0.75, 0.22]}>
        <boxGeometry args={[0.24, 0.06, 0.1]} />
        <meshStandardMaterial color="#3f5a92" />
      </mesh>
      <pointLight position={[0, 0.78, 0.22]} intensity={0.9} distance={3.2} />
    </group>
  );
}

function StopSign({ pos = [0, 0, 0], rotY = 0 }) {
  return (
    <group position={pos} rotation={[0, rotY, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.2, 10]} />
        <meshStandardMaterial color="#a0a0a0" />
      </mesh>
      <mesh position={[0, 0.75, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.02, 8]} />
        <meshStandardMaterial color="#c1121f" />
      </mesh>
    </group>
  );
}

/** Background building (windows + door) */
function BackgroundBuilding({ x, z, w, d, h, color }) {
  const rows = Math.max(2, Math.round(h * 3));
  const colsFB = Math.max(2, Math.round(w * 3));
  const colsLR = Math.max(2, Math.round(d * 3));
  const litRatio = 0.45;

  const windows = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < colsFB; c++) {
      const X = -w / 2 + (c + 0.5) * (w / colsFB);
      const Y = -h / 2 + (r + 0.5) * (h / rows);
      windows.push({ pos: [X, Y, d / 2 + 0.01], ry: 0, lit: Math.random() < litRatio });
      windows.push({ pos: [X, Y, -d / 2 - 0.01], ry: Math.PI, lit: Math.random() < litRatio });
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < colsLR; c++) {
      const Z = -d / 2 + (c + 0.5) * (d / colsLR);
      const Y = -h / 2 + (r + 0.5) * (h / rows);
      windows.push({ pos: [w / 2 + 0.01, Y, Z], ry: -Math.PI / 2, lit: Math.random() < litRatio });
      windows.push({ pos: [-w / 2 - 0.01, Y, Z], ry: Math.PI / 2, lit: Math.random() < litRatio });
    }
  }

  return (
    <group position={[x, h / 2, z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Door (+Z face) */}
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
            emissiveIntensity={win.lit ? 1.2 : 0.12}
            color={win.lit ? "#e9f5ff" : "#0a0f18"}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Pedestrian that can scream, then turn into a ghost and float away after a hit */
function Pedestrian({ start = [0, 0, 0], color = "#ff9f1c", doors = [], clampR = 13.6 }) {
  const ref = useRef();
  const normalG = useRef();
  const ghostG = useRef();

  // One shared material for all ghost parts so opacity fades together
  const ghostMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        emissive: "#88d8ff",
        emissiveIntensity: 0.28,
        transparent: true,
        opacity: 0.0,
      }),
    []
  );

  // scream audio
  const screamRef = useRef();

  const speed = 0.9;
  const target = useRef({ x: start[0], z: start[2] });
  const timer = useRef(0);

  const isGhost = useRef(false);
  const ghostAlpha = useRef(0);
  const screamed = useRef(false);
  const playerPos = usePlayer((s) => s.pos);

  // Prepare the scream (non-looping, positional)
  useEffect(() => {
    const a = screamRef.current;
    if (!a) return;
    try {
      a.setLoop(false);
      a.setRefDistance(4); // roll-off
      a.setVolume(0);      // start silent; set on hit
    } catch {/* noop */}
  }, []);

  useFrame((_, dt) => {
    if (!ref.current) return;

    // Toggle visibility based on state
    if (normalG.current) normalG.current.visible = !isGhost.current;
    if (ghostG.current)  ghostG.current.visible  =  isGhost.current;

    if (isGhost.current) {
      // Fly up, spin, fade out
      ref.current.position.y += GHOST_RISE * dt;
      ref.current.rotation.y += GHOST_SPIN * dt;

      ghostAlpha.current = Math.max(0, ghostAlpha.current - GHOST_FADE * dt);
      ghostMat.opacity = ghostAlpha.current;

      if (ghostAlpha.current <= 0.01) {
        ref.current.visible = false;
      }
      return;
    }

    // ----- Normal wandering AI -----
    timer.current -= dt;
    if (timer.current <= 0) {
      if (doors.length > 0 && Math.random() < 0.3) {
        const door = doors[(Math.random() * doors.length) | 0];
        target.current.x = door[0];
        target.current.z = door[1] + (Math.random() * 0.6 - 0.3);
      } else {
        const a = Math.random() * Math.PI * 2;
        const r = 2 + Math.random() * 4;
        target.current.x = ref.current.position.x + Math.cos(a) * r;
        target.current.z = ref.current.position.z + Math.sin(a) * r;
      }
      const tr = Math.hypot(target.current.x, target.current.z);
      if (tr > clampR) {
        const t = clampR / tr;
        target.current.x *= t;
        target.current.z *= t;
      }
      timer.current = 2 + Math.random() * 3;
    }

    // move toward target
    const p = ref.current.position;
    const dx = target.current.x - p.x;
    const dz = target.current.z - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.05) {
      const vx = (dx / dist) * speed * dt;
      const vz = (dz / dist) * speed * dt;
      p.x += vx; p.z += vz; p.y = 0.02;
      ref.current.rotation.y = Math.atan2(vx, vz);
    }

    // clamp inside wall
    const pr = Math.hypot(p.x, p.z);
    if (pr > clampR) {
      const t = clampR / pr;
      p.x *= t; p.z *= t;
    }

    // ----- Collision with player -> scream + become ghost -----
    if (playerPos) {
      const [px, , pz] = playerPos;
      const d = Math.hypot(px - p.x, pz - p.z);
      if (d < HIT_DIST) {
        // scream once
        if (!screamed.current && screamRef.current) {
          try {
            const a = screamRef.current;
            a.setVolume(SCREAM_VOL);
            // slight pitch variation
            if (a.setPlaybackRate) {
              a.setPlaybackRate(
                SCREAM_MIN_RATE + Math.random() * (SCREAM_MAX_RATE - SCREAM_MIN_RATE)
              );
            }
            if (!a.isPlaying) a.play();
          } catch {/* autoplay might block before first user gesture */}
          screamed.current = true;
        }
        // ghost state
        isGhost.current = true;
        ghostAlpha.current = 0.9;
        ref.current.position.y += 0.05; // little pop
      }
    }
  });

  return (
    <group ref={ref} position={[start[0], 0.02, start[2]]}>
      {/* Normal ped */}
      <group ref={normalG}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.09, 0.35, 12]} />
        <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#ffcf99" />
        </mesh>
        {/* Positional scream audio */}
        <PositionalAudio ref={screamRef} url={SCREAM_URL} distance={6} />
      </group>

      {/* Ghost (semi-transparent, glowy) */}
      <group ref={ghostG} visible={false}>
        {/* Head */}
        <mesh position={[0, 0.22, 0]} material={ghostMat}>
          <sphereGeometry args={[0.11, 20, 20]} />
        </mesh>
        {/* Body */}
        <mesh position={[0, 0.08, 0]} material={ghostMat}>
          <cylinderGeometry args={[0.16, 0.18, 0.30, 16]} />
        </mesh>
        {/* Little trailing blobs */}
        {[-0.12, 0, 0.12].map((x, i) => (
          <mesh key={i} position={[x, -0.08, 0]} material={ghostMat}>
            <sphereGeometry args={[0.055, 16, 16]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function World() {
  const ground = useRef();
  const R = 14; // island radius

  const playerPos = usePlayer((s) => s.pos);
  const setNearestStation = useControls((s) => s.setNearestStation);
  const setCanEnter = useControls((s) => s.setCanEnter); // optional in store
  const lastLabelRef = useRef(null);

  useFrame(() => {
    if (ground.current) ground.current.rotation.z += 0.00012;
  });

  /** roads (keep clear) */
  const laneHalf = 0.8;
  const isInRoad = (x, z) => {
    const near = (v, t) => Math.abs(v - t) <= laneHalf + 0.05;
    return near(z, 0) || near(z, 2.2) || near(z, -2.2) || near(x, 0) || near(x, 2.2) || near(x, -2.2);
  };

  /** occupancy helpers */
  const OCC = useRef(new Set()).current;
  const key = (x, z) => `${Math.round(x * 10)},${Math.round(z * 10)}`;
  const markOcc = (x, z, r = 0.9) => {
    const step = 0.6;
    for (let dx = -r; dx <= r; dx += step) {
      for (let dz = -r; dz <= r; dz += step) {
        OCC.add(key(x + dx, z + dz));
      }
    }
  };
  const isOcc = (x, z) => OCC.has(key(x, z));

  /** pre-mark: roads, lamps, stop signs, stations */
  const lamps = useMemo(() => [[-3, -0.9],[0, -0.9],[3, -0.9],[-3, 0.9],[0, 0.9],[3, 0.9]], []);
  const stopSigns = useMemo(() => [[1.6, -1.6],[-1.6, 1.6],[1.6, 1.6],[-1.6, -1.6]], []);
  // derive station points from STATIONS so everything stays in sync
  const stationPoints = useMemo(() => STATIONS.map(s => [s.x, s.z]), []);

  useMemo(() => {
    for (let gx = -R; gx <= R; gx += 0.4) {
      for (let gz = -R; gz <= R; gz += 0.4) {
        if (Math.hypot(gx, gz) > R - 0.6) continue;
        if (isInRoad(gx, gz)) markOcc(gx, gz, 0.6);
      }
    }
    lamps.forEach(([x,z]) => markOcc(x, z, 0.9));
    stopSigns.forEach(([x,z]) => markOcc(x, z, 0.9));
    stationPoints.forEach(([x,z]) => markOcc(x, z, 1.6));
  }, [lamps, stopSigns, stationPoints]);

  /** vibrant palette */
  const palette = ["#1d4ed8","#0ea5e9","#10b981","#16a34a","#f59e0b","#ef4444","#a855f7","#fb7185","#22d3ee","#f97316","#84cc16","#06b6d4","#eab308","#f43f5e","#60a5fa"];

  /** place 20 buildings, uniformly around the island (no street/overlap) */
  const cityBlocks = useMemo(() => {
    const blocks = [];
    let tries = 0;
    while (blocks.length < 20 && tries < 2000) {
      tries++;
      const ang = Math.random() * Math.PI * 2;
      const rad = 2.5 + Math.random() * (R - 3.2); // keep inside rim
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      if (isInRoad(x, z)) continue;
      if (Math.hypot(x, z) > R - 1.0) continue;
      if (isOcc(x, z)) continue;

      const w = 0.9 + Math.random() * 0.9;
      const d = 0.9 + Math.random() * 0.9;
      const h = 0.9 + Math.random() * 2.1;
      const color = palette[(Math.random() * palette.length) | 0];

      markOcc(x, z, Math.max(w, d) * 0.8);
      blocks.push({ x, z, w, d, h, color });
    }
    return blocks;
  }, []); // eslint-disable-line

  /** doors list for pedestrians (x,z at +Z face of each building) */
  const doorPositions = useMemo(
    () => cityBlocks.map(b => [b.x, b.z + b.d / 2 + 0.08]),
    [cityBlocks]
  );

  /** rim trees (after buildings) */
  const trees = useMemo(() => {
    const t = [];
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2;
      const r = R - 0.8 - (i % 3) * 0.5;
      const x = Math.cos(ang) * r, z = Math.sin(ang) * r;
      if (!isOcc(x, z) && !isInRoad(x, z)) {
        markOcc(x, z, 0.6);
        t.push([x, 0, z, 0.9 + Math.random() * 0.5]);
      }
    }
    return t;
  }, []); // eslint-disable-line

  /** pedestrians: spawn near random buildings (clamped inside wall) */
  const pedestrians = useMemo(() => {
    const colors = ["#ff9f1c","#e76f51","#00b4d8","#ffd166","#90be6d","#f72585"];
    return Array.from({ length: Math.min(10, cityBlocks.length) }, (_, i) => {
      const b = cityBlocks[(Math.random() * cityBlocks.length) | 0];
      const offsX = (Math.random() - 0.5) * 0.8;
      const offsZ = (Math.random() - 0.5) * 0.8;
      return {
        start: [b.x + offsX, 0, b.z + offsZ],
        color: colors[i % colors.length],
      };
    });
  }, [cityBlocks]);

  // ---- Proximity check for Enter button (LARGER station areas) ----
  useFrame(() => {
    if (!playerPos) return;
    const [px, , pz] = playerPos;

    let nearest = null;
    let minD2 = Infinity;

    for (const s of STATIONS) {
      const dx = s.x - px;
      const dz = s.z - pz;
      const d2 = dx * dx + dz * dz;
      if (d2 <= s.r * s.r && d2 < minD2) {
        minD2 = d2;
        nearest = { ...s, dist: Math.sqrt(d2) };
      }
    }

    const label = nearest ? nearest.label : null;
    if (label !== lastLabelRef.current) {
      lastLabelRef.current = label;
      if (setNearestStation) setNearestStation(nearest);
      if (setCanEnter) setCanEnter(!!nearest); // keep EnterButton glow in sync if your store has it
    }
  });

  return (
    <group>
      {/* Island base */}
      <mesh ref={ground} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[R, 96]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Rim */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[R + 0.2, R + 0.6, 128]} />
        <meshBasicMaterial color="#1e293b" />
      </mesh>

      {/* Outer Wall */}
      <mesh position={[0, 2.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[R + 0.2, R + 0.2, 5.6, 64]} />
        <meshStandardMaterial color="#9a9a9a" />
      </mesh>

      {/* Roads */}
      {[
        [0, 2.2, R * 2, 1.6], [0, -2.2, R * 2, 1.6],
        [2.2, 0, 1.6, R * 2], [-2.2, 0, 1.6, R * 2],
      ].map(([x, z, w, h], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.001, z]} receiveShadow>
          <planeGeometry args={[w, h]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
      ))}

      {/* Lane markers */}
      {Array.from({ length: 28 }).map((_, i) => (
        <mesh key={`hz-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-R + 1 + i * ((R * 2 - 2) / 28), 0.003, 0]}>
          <planeGeometry args={[0.9, 0.08]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
      ))}
      {Array.from({ length: 28 }).map((_, i) => (
        <mesh key={`vt-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -R + 1 + i * ((R * 2 - 2) / 28)]}>
          <planeGeometry args={[0.08, 0.9]} />
          <meshStandardMaterial color="#e5e7eb" />
        </mesh>
      ))}

      {/* Buildings */}
      {cityBlocks.map((b, i) => (
        <BackgroundBuilding key={`blk-${i}`} x={b.x} z={b.z} w={b.w} d={b.d} h={b.h} color={b.color} />
      ))}

      {/* Trees */}
      {trees.map((t, i) => <Tree key={`tree-${i}`} pos={[t[0], 0, t[2]]} scale={t[3]} />)}

      {/* Pedestrians (can scream and become ghosts) */}
      {pedestrians.map((p, i) => (
        <Pedestrian key={`ped-${i}`} start={p.start} color={p.color} doors={doorPositions} clampR={13.6} />
      ))}
    </group>
  );
}
