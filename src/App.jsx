// src/App.jsx
import React from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, KeyboardControls } from "@react-three/drei";

import World from "./components/World.jsx";
import Player from "./components/Player.jsx";
import FootController from "./components/FootController.jsx";
import ClockTower from "./components/ClockTower.jsx";
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

function SteeringUI() {
  // unchanged: your existing wheel UI (kept minimal here)
  const setSteer = useControls((s) => s.setSteer);
  const radius = 70;

  return (
    <div
      style={{
        position: "fixed",
        left: 18,
        bottom: 18,
        width: 240,
        height: 240,
        zIndex: 1000,
        userSelect: "none",
        touchAction: "none",
      }}
      onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
      onPointerMove={(e) => {
        if (e.buttons !== 1) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const len = Math.hypot(dx, dy) || 1;
        const nx = Math.max(-1, Math.min(1, dx / radius));
        const ny = Math.max(-1, Math.min(1, dy / radius));
        setSteer(nx, ny);
      }}
      onPointerUp={() => setSteer(0, 0)}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          borderRadius: 9999,
          background: "rgba(255,255,255,0.05)",
          border: "2px solid rgba(255,255,255,0.08)",
        }}
      />
    </div>
  );
}

function HopButton() {
  const mode = useControls((s) => s.mode);
  const toggle = useControls((s) => s.toggleMode);

  return (
    <button
      onClick={toggle}
      style={{
        position: "fixed",
        right: 18,              // opposite the wheel
        bottom: 88,             // above Enter button
        zIndex: 1100,
        padding: "12px 18px",
        borderRadius: 12,
        border: "2px solid rgba(255,255,255,0.25)",
        color: "#fff",
        fontWeight: 800,
        background:
          "radial-gradient(circle at 50% 50%, rgba(58,128,255,0.95), rgba(25,84,210,0.95))",
      }}
      title={mode === "car" ? "Hop Out" : "Hop In"}
    >
      {mode === "car" ? "HOP OUT" : "HOP IN"}
    </button>
  );
}

export default function App() {
  const { resumeOpen, closeResume } = useUI();
  const mode = useControls((s) => s.mode);

  return (
    <>
      <KeyboardControls
        map={[
          { name: "forward",  keys: ["ArrowUp", "KeyW"] },
          { name: "backward", keys: ["ArrowDown", "KeyS"] },
          { name: "left",     keys: ["ArrowLeft", "KeyA"] },
          { name: "right",    keys: ["ArrowRight", "KeyD"] },
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

          {/* Scene content */}
          <Scenery
            islandRadius={14}
            roadBand={1.2}
            buildingZones={[
              { x: 0,  z: -4, r: 1.6 }, // Resume
              { x: 4,  z: 0,  r: 1.8 }, // GitHub
              { x: -4, z: 0,  r: 1.6 }, // LinkedIn
              { x: 0,  z: 4,  r: 1.9 }, // Projects
            ]}
            seed={1337}
            counts={{ poles: 14, signs: 12, grass: 150, bushes: 70 }}
          />
          <World />

          {/* Only ONE of these is ever mounted */}
          {mode === "car"  && <Player active />}
          {mode === "foot" && <FootController active />}

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
            neonColor="#ffee00"
          />
        </Canvas>
      </KeyboardControls>

      {/* HUD header */}
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

      {/* UI controls */}
      <SteeringUI />
      <HopButton />
      <EnterButton />

      {/* Modal unchanged */}
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
