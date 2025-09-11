// src/components/World.jsx
import React, {
  useRef,
  useMemo,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
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

// Audio (place your file in /public/audio/)
const SCREAM_URL = "/audio/ped_scream.mp3";
const SCREAM_VOL = 0.7;
const SCREAM_MIN_RATE = 0.95;
const SCREAM_MAX_RATE = 1.10;

/** Stations (optional: match App.jsx label/urls if you use them in HUD) */
const LINKS = {
  resumeUrl: "/resume.pdf",
  githubUrl: "https://github.com/GetMeAThadCola",
  linkedinUrl: "https://www.linkedin.com/in/huntertcarbone",
  projectsUrl: "https://github.com/GetMeAThadCola?tab=repositories",
  moreinfoUrl: "https://hunter-resume.vercel.app",
};
const STATIONS = [
  { label: "Resume",    x:  0,  z: -4, r: 3.0, url: LINKS.resumeUrl },
  { label: "GitHub",    x: 10,  z:  0, r: 2.8, url: LINKS.githubUrl },
  { label: "LinkedIn",  x:-10,  z:  0, r: 2.8, url: LINKS.linkedinUrl },
  { label: "Projects",  x:  0,  z: 10, r: 3.2, url: LINKS.projectsUrl },
  { label: "More Info", x:  3,  z: -5, r: 2.8, url: LINKS.moreinfoUrl },
];

/* ---------- Small props ---------- */
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

/* ---------- Pedestrian (forwardRef with API for bullets) ---------- */
const Pedestrian = forwardRef(function Pedestrian(
  { start = [0, 0, 0], color = "#ff9f1c", doors = [], clampR = 13.6 },
  apiRef
) {
  const ref = useRef();
  const normalG = useRef();
  const ghostG = useRef();
  const screamRef = useRef();

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

  const speed = 0.9;
  const target = useRef({ x: start[0], z: start[2] });
  const timer = useRef(0);

  const isGhost = useRef(false);
  const ghostAlpha = useRef(0);
  const screamed = useRef(false);
  const playerPos = usePlayer((s) => s.pos);
  const mode = useControls((s) => s.mode); // "car" | "foot"

  useImperativeHandle(apiRef, () => ({
    becomeGhost: () => {
      if (isGhost.current) return;
      // scream once (bullet or car)
      if (!screamed.current && screamRef.current) {
        try {
          const a = screamRef.current;
          a.setVolume(SCREAM_VOL);
          if (a.setPlaybackRate) {
            a.setPlaybackRate(
              SCREAM_MIN_RATE + Math.random() * (SCREAM_MAX_RATE - SCREAM_MIN_RATE)
            );
          }
          if (!a.isPlaying) a.play();
        } catch {}
        screamed.current = true;
      }
      isGhost.current = true;
      ghostAlpha.current = 0.9;
      if (ref.current) ref.current.position.y += 0.05;
    },
    getPosition: () => {
      const p = ref.current?.position;
      return p ? { x: p.x, y: p.y, z: p.z } : { x: start[0], y: 0.02, z: start[2] };
    },
  }));

  useEffect(() => {
    const a = screamRef.current;
    if (!a) return;
    try {
      a.setLoop(false);
      a.setRefDistance(4);
      a.setVolume(0);
    } catch {}
  }, []);

  useFrame((_, dt) => {
    if (!ref.current) return;

    if (normalG.current) normalG.current.visible = !isGhost.current;
    if (ghostG.current)  ghostG.current.visible  =  isGhost.current;

    if (isGhost.current) {
      ref.current.position.y += GHOST_RISE * dt;
      ref.current.rotation.y += GHOST_SPIN * dt;
      ghostAlpha.current = Math.max(0, ghostAlpha.current - GHOST_FADE * dt);
      ghostMat.opacity = ghostAlpha.current;
      if (ghostAlpha.current <= 0.01) ref.current.visible = false;
      return;
    }

    // wander
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

    // move
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

    // ONLY car→ped proximity ghosts
    if (mode === "car" && playerPos) {
      const [px, , pz] = playerPos;
      const d = Math.hypot(px - p.x, pz - p.z);
      if (d < HIT_DIST) {
        try { apiRef?.current?.becomeGhost?.(); } catch {}
      }
    }
  });

  return (
    <group ref={ref} position={[start[0], 0.02, start[2]]}>
      {/* normal */}
      <group ref={normalG}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.09, 0.35, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshStandardMaterial color="#ffcf99" />
        </mesh>
        <PositionalAudio ref={screamRef} url={SCREAM_URL} distance={6} />
      </group>

      {/* ghost */}
      <group ref={ghostG} visible={false}>
        <mesh position={[0, 0.22, 0]} material={ghostMat}>
          <sphereGeometry args={[0.11, 20, 20]} />
        </mesh>
        <mesh position={[0, 0.08, 0]} material={ghostMat}>
          <cylinderGeometry args={[0.16, 0.18, 0.30, 16]} />
        </mesh>
        {[-0.12, 0, 0.12].map((x, i) => (
          <mesh key={i} position={[x, -0.08, 0]} material={ghostMat}>
            <sphereGeometry args={[0.055, 16, 16]} />
          </mesh>
        ))}
      </group>
    </group>
  );
});

/* ---------- World ---------- */
export default function World() {
  const ground = useRef();
  const R = 14;

  const playerPos = usePlayer((s) => s.pos);
  const setNearestStation = useControls((s) => s.setNearestStation);
  const setCanEnter = useControls((s) => s.setCanEnter);

  // bullets live here
  const bullets = useRef([]);      // { pos, dir, speed, life, mesh, line }
  const bulletQueue = useRef([]);  // incoming spawns

  // expose a safe spawn API for the Shoot button
  useEffect(() => {
    window.__spawnBullet = (b) => {
      if (!b) return;
      bulletQueue.current.push(b);
    };
    return () => { delete window.__spawnBullet; };
  }, []);

  useFrame(() => {
    if (ground.current) ground.current.rotation.z += 0.00012;
  });

  /* roads (keep clear) */
  const laneHalf = 0.8;
  const isInRoad = (x, z) => {
    const near = (v, t) => Math.abs(v - t) <= laneHalf + 0.05;
    return near(z, 0) || near(z, 2.2) || near(z, -2.2) || near(x, 0) || near(x, 2.2) || near(x, -2.2);
  };

  /* occupancy helpers */
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

  /* pre-mark station pads */
  const stationPoints = useMemo(() => STATIONS.map(s => [s.x, s.z]), []);
  useMemo(() => {
    for (let gx = -R; gx <= R; gx += 0.4) {
      for (let gz = -R; gz <= R; gz += 0.4) {
        if (Math.hypot(gx, gz) > R - 0.6) continue;
        if (isInRoad(gx, gz)) markOcc(gx, gz, 0.6);
      }
    }
    stationPoints.forEach(([x,z]) => markOcc(x, z, 1.6));
  }, [stationPoints]);

  /* palette + blocks */
  const palette = ["#1d4ed8","#0ea5e9","#10b981","#16a34a","#f59e0b","#ef4444","#a855f7","#fb7185","#22d3ee","#f97316","#84cc16","#06b6d4","#eab308","#f43f5e","#60a5fa"];

  const cityBlocks = useMemo(() => {
    const blocks = [];
    let tries = 0;
    while (blocks.length < 20 && tries < 2000) {
      tries++;
      const ang = Math.random() * Math.PI * 2;
      const rad = 2.5 + Math.random() * (R - 3.2);
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

  const doorPositions = useMemo(
    () => cityBlocks.map(b => [b.x, b.z + b.d / 2 + 0.08]),
    [cityBlocks]
  );

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

  const pedRefs = useMemo(
    () => pedestrians.map(() => React.createRef()),
    [pedestrians.length]
  );

  /* ---- Proximity for Enter button (larger area, nearest station) ---- */
  useFrame(() => {
    const [px, , pz] = playerPos || [0, 0, 0];
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
    setNearestStation?.(nearest || null);
    setCanEnter?.(!!nearest);
  });

  /* ---- Bullet handling (spawn + move + collide + cull) ---- */
  useFrame((_, dt) => {
    // Spawn bullets from queue
    while (bulletQueue.current.length > 0) {
      const b = bulletQueue.current.shift();
      const pos = new THREE.Vector3().fromArray(b.pos || [0, 0.25, 0]);
      const dir = new THREE.Vector3().fromArray(b.dir || [0, 0, 1]).normalize();
      const speed = b.speed ?? 18;
      const life = 2.0;

      // Bright projectile
      const geom = new THREE.SphereGeometry(0.1, 12, 12);
      const mat = new THREE.MeshStandardMaterial({
        color: "#ff4444",
        emissive: "#ff6666",
        emissiveIntensity: 1.2,
        metalness: 0.1,
        roughness: 0.4,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);

      // Tracer line (tail)
      const tail = pos.clone().addScaledVector(dir, -0.5);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([pos.clone(), tail]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffe6e6, linewidth: 2 });
      const line = new THREE.Line(lineGeo, lineMat);

      bullets.current.push({ pos, dir, speed, life, mesh, line });
    }

    // Advance / collide / cull
    for (let i = bullets.current.length - 1; i >= 0; i--) {
      const b = bullets.current[i];
      b.life -= dt;
      if (b.life <= 0) {
        bullets.current.splice(i, 1);
        continue;
      }

      // integrate
      const step = b.dir.clone().multiplyScalar(b.speed * dt);
      b.pos.add(step);
      b.mesh.position.copy(b.pos);

      // update tracer tail
      const tail = b.pos.clone().addScaledVector(b.dir, -0.6);
      b.line.geometry.setFromPoints([b.pos.clone(), tail]);

      // outside island -> remove
      const r = Math.hypot(b.pos.x, b.pos.z);
      if (r > R + 0.8) {
        bullets.current.splice(i, 1);
        continue;
      }

      // collide with pedestrians -> ghost
      for (const pr of pedRefs) {
        const target = pr.current;
        if (!target || !target.getPosition || !target.becomeGhost) continue;
        const tp = target.getPosition();
        const d2 = (b.pos.x - tp.x) ** 2 + (b.pos.z - tp.z) ** 2;
        if (d2 < 0.22 * 0.22) { // a bit generous for mobile
          try { target.becomeGhost(); } catch {}
          bullets.current.splice(i, 1);
          break;
        }
      }
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

      {/* Pedestrians */}
      {pedestrians.map((p, i) => (
        <Pedestrian
          key={`ped-${i}`}
          ref={pedRefs[i]}
          start={p.start}
          color={p.color}
          doors={doorPositions}
          clampR={13.6}
        />
      ))}

      {/* Bullet meshes + tracers */}
      <group>
        {bullets.current.map((b, i) => (
          <group key={i}>
            <primitive object={b.mesh} />
            <primitive object={b.line} />
          </group>
        ))}
      </group>
    </group>
  );
}
