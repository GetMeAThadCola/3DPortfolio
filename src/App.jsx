// src/App.jsx
import React, { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { KeyboardControls, OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

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

/* ---------------- Steering UI (only in car mode) ---------------- */
function SteeringUI() {
  const setSteer = useControls((s) => s.setSteer);
  const mode = useControls((s) => s.mode);

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
      if (mode !== "car") return; // guard if user hopped out mid-drag

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
        knobRef.current.style.transform = `translate(-50%, -50%) translate(${nx}px, ${ny}px)`;
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
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
    };

    const start = (e) => {
      if (mode !== "car") return; // ignore if not in car
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
  }, [setSteer, mode]);

  if (mode !== "car") return null; // only render in car mode

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

/* --- Capture camera forward for bullets --- */
function CameraProbe() {
  const { camera } = useThree();
  useFrame(() => {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    window.__camDir = [dir.x, dir.y, dir.z];
  });
  return null;
}

export default function App() {
  const { resumeOpen, closeResume } = useUI();
  const mode = useControls((s) => s.mode);
  const toggleMode = useControls((s) => s.toggleMode);

  const handleShoot = () => {
    if (mode !== "foot") return;
    const pos = usePlayer.getState().pos || [0, 0.25, 0];
    const dir = window.__camDir || [0, 0, -1];
    // spawn slightly above ground
    window.__spawnBullet?.({
      pos: [pos[0], 0.45, pos[2]],
      dir,
      speed: 18,
    });
  };

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
              { x: 0, z: -4, r: 1.6 }, // Resume
              { x: 4, z: 0, r: 1.8 },  // GitHub
              { x: -4, z: 0, r: 1.6 }, // LinkedIn
              { x: 0, z: 4, r: 1.9 },  // Projects
            ]}
            seed={1337}
            counts={{ poles: 14, signs: 12, grass: 150, bushes: 70 }}
          />

          <World />
          <Player />

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
          <CameraProbe />
        </Canvas>
      </KeyboardControls>

      {/* HUD */}
      <div className="hud">
        <div className="hud-top">
          <div>
            <div className="brand">Hunter Carbone · Cloud/DevOps 3D Portfolio</div>
            <div className="hint">
              Push the wheel to drive (up = forward). Press <b>E</b> near a building with a neon sign
            </div>
          </div>
          <div className="actions">
            <a className="button" href={LINKS.resumeUrl} download>Download Resume</a>
            <a className="button" href={LINKS.githubUrl} target="_blank" rel="noreferrer">GitHub</a>
            <a className="button" href={LINKS.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </div>
      </div>

      {/* Steering (only in car mode) */}
      <SteeringUI />

      {/* Enter button (your existing component) */}
      <EnterButton />

      {/* Hop & Shoot controls (bottom-left; opposite of wheel) */}
      <div style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        display: "flex",
        gap: 12,
        zIndex: 50,
        pointerEvents: "auto",
      }}>
        <button className="button" onClick={toggleMode}>
          {mode === "car" ? "Hop Out" : "Drive"}
        </button>
        <button
          className="button"
          onClick={handleShoot}
          disabled={mode !== "foot"}
          title={mode !== "foot" ? "Available on foot" : "Shoot"}
        >
          🔫 Shoot
        </button>
      </div>

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
