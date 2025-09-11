// src/App.jsx
import React from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls, Environment } from "@react-three/drei";

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
  const setSteer = useControls((s) => s.setSteer);
  return (
    <div className="drive-ui">
      <div
        className="wheel-hitbox"
        onPointerDown={(e) => e.preventDefault()}
        onMouseDown={(e) => e.preventDefault()}
        onTouchStart={(e) => e.preventDefault()}
      >
        {/* keep your existing wheel implementation here if you need it;
           leaving minimal to reduce noise */}
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

          {/* Both mounted, only the active one updates & moves camera */}
          <Player active={mode === "car"} />
          <FootController active={mode === "foot"} />

          <ClockTower position={[-8, 0, -8]} height={4.2} faceSize={1.2} />
          <ClockTower position={[8, 0, -8]} height={4.2} faceSize={1.2} />

          <BuildingStation position={[0, 0, -4]} size={[2.0,1.4,1.4]} label="Resume" url={LINKS.resumeUrl} color="#cc512c" neonColor="#00e5ff" />
          <BuildingStation position={[10,0,0]} size={[1.8, 1.2, 1.3]} label="GitHub" url={LINKS.githubUrl} color="#992693" neonColor="#39ff14" />
          <BuildingStation position={[-10,0,0]} size={[1.7, 1.0, 1.2]} label="LinkedIn" url={LINKS.linkedinUrl} color="#c2bb5e" neonColor="#1da1f2" />
          <BuildingStation position={[0,0,10]} size={[2.2, 1.5, 1.5]} label="Projects" url={LINKS.projectsUrl} color="#317c2f" neonColor="#ff38bd" />
          <BuildingStation position={[3,0,-5]} size={[3.0, 2.5, 2.5]} label="More Info" url={LINKS.moreinfoUrl} color="#317c2f" neonColor="#e5ff00" />
        </Canvas>
      </KeyboardControls>

      {/* HUD */}
      <div className="hud">
        <div className="hud-top">
          <div>
            <div className="brand">Hunter Carbone · Cloud/DevOps 3D Portfolio</div>
            <div className="hint">
              Drive with the wheel or WASD. Press <b>E</b> near neon buildings to enter.
            </div>
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

      {/* Your Enter button + joystick as before */}
      <EnterButton />
      <SteeringUI />
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

