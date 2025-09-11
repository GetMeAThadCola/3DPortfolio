// src/App.jsx
import React, { useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { KeyboardControls, OrbitControls, Environment } from "@react-three/drei";
import ClockTower from "./components/ClockTower.jsx";
import World from "./components/World.jsx";
import Player from "./components/Player.jsx";
import BuildingStation from "./components/BuildingStation.jsx";
import Scenery from "./components/Scenery.jsx";
import EnterButton from "./components/EnterButton.jsx";

import useUI from "./store/useUI.js";
import useControls from "./store/useControls.js";
import usePlayer from "./store/usePlayer.js";
import "./styles.css";

const LINKS = {
  resumeUrl: "/resume.pdf",
  githubUrl: "https://github.com/GetMeAThadCola",
  linkedinUrl: "https://www.linkedin.com/in/huntertcarbone",
  projectsUrl: "https://github.com/GetMeAThadCola?tab=repositories",
  moreinfoUrl: "https://hunter-resume.vercel.app",
};

/* ------------------ Steering UI (mobile joystick) ------------------ */
function SteeringUI() {
  const setSteer = useControls((s) => s.setSteer);

  const knobRef = useRef(null);
  const baseRef = useRef(null);
  const dragging = useRef(false);
  const center = useRef({ x: 0, y: 0 });

  const maxRadius = 70;
  const hitboxSize = 240;

  useEffect(() => {
    const updateCenter = () => {
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      center.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    updateCenter();
    window.addEventListener("resize", updateCenter);
    return () => window.removeEventListener("resize", updateCenter);
  }, []);

  useEffect(() => {
    const move = (e) => {
      if (!dragging.current) return;
      const p = "touches" in e ? e.touches[0] : e;
      if (!p) return;
      const dx = p.clientX - center.current.x;
      const dy = p.clientY - center.current.y;

      const len = Math.hypot(dx, dy) || 1;
      const nx = (dx / len) * Math.min(len, maxRadius);
      const ny = (dy / len) * Math.min(len, maxRadius);

      const vx = Math.max(-1, Math.min(1, nx / maxRadius));
      const vy = Math.max(-1, Math.min(1, ny / maxRadius));

      if (knobRef.current) {
        knobRef.current.style.transform =
          `translate(-50%, -50%) translate(${nx}px, ${ny}px)`;
      }
      setSteer(vx, vy);

      if (e.cancelable) e.preventDefault();
    };

    const end = () => {
      if (!dragging.current) return;
      dragging.current = false;
      setSteer(0, 0);
      if (knobRef.current) {
        knobRef.current.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
      }
      window.removeEventListener("mousemove", move, { passive: false });
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", move, { passive: false });
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
    };

    const start = (e) => {
      dragging.current = true;
      const base = baseRef.current;
      if (base) {
        const rect = base.getBoundingClientRect();
        center.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
      window.addEventListener("mousemove", move, { passive: false });
      window.addEventListener("mouseup", end);
      window.addEventListener("touchmove", move, { passive: false });
      window.addEventListener("touchend", end);
      window.addEventListener("touchcancel", end);
      move(e);
    };

    const el = baseRef.current;
    if (!el) return;
    el.addEventListener("mousedown", start);
    el.addEventListener("touchstart", start, { passive: false });
    return () => {
      el.removeEventListener("mousedown", start);
      el.removeEventListener("touchstart", start);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
    };
  }, [setSteer]);

  return (
    <div className="drive-ui">
      <div className="wheel-hitbox" ref={baseRef} style={{ width: hitboxSize, height: hitboxSize }}>
        <div className="wheel">
          <div className="wheel-knob" ref={knobRef} />
        </div>
      </div>
    </div>
  );
}

/* ------------------ On-Foot avatar ------------------ */
function OnFoot() {
  const ref = useRef();
  const heading = useRef(0);
  const poseRef = useRef({ x: 0, y: 0, z: 0, heading: 0 });

  const steer = useControls((s) => s.steer);
  const setPos = usePlayer((s) => s.setPos);
  const { camera } = useThree();

  const WALK_SPEED = 2.6;
  const TURN_RATE  = 2.8;
  const RADIUS_MAX = 13.5;
  const CAM_BACK   = 3.6;
  const CAM_UP     = 2.2;

  useEffect(() => {
    // Expose a safe getter for the shoot button
    window.__getFootPose = () => poseRef.current;
    return () => { delete window.__getFootPose; };
  }, []);

  useFrame((_, dt) => {
    if (!ref.current) return;

    heading.current += steer.x * TURN_RATE * dt;

    const forward = -steer.y;
    const dirX = Math.sin(heading.current);
    const dirZ = Math.cos(heading.current);

    ref.current.position.x += dirX * forward * WALK_SPEED * dt;
    ref.current.position.z += dirZ * forward * WALK_SPEED * dt;
    ref.current.position.y = 0.02;

    const r = Math.hypot(ref.current.position.x, ref.current.position.z);
    if (r > RADIUS_MAX) {
      const t = RADIUS_MAX / r;
      ref.current.position.x *= t;
      ref.current.position.z *= t;
    }

    ref.current.rotation.y = heading.current;

    const p = ref.current.position;
    const camX = p.x - Math.sin(heading.current) * CAM_BACK;
    const camZ = p.z - Math.cos(heading.current) * CAM_BACK;
    camera.position.lerp({ x: camX, y: p.y + CAM_UP, z: camZ }, 0.14);
    camera.lookAt(p.x, p.y + 0.9, p.z);

    // Update shared pose for building-enter prompts & the global getter
    setPos(p.x, p.y, p.z);
    poseRef.current = { x: p.x, y: p.y, z: p.z, heading: heading.current };
  });

  return (
    <group ref={ref} position={[0, 0.02, 2.5]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.18, 0.6, 6, 12]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[0, 0.45, 0.16]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial emissive="#ffffff" emissiveIntensity={0.6} color="#eeeeee" />
      </mesh>
    </group>
  );
}

/* ------------------ Hop & Shoot Buttons (DOM overlays) ------------------ */
function HopButton({ corner = "left" }) {
  const mode = useControls((s) => s.mode);
  const toggleMode = useControls((s) => s.toggleMode);
  const isRight = corner === "right";
  const style = {
    position: "fixed",
    bottom: "calc(92px + env(safe-area-inset-bottom))",
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
    pointerEvents: "auto",
    touchAction: "manipulation",
  };
  return (
    <button style={style} onClick={toggleMode}>
      {mode === "car" ? "Hop Out" : "Drive"}
    </button>
  );
}

function ShootButton({ corner = "right" }) {
  const mode = useControls((s) => s.mode);
  if (mode !== "foot") return null;

  const isRight = corner === "right";
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
    pointerEvents: "auto",
    touchAction: "manipulation",
  };
  const onShoot = () => {
    try {
      const getPose = window.__getFootPose;
      const spawn = window.__spawnBullet;
      if (!getPose || !spawn) return;

      const pose = getPose();
      const heading = pose.heading || 0;
      const dir = [Math.sin(heading), 0, Math.cos(heading)];
      const pos = [pose.x + dir[0] * 0.35, (pose.y || 0.02) + 0.25, pose.z + dir[2] * 0.35];
      spawn({ pos, dir, speed: 18 });
      if (navigator.vibrate) navigator.vibrate(10);
    } catch {}
  };
  return <button style={style} onClick={onShoot}>Shoot</button>;
}

/* ------------------ App ------------------ */
export default function App() {
  const { resumeOpen, closeResume } = useUI();
  const mode = useControls((s) => s.mode);

  return (
    <>
      <KeyboardControls
        map={[
          { name: "forward", keys: ["ArrowUp", "KeyW"] },
          { name: "backward", keys: ["ArrowDown", "KeyS"] },
          { name: "left", keys: ["ArrowLeft", "KeyA"] },
          { name: "right", keys: ["ArrowRight", "KeyD"] },
        ]}
      >
        <Canvas shadows camera={{ position: [9, 9, 9], fov: 55 }}>
          <color attach="background" args={["#0b0f1a"]} />
          <fog attach="fog" args={["#0b0f1a", 12, 50]} />
          <ambientLight intensity={0.55} />
          <directionalLight
            position={[10, 14, 8]}
            intensity={1.2}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <Environment preset="city" />

          <Scenery
            islandRadius={14}
            roadBand={1.2}
            buildingZones={[
              { x: 0,  z: -4, r: 1.6 },  // Resume
              { x: 4,  z: 0,  r: 1.8 },  // GitHub
              { x: -4, z: 0,  r: 1.6 },  // LinkedIn
              { x: 0,  z: 4,  r: 1.9 },  // Projects
            ]}
            seed={1337}
            counts={{ poles: 14, signs: 12, grass: 150, bushes: 70 }}
          />

          <World />

          {mode === "car" ? <Player /> : <OnFoot />}

          <ClockTower position={[-8, 0, -8]} height={4.2} faceSize={1.2} />
          <ClockTower position={[8, 0, -8]} height={4.2} faceSize={1.2} />

          <BuildingStation
            position={[0, 0, -4]}
            size={[2.0, 1.4, 1.4]}
            label="Resume"
            url={LINKS.resumeUrl}
            color="#cc512c"
            neonColor="#00e5ff"
          />
          <BuildingStation
            position={[10, 0, 0]}
            size={[1.8, 1.2, 1.3]}
            label="GitHub"
            url={LINKS.githubUrl}
            color="#992693"
            neonColor="#39ff14"
          />
          <BuildingStation
            position={[-10, 0, 0]}
            size={[1.7, 1.0, 1.2]}
            label="LinkedIn"
            url={LINKS.linkedinUrl}
            color="#c2bb5e"
            neonColor="#1da1f2"
          />
          <BuildingStation
            position={[0, 0, 10]}
            size={[2.2, 1.5, 1.5]}
            label="Projects"
            url={LINKS.projectsUrl}
            color="#317c2f"
            neonColor="#ff38bd"
          />
          <BuildingStation
            position={[3, 0, -5]}
            size={[3.0, 2.5, 2.5]}
            label="More Info"
            url={LINKS.moreinfoUrl}
            color="#317c2f"
            neonColor="#e5ff00"
          />

          <OrbitControls makeDefault maxPolarAngle={Math.PI * 0.49} />
        </Canvas>
      </KeyboardControls>

      {/* HUD */}
      <div className="hud">
        <div className="hud-top">
          <div>
            <div className="brand">Hunter Carbone · Cloud/DevOps 3D Portfolio</div>
          </div>
          <div className="actions">
            <a className="button" href={LINKS.resumeUrl} download>Download Resume</a>
            <a className="button" href={LINKS.githubUrl} target="_blank" rel="noreferrer">GitHub</a>
            <a className="button" href={LINKS.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </div>
      </div>

      {/* Overlays */}
      <SteeringUI />
      <EnterButton corner="right" label="Enter" />
      <HopButton corner="left" />
      <ShootButton corner="right" />

      {resumeOpen && (
        <div className="modal-backdrop" onClick={closeResume}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="row">
              <h2>Resume</h2>
              <span className="badge">PDF</span>
              <button className="button close" onClick={closeResume}>Close</button>
            </div>
            <p className="muted">Quick preview below. Use Download for full view.</p>
            <div className="grid">
              <div className="iframe-wrap">
                <iframe src={LINKS.resumeUrl} title="resume" style={{ width: "100%", height: 460, border: 0 }} />
              </div>
              <div>
                <h3>Quick Links</h3>
                <div className="row"><a className="button" href={LINKS.resumeUrl} download>Download Resume</a></div>
                <div className="row"><a className="button" href={LINKS.githubUrl} target="_blank" rel="noreferrer">Open GitHub</a></div>
                <div className="row"><a className="button" href={LINKS.linkedinUrl} target="_blank" rel="noreferrer">Open LinkedIn</a></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
