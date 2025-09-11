// src/components/FootController.jsx
import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import usePlayer from "../store/usePlayer.js";
import useControls from "../store/useControls.js";

const SPEED = 2.8;
const CAM_HEIGHT = 1.6;
const CAM_BACK = 2.2;

export default function FootController({ active = false }) {
  const ref = useRef();
  const { camera } = useThree();

  const setPos = usePlayer((s) => s.setPos);
  const spawn = usePlayer((s) => s.pos);
  const steer = useControls((s) => s.steer);

  // spawn where the car last was
  useEffect(() => {
    if (ref.current && spawn) ref.current.position.set(spawn[0], 0.02, spawn[2]);
  }, [spawn]);

  // keyboard
  const keys = useRef({ w:false,a:false,s:false,d:false,up:false,down:false,left:false,right:false });
  useEffect(() => {
    const dn = (e) => {
      const c = e.code;
      if (c === "KeyW") keys.current.w = true;
      if (c === "KeyS") keys.current.s = true;
      if (c === "KeyA") keys.current.a = true;
      if (c === "KeyD") keys.current.d = true;
      if (c === "ArrowUp") keys.current.up = true;
      if (c === "ArrowDown") keys.current.down = true;
      if (c === "ArrowLeft") keys.current.left = true;
      if (c === "ArrowRight") keys.current.right = true;
    };
    const up = (e) => {
      const c = e.code;
      if (c === "KeyW") keys.current.w = false;
      if (c === "KeyS") keys.current.s = false;
      if (c === "KeyA") keys.current.a = false;
      if (c === "KeyD") keys.current.d = false;
      if (c === "ArrowUp") keys.current.up = false;
      if (c === "ArrowDown") keys.current.down = false;
      if (c === "ArrowLeft") keys.current.left = false;
      if (c === "ArrowRight") keys.current.right = false;
    };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  useFrame((_, dt) => {
    if (!active || !ref.current) return;

    const p = ref.current.position;

    // input vector
    let vx = (keys.current.d || keys.current.right ? 1 : 0) + (keys.current.a || keys.current.left ? -1 : 0);
    let vz = (keys.current.s || keys.current.down ? 1 : 0) + (keys.current.w || keys.current.up ? -1 : 0);
    vx += steer.x;
    vz += steer.y;

    // move
    const len = Math.hypot(vx, vz);
    if (len > 0.001) {
      vx /= len; vz /= len;
      p.x += vx * SPEED * dt;
      p.z += vz * SPEED * dt;

      // clamp inside island
      const r = Math.hypot(p.x, p.z);
      const maxR = 13.0;
      if (r > maxR) {
        const t = maxR / r;
        p.x *= t; p.z *= t;
      }
    }

    // chase camera
    const yaw = Math.atan2(vx, -vz) || 0;
    const camX = p.x - Math.sin(yaw) * CAM_BACK;
    const camZ = p.z - Math.cos(yaw) * CAM_BACK;
    camera.position.lerp({ x: camX, y: CAM_HEIGHT, z: camZ }, 0.15);
    camera.lookAt(p.x, 0.7, p.z);

    setPos(p.x, p.y, p.z);
  });

  // simple avatar
  return (
    <group ref={ref} visible={active}>
      {/* body */}
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.5, 16]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.60, 0]} castShadow>
        <sphereGeometry args={[0.13, 18, 18]} />
        <meshStandardMaterial color="#f5deb3" />
      </mesh>
      {/* facing indicator */}
      <mesh position={[0, 0.60, 0.14]}>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshStandardMaterial emissive="#ffffff" emissiveIntensity={1.2} color="#ffffff" />
      </mesh>
    </group>
  );
}
