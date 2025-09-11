// src/components/FootController.jsx
import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import usePlayer from "../store/usePlayer.js";
import useControls from "../store/useControls.js";

const SPEED = 2.5;           // m/s walking
const CAM_HEIGHT = 1.5;      // camera eye height
const CAM_BACK = 2.2;

export default function FootController({ active = false }) {
  const ref = useRef();
  const { camera } = useThree();
  const setPos = usePlayer((s) => s.setPos);
  const mode = useControls((s) => s.mode);
  const steer = useControls((s) => s.steer); // mobile stick can still drive walking
  const alive = useRef(true);

  // start where the player currently is
  const playerPos = usePlayer((s) => s.pos);
  useEffect(() => {
    if (ref.current && playerPos) {
      ref.current.position.set(playerPos[0], 0.02, playerPos[2]);
    }
  }, []); // only first mount

  useEffect(() => () => { alive.current = false; }, []);

  // simple keyboard support too
  const keys = useRef({ w: false, a: false, s: false, d: false });
  useEffect(() => {
    const onDown = (e) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.current.w = true;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.current.s = true;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.current.a = true;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.current.d = true;
    };
    const onUp = (e) => {
      if (e.code === "KeyW" || e.code === "ArrowUp") keys.current.w = false;
      if (e.code === "KeyS" || e.code === "ArrowDown") keys.current.s = false;
      if (e.code === "KeyA" || e.code === "ArrowLeft") keys.current.a = false;
      if (e.code === "KeyD" || e.code === "ArrowRight") keys.current.d = false;
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useFrame((_, dt) => {
    if (!alive.current || !ref.current) return;
    if (!active || mode !== "foot") return;

    const p = ref.current.position;

    // combine keyboard + mobile stick
    let vx = 0, vz = 0;
    if (keys.current.w) vz -= 1;
    if (keys.current.s) vz += 1;
    if (keys.current.a) vx -= 1;
    if (keys.current.d) vx += 1;

    // mobile stick: steer.x => left/right, steer.y => forward/back
    vx += steer.x;
    vz += steer.y;

    // normalize
    const len = Math.hypot(vx, vz);
    if (len > 0.001) {
      vx /= len; vz /= len;
      p.x += vx * SPEED * dt;
      p.z += vz * SPEED * dt;

      // clamp to island
      const r = Math.hypot(p.x, p.z);
      const maxR = 13.0;
      if (r > maxR) {
        const t = maxR / r;
        p.x *= t; p.z *= t;
      }
    }

    // third-person camera follow
    const yaw = Math.atan2(vx, -vz) || 0; // face movement direction
    const camX = p.x - Math.sin(yaw) * CAM_BACK;
    const camZ = p.z - Math.cos(yaw) * CAM_BACK;
    camera.position.lerp({ x: camX, y: CAM_HEIGHT, z: camZ }, 0.15);
    camera.lookAt(p.x, 0.6, p.z);

    if (alive.current) setPos(p.x, p.y, p.z);
  });

  return (
    <group ref={ref} visible={true}>
      {/* simple capsule avatar */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.5, 14]} />
        <meshStandardMaterial color={active ? "#22c55e" : "#334155"} />
      </mesh>
      <mesh position={[0, 0.56, 0]} castShadow>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#f5deb3" />
      </mesh>
    </group>
  );
}
