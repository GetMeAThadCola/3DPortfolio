// src/components/FootController.jsx
import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import usePlayer from "../store/usePlayer.js";
import useControls from "../store/useControls.js";

const SPEED = 2.5;
const CAM_HEIGHT = 1.5;
const CAM_BACK = 2.2;

export default function FootController({ active = false }) {
  const ref = useRef();
  const { camera } = useThree();
  const setPos = usePlayer((s) => s.setPos);
  const mode = useControls((s) => s.mode);
  const steer = useControls((s) => s.steer);
  const alive = useRef(true);

  const startPos = usePlayer((s) => s.pos);
  useEffect(() => {
    if (ref.current && startPos) {
      ref.current.position.set(startPos[0], 0.02, startPos[2]);
    }
  }, []); // initial spawn
  useEffect(() => () => { alive.current = false; }, []);

  const keys = useRef({ w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false });
  useEffect(() => {
    const dn = (e) => {
      if (e.code === "KeyW") keys.current.w = true;
      if (e.code === "KeyS") keys.current.s = true;
      if (e.code === "KeyA") keys.current.a = true;
      if (e.code === "KeyD") keys.current.d = true;
      if (e.code === "ArrowUp") keys.current.up = true;
      if (e.code === "ArrowDown") keys.current.down = true;
      if (e.code === "ArrowLeft") keys.current.left = true;
      if (e.code === "ArrowRight") keys.current.right = true;
    };
    const up = (e) => {
      if (e.code === "KeyW") keys.current.w = false;
      if (e.code === "KeyS") keys.current.s = false;
      if (e.code === "KeyA") keys.current.a = false;
      if (e.code === "KeyD") keys.current.d = false;
      if (e.code === "ArrowUp") keys.current.up = false;
      if (e.code === "ArrowDown") keys.current.down = false;
      if (e.code === "ArrowLeft") keys.current.left = false;
      if (e.code === "ArrowRight") keys.current.right = false;
    };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", dn);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame((_, dt) => {
    if (!alive.current || !ref.current) return;
    if (!active || mode !== "foot") return;

    const p = ref.current.position;
    // keyboard
    let vx = (keys.current.d || keys.current.right ? 1 : 0) + (keys.current.a || keys.current.left ? -1 : 0);
    let vz = (keys.current.s || keys.current.down ? 1 : 0) + (keys.current.w || keys.current.up ? -1 : 0);
    // joystick
    vx += steer.x;
    vz += steer.y;

    const len = Math.hypot(vx, vz);
    if (len > 0.001) {
      vx /= len; vz /= len;
      p.x += vx * SPEED * dt;
      p.z += vz * SPEED * dt;
      const r = Math.hypot(p.x, p.z);
      const maxR = 13.0;
      if (r > maxR) {
        const t = maxR / r;
        p.x *= t; p.z *= t;
      }
    }

    const yaw = Math.atan2(vx, -vz) || 0;
    const camX = p.x - Math.sin(yaw) * CAM_BACK;
    const camZ = p.z - Math.cos(yaw) * CAM_BACK;
    camera.position.lerp({ x: camX, y: CAM_HEIGHT, z: camZ }, 0.15);
    camera.lookAt(p.x, 0.6, p.z);

    if (alive.current) setPos(p.x, p.y, p.z);
  });

  return (
    <group ref={ref} visible>
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
