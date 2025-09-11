// src/components/FootController.jsx
import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import usePlayer from "../store/usePlayer.js";
import useControls from "../store/useControls.js";

const WALK_SPEED = 3.1;
const CAM_HEIGHT = 1.8;
const CAM_BACK = 3.4;     // further back so you see where you go
const LOOK_AHEAD = 2.0;   // look a bit ahead along heading
const MAX_R = 13.0;

export default function FootController({ active = false }) {
  const ref = useRef();
  const lastYaw = useRef(0); // remember heading even when standing still
  const { camera } = useThree();

  const setPos = usePlayer((s) => s.setPos);
  const spawn = usePlayer((s) => s.pos);
  const steer = useControls((s) => s.steer);

  // spawn where the car was
  useEffect(() => {
    if (ref.current && spawn) ref.current.position.set(spawn[0], 0.02, spawn[2]);
  }, [spawn]);

  // WASD/Arrows
  const keys = useRef({ w:false,a:false,s:false,d:false,up:false,down:false,left:false,right:false });
  useEffect(() => {
    const dn = (e) => {
      const c = e.code;
      if (c === "KeyW" || c === "ArrowUp") keys.current.w = true;
      if (c === "KeyS" || c === "ArrowDown") keys.current.s = true;
      if (c === "KeyA" || c === "ArrowLeft") keys.current.a = true;
      if (c === "KeyD" || c === "ArrowRight") keys.current.d = true;
    };
    const up = (e) => {
      const c = e.code;
      if (c === "KeyW" || c === "ArrowUp") keys.current.w = false;
      if (c === "KeyS" || c === "ArrowDown") keys.current.s = false;
      if (c === "KeyA" || c === "ArrowLeft") keys.current.a = false;
      if (c === "KeyD" || c === "ArrowRight") keys.current.d = false;
    };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, []);

  useFrame((_, dt) => {
    if (!active || !ref.current) return;

    const p = ref.current.position;

    // combine keyboard + joystick (note: up on joystick is -y)
    let vx = 0;
    let vz = 0;
    if (keys.current.d) vx += 1;
    if (keys.current.a) vx -= 1;
    if (keys.current.s) vz += 1;
    if (keys.current.w) vz -= 1;

    vx += steer.x;
    vz += -steer.y;

    // normalize
    const len = Math.hypot(vx, vz);
    if (len > 0.001) {
      vx /= len; vz /= len;
      // update last heading from movement vector
      lastYaw.current = Math.atan2(vx, -vz);
      // move
      p.x += vx * WALK_SPEED * dt;
      p.z += vz * WALK_SPEED * dt;

      // clamp inside island
      const r = Math.hypot(p.x, p.z);
      if (r > MAX_R) {
        const t = MAX_R / r;
        p.x *= t; p.z *= t;
      }
    }

    // avatar faces where we're heading (when idle, keep lastYaw)
    ref.current.rotation.y = lastYaw.current;

    // third-person chase camera
    const camX = p.x - Math.sin(lastYaw.current) * CAM_BACK;
    const camZ = p.z - Math.cos(lastYaw.current) * CAM_BACK;
    camera.position.lerp({ x: camX, y: CAM_HEIGHT, z: camZ }, 0.15);

    // look slightly ahead in the direction of travel
    const lookX = p.x + Math.sin(lastYaw.current) * LOOK_AHEAD;
    const lookZ = p.z + Math.cos(lastYaw.current) * LOOK_AHEAD;
    camera.lookAt(lookX, 1.1, lookZ);

    setPos(p.x, p.y, p.z);
  });

  // a simple, readable avatar
  return (
    <group ref={ref} visible={active}>
      {/* body */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.6, 18]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      {/* head */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial color="#f5deb3" />
      </mesh>
      {/* eyes to see facing */}
      <mesh position={[0.05, 0.78, 0.13]}>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshStandardMaterial emissive="#ffffff" emissiveIntensity={1.3} color="#ffffff" />
      </mesh>
      <mesh position={[-0.05, 0.78, 0.13]}>
        <sphereGeometry args={[0.02, 12, 12]} />
        <meshStandardMaterial emissive="#ffffff" emissiveIntensity={1.3} color="#ffffff" />
      </mesh>
    </group>
  );
}
