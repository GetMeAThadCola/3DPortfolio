// src/App.jsx
import React, { useRef, useEffect } from "react";
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

/* ---------- Joystick with knob ---------- */
function SteeringUI() {
  const setSteer = useControls((s) => s.setSteer);
  const baseRef = useRef(null);
  const knobRef = useRef(null);
  const center = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);

  const stickRadius = 70; // px
  const hitbox = 240;     // touch area

  // update center when layout changes
  useEffect(() => {
    const update = () => {
      const el = baseRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      center.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // handlers
  useEffect(() => {
    const move = (e) => {
      if (!dragging.current) return;
      const p = "touches" in e ? e.touches[0] : e;
      if (!p) return;

      const dx = p.clientX - center.current.x;
      const dy = p.clientY - center.current.y;

      // clamp to circle
      const len = Math.hypot(dx, dy);
      const clamped = Math.min(len, stickRadius);
      const ux = (dx / (len || 1)) * clamped;
      const uy = (dy / (len || 1)) * clamped;

      const nx = ux / stickRadius;
      const ny = uy / stickRadius;

      if (knobRef.current) {
        knobRef.current.style.transform = `translate(-50%, -50%) translate(${ux}px, ${uy}px)`;
      }
      setSteer(nx, ny);

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
      // recalc center (layout may have shifted)
      const el = baseRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        center.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
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
    <div
      style={{
        position: "fixed",
        left: 18,
        bottom: 18,
        width: hitbox,
        height: hitbox,
        zIndex: 1000,
        pointerEvents: "auto",
        userSelect: "none",
        touchAction: "none",
      }}
      ref={baseRef}
    >
      {/* base ring */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: stickRadius * 2,
          height: stickRadius * 2,
          transform: "translate(-50%, -50%)",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.10), rgba(255,255,255,0.03))",
          border: "2px solid rgba(255,255,255,0.08)",
          boxShadow: "inset 0 0 12px rgba(0,0,0,0.35)",
        }}
      />
      {/* knob */}
      <div
        ref={knobRef}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 64,
          height: 64,
          transform: "translate(-50%, -50%)",
          borderRadius: "9999px",
          background:
            "radial-gradient(circle at 45% 35%, rgba(255,255,255,0.85), rgba(200,200,255,0.25))",
          border: "2px solid rgba(255,255,255,0.4)",
          boxShadow: "0 6px 16px rgba(0,0,0,0.35), inset 0 0 12px rgba(0,0,0,0.25)",
        }}
      />
    </div>
  );
}

/* ---------- Hop button ---------- */
function HopButton() {
  const mode = useControls((s) => s.mode);
  const setMode = useControls((s) => s.setMode);
  const setSteer = useControls((s) => s.setSteer);

  const onClick = () => {
    // reset input and swap mode
    setSteer(0, 0);
    setMode(mode === "car" ? "foot" : "car");
  };

  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        right: 18,
        bottom: 88,  // above the Enter button
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

          {/* Scene */}
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

          {/* Mount exactly one controller */}
          {mode === "car"  ? <Player key="car" active /> : <FootController key="foot" active />}

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

      {/* HUD */}
      <div className="hud">
        <div className="hud-top">
          <div>
            <div className="brand">Hunter Carbone · Cloud/DevOps 3D Portfolio</div>
            <div className="hint">
              Push the wheel to drive (up = forward). Press <b>E</b> near a neon building
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
