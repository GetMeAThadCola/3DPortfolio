// src/components/Player.jsx
import React, { useRef, useEffect, Suspense } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PositionalAudio } from "@react-three/drei";
import usePlayer from "../store/usePlayer.js";
import useControls from "../store/useControls.js";
import Car from "./Car.jsx"; // <-- your model

// Tuning
const MODEL_FORWARD_IS_NEG_Z = false;
const MAX_SPEED = 6.2, MAX_REVERSE = 1.9;
const ACCEL = 8.2, BRAKE = 7.2, DRAG = 1.6;
const TURN_BASE = 1.5, TURN_RATE = 2.6;
const LAMBDA_STEER = 12, LAMBDA_THR = 10;
const CHASE_BACK = 5.5, CHASE_HEIGHT = 3.8;
const SKID_URL = "/audio/skid.mp3", SKID_VOL = 0.25;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const expSmooth = (c, t, l, dt) => c + (t - c) * (1 - Math.exp(-l * dt));
const curve = (v) => Math.sign(v) * Math.abs(v) ** 3;

export default function Player({ active = true }) {
  const ref = useRef();
  const skidRef = useRef();
  const { camera } = useThree();

  const heading = useRef(0);
  const speed = useRef(0);
  const steerFilt = useRef(0);
  const thrFilt = useRef(0);
  const alive = useRef(true);

  const setPos = usePlayer((s) => s.setPos);
  const steer = useControls((s) => s.steer);
  const mode = useControls((s) => s.mode);

  // keyboard support
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

  useEffect(() => () => { alive.current = false; }, []);

  // spawn & camera
  useEffect(() => {
    if (!ref.current) return;
    heading.current = Math.PI; // face -Z
    ref.current.position.set(0, 0.02, 2.5);
    const p = ref.current.position;
    const camX = p.x - Math.sin(heading.current) * CHASE_BACK;
    const camZ = p.z - Math.cos(heading.current) * CHASE_BACK;
    camera.position.set(camX, p.y + CHASE_HEIGHT, camZ);
    camera.lookAt(p.x, p.y + 0.55, p.z);
  }, [camera]);

  // skid audio
  useEffect(() => {
    const a = skidRef.current;
    if (!a) return;
    try { a.setLoop(true); a.setRefDistance(6); a.setVolume(0); } catch {}
    const unlock = () => { try { if (!a.isPlaying) a.play(); } catch {} };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useFrame((_, dt) => {
    if (!alive.current || !ref.current) return;

    // only run in car mode
    if (!active || mode !== "car") return;

    // combine keyboard + joystick
    const kx = (keys.current.d || keys.current.right ? 1 : 0) + (keys.current.a || keys.current.left ? -1 : 0);
    const ky = (keys.current.s || keys.current.down ? 1 : 0) + (keys.current.w || keys.current.up ? -1 : 0);
    const inputX = clamp(steer.x + kx, -1, 1);
    const inputY = clamp(steer.y + ky, -1, 1);

    const targetSteer = curve(-inputX);
    const targetThr   = curve(-inputY);

    steerFilt.current = expSmooth(steerFilt.current, targetSteer, LAMBDA_STEER, dt);
    thrFilt.current   = expSmooth(thrFilt.current,   targetThr,   LAMBDA_THR,   dt);

    // physics
    const throttle = thrFilt.current;
    const accel = throttle >= 0 ? throttle * ACCEL : throttle * BRAKE;
    speed.current += accel * dt;

    const drag = DRAG * dt;
    if (speed.current > 0) speed.current = Math.max(0, speed.current - drag);
    else if (speed.current < 0) speed.current = Math.min(0, speed.current + drag);
    speed.current = clamp(speed.current, -MAX_REVERSE, MAX_SPEED);

    const steerAuthority = TURN_BASE + TURN_RATE * (Math.min(1, Math.abs(speed.current) / MAX_SPEED));
    const steerAmount = steerFilt.current * steerAuthority;
    heading.current += steerAmount * dt;

    const dirX = Math.sin(heading.current);
    const dirZ = Math.cos(heading.current);
    ref.current.position.x += dirX * speed.current * dt;
    ref.current.position.z += dirZ * speed.current * dt;
    ref.current.position.y = 0.02;

    // clamp inside island
    const r = Math.hypot(ref.current.position.x, ref.current.position.z);
    const maxR = 13.0;
    if (r > maxR) {
      const t = maxR / r;
      ref.current.position.x *= t;
      ref.current.position.z *= t;
      speed.current *= -0.4;
    }

    // rotate mesh
    const yaw = MODEL_FORWARD_IS_NEG_Z ? heading.current + Math.PI : heading.current;
    ref.current.rotation.y = yaw;

    // camera chase
    const p = ref.current.position;
    const camX = p.x - Math.sin(heading.current) * CHASE_BACK;
    const camZ = p.z - Math.cos(heading.current) * CHASE_BACK;
    camera.position.lerp({ x: camX, y: p.y + CHASE_HEIGHT, z: camZ }, 0.12);
    camera.lookAt(p.x, p.y + 0.55, p.z);

    // skid audio
    const a = skidRef.current;
    if (a) {
      const turnForce = Math.abs(steerAmount);
      const skidLevel = Math.min(1, turnForce * 2.2) * (Math.abs(speed.current) / MAX_SPEED);
      try { a.setVolume(skidLevel * SKID_VOL); if (!a.isPlaying && skidLevel > 0.02) a.play(); } catch {}
    }

    setPos(p.x, p.y, p.z);
  });

  return (
    <group ref={ref} position={[0, 0.02, 0]}>
      <Suspense
        fallback={
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.22, 1.2]} />
            <meshStandardMaterial color="#6aa7ff" />
          </mesh>
        }
      >
        {/* Your car model (faces +Z) */}
        <Car fit={0.30} rotateY={0} />
        <PositionalAudio ref={skidRef} url={SKID_URL} distance={8} />
      </Suspense>
    </group>
  );
}
