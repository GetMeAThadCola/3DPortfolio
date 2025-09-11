// src/App.jsx
import React, { useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls, Environment } from "@react-three/drei";
import ClockTower from "./components/ClockTower.jsx";
import World from "./components/World.jsx";
import Player from "./components/Player.jsx";
import FootController from "./components/FootController.jsx";
import BuildingStation from "./components/BuildingStation.jsx";
import Scenery from "./components/Scenery.jsx";
import EnterButton from "./components/EnterButton.jsx";
import useUI from "./store/useUI.js";
import useControls from "./store/useControls.js";
import "./styles.css";

const LINKS = {
  resumeUrl: "/resume.pdf",
  githubUrl: "https://github.com/GetMeAThadCola",
  linkedinUrl: "https://www.linkedin.com/in/huntertcarbone",
  projectsUrl: "https://github.com/GetMeAThadCola?tab=repositories",
  moreinfoUrl: "https://hunter-resume.vercel.app",
};

/** Bottom-left joystick (touch + mouse) */
function SteeringUI() {
  const setSteer = useControls((s) => s.setSteer);
  const knobRef = useRef(null);
  const baseRef = useRef(null);
  const dragging = useRef(false);
  const center = useRef({ x: 0, y: 0 });
  const maxRadius = 70;     // px for feel
  const hitboxSize = 240;   // generous area

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
        knobRef.current.style.transform = `translate(-50%, -50%) translate(${nx}px, ${ny}px)`;
      }
      setSteer(vx, vy);
      if (e.cancelable) e.preventDefault();
    };

    const end = () => {
      if (!dragging.current) return;
      dragging.current = false;
      setSteer(0, 0);
      if (knobRef.current) knobRef.current.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", move);
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

  // inline styles ensure visibility even if CSS is missing
  return (
    <div
      className="drive-ui"
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 1000,
        pointerEvents: "auto",
      }}
    >
      <div
        className="wheel-hitbox"
        ref={baseRef}
        style={{
          width: hitboxSize,
          height: hitboxSize,
          touchAction: "none",
          position: "relative",
        }}
      >
        <div
          className="wheel"
          style={{
            width: 160,
            height: 160,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.25)",
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div
            className="wheel-knob"
            ref={knobRef}
            style={{
              width: 54,
              height: 54,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.7)",
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%,-50%)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { resumeOpen, closeResume } = useUI();
  const mode = useControls((s) => s.mode);
  const toggleMode = useControls((s) => s.toggleMode);

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
          <directionalLight position={[10, 14, 8]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
          <Environment preset="city" />

          <Scenery
            islandRadius={14}
            roadBand={1.2}
            buildingZones={[
              { x: 0,  z: -4, r: 1.6 },
              { x: 4,  z: 0,  r: 1.8 },
              { x: -4, z: 0,  r: 1.6 },
              { x: 0,  z: 4,  r: 1.9 },
            ]}
            seed={1337}
            counts={{ poles: 14, signs: 12, grass: 150, bushes: 70 }}
          />
          <World />

          {/* Both controllers mounted; only the active one updates */}
          <Player active={mode === "car"} />
          <FootController active={mode === "foot"} />

          <ClockTower position={[-8, 0, -8]} height={4.2} faceSize={1.2} />
          <ClockTower position={[8, 0, -8]} height={4.2} faceSize={1.2} />

          <BuildingStation position={[0, 0, -4]} size={[2.0,1.4,1.4]} label="Resume"   url={LINKS.resumeUrl}   color="#cc512c" neonColor="#00e5ff" />
          <BuildingStation position={[10,0,0]}  size={[1.8,1.2,1.3]}  label="GitHub"   url={LINKS.githubUrl}   color="#992693" neonColor="#39ff14" />
          <BuildingStation position={[-10,0,0]} size={[1.7,1.0,1.2]}  label="LinkedIn" url={LINKS.linkedinUrl} color="#c2bb5e" neonColor="#1da1f2" />
          <BuildingStation position={[0,0,10]}  size={[2.2,1.5,1.5]}  label="Projects" url={LINKS.projectsUrl} color="#317c2f" neonColor="#ff38bd" />
          <BuildingStation position={[3,0,-5]}  size={[3.0,2.5,2.5]}  label="More Info" url={LINKS.moreinfoUrl} color="#317c2f" neonColor="#e5ff00" />
        </Canvas>
      </KeyboardControls>

      {/* HUD */}
      <div className="hud">
        <div className="hud-top">
          <div>
            <div className="brand">Hunter Carbone · Cloud/DevOps 3D Portfolio</div>
            <div className="hint">Drive with joystick/WASD. Press <b>E</b> near neon buildings to enter.</div>
          </div>
          <div className="actions">
            <a className="button" href={LINKS.resumeUrl} download>Download Resume</a>
            <a className="button" href={LINKS.githubUrl} target="_blank" rel="noreferrer">GitHub</a>
            <a className="button" href={LINKS.linkedinUrl} target="_blank" rel="noreferrer">LinkedIn</a>
            <button className="button" onClick={toggleMode}>
              {mode === "car" ? "Hop Out" : "Drive Car"}
            </button>
          </div>
        </div>
      </div>

      <EnterButton />
      <SteeringUI />

      {/* Resume modal */}
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
