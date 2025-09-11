// src/components/Player.jsx
import React, { useRef, Suspense, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { PositionalAudio } from "@react-three/drei";
import Car from "./Car.jsx";
import usePlayer from "../store/usePlayer.js";
import useControls from "../store/useControls.js";

// Your car model faces +Z
const MODEL_FORWARD_IS_NEG_Z = false;

/** Tuning **/
const MAX_SPEED = 6.2;      // forward m/s
const MAX_REVERSE = 1.9;    // reverse m/s
const ACCEL = 8.2;          // throttle accel
const BRAKE = 7.2;          // reverse/brake accel
const DRAG = 1.6;           // linear drag

// Steering
const TURN_BASE = 1.5;      // rad/s base (at standstill)
const TURN_RATE = 2.6;      // extra rad/s at full speed

// Smoothing
const LAMBDA_STEER = 12;    // higher = snappier
const LAMBDA_THR   = 10;

// Camera
const CHASE_BACK = 6.8;     // distance behind the car (bigger to see more)
const CHASE_HEIGHT = 4.2;   // height above ground

// Make the car bigger here ⬇
const CAR_SCALE = 1.8;      // bump this up/down to size the whole vehicle

// Audio
const SKID_URL = "/audio/skid.mp3";
const SKID_VOL = 0.25;

function expSmooth(curr, target, lambda, dt) {
  const a = 1 - Math.exp(-lambda * dt);
  return curr + (target - curr) * a;
}
function curve(v) {
  const s = Math.sign(v);
  const a = Math.abs(v);
  return s * a * a * a;
}

export default function Player({ active = false }) {
  const ref = useRef();
  const skidRef = useRef();
  const { camera } = useThree();

  // car state
  const heading = useRef(0);
  const speed = useRef(0);
  const steerFilt = useRef(0);
  const thrFilt = useRef(0);

  const setPos = usePlayer((s) => s.setPos);
  const steer = useControls((s) => s.steer);

  // Spawn facing the Resume building and place camera immediately
  useEffect(() => {
    if (!ref.current) return;
    heading.current = Math.PI; // face -Z
    const y = 0.02;
    ref.current.position.set(0, y, 2.5);

    const p = ref.current.position;
    const camX = p.x - Math.sin(heading.current) * CHASE_BACK;
    const camZ = p.z - Math.cos(heading.current) * CHASE_BACK;
    camera.position.set(camX, p.y + CHASE_HEIGHT, camZ);
    camera.lookAt(p.x, p.y + 0.55, p.z);
  }, [camera]);

  // Prepare skid audio and unlock after first gesture
  useEffect(() => {
    const a = skidRef.current;
    if (!a) return;

    try {
      a.setLoop(true);
      a.setRefDistance(6);
      a.setVolume(0);
    } catch {}

    const unlock = () => {
      try {
        if (!a.isPlaying) a.play();
      } catch {}
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };

    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useFrame((state, dt) => {
    if (!active || !ref.current) return;

    // ----- INPUTS -----
    const targetSteer = curve(-steer.x); // left/right
    const targetThr   = curve(-steer.y); // up = forward

    steerFilt.current = expSmooth(steerFilt.current, targetSteer, LAMBDA_STEER, dt);
    thrFilt.current   = expSmooth(thrFilt.current,   targetThr,   LAMBDA_THR,   dt);

    // ----- PHYSICS -----
    const throttle = thrFilt.current; // -1..1
    const accel = throttle >= 0 ? throttle * ACCEL : throttle * BRAKE;
    speed.current += accel * dt;

    // drag
    const drag = DRAG * dt;
    if (speed.current > 0) speed.current = Math.max(0, speed.current - drag);
    else if (speed.current < 0) speed.current = Math.min(0, speed.current + drag);

    // clamp speed
    if (speed.current > MAX_SPEED) speed.current = MAX_SPEED;
    if (speed.current < -MAX_REVERSE) speed.current = -MAX_REVERSE;

    // steering authority
    const steerAuthority = TURN_BASE + TURN_RATE * (Math.min(1, Math.abs(speed.current) / MAX_SPEED));
    const steerAmount = steerFilt.current * steerAuthority;
    heading.current += steerAmount * dt;

    // move along heading
    const dirX = Math.sin(heading.current);
    const dirZ = Math.cos(heading.current);
    ref.current.position.x += dirX * speed.current * dt;
    ref.current.position.z += dirZ * speed.current * dt;
    ref.current.position.y = 0.02;

    // boundary clamp
    const r = Math.hypot(ref.current.position.x, ref.current.position.z);
    const maxR = 13.0;
    if (r > maxR) {
      const t = maxR / r;
      ref.current.position.x *= t;
      ref.current.position.z *= t;
    }

    // face heading
    const yaw = MODEL_FORWARD_IS_NEG_Z ? heading.current + Math.PI : heading.current;
    ref.current.rotation.y = yaw;

    // ----- CHASE CAMERA -----
    const p = ref.current.position;
    const camX = p.x - Math.sin(heading.current) * CHASE_BACK;
    const camZ = p.z - Math.cos(heading.current) * CHASE_BACK;
    camera.position.lerp({ x: camX, y: p.y + CHASE_HEIGHT, z: camZ }, 0.12);
    camera.lookAt(p.x, p.y + 0.55, p.z);

    // ----- SKID SOUND -----
    const a = skidRef.current;
    if (a) {
      const turnForce = Math.abs(steerAmount);
      const skidLevel = Math.min(1, turnForce * 2.2) * (Math.abs(speed.current) / MAX_SPEED);
      try {
        a.setVolume(skidLevel * SKID_VOL);
        if (!a.isPlaying && skidLevel > 0.02) a.play();
      } catch {}
    }

    setPos(p.x, p.y, p.z);
  });

  return (
    <group ref={ref} position={[0, 0.02, 0]} scale={CAR_SCALE} visible={active}>
      <Suspense
        fallback={
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.22, 0.8]} />
            <meshStandardMaterial color="#6aa7ff" />
          </mesh>
        }
      >
        <group position={[0, 0, 0]}>
          {/* If your Car has its own scaling, you can lower this "fit" now that scale is applied */}
          <Car fit={0.35} rotateY={0} />
          <PositionalAudio ref={skidRef} url={SKID_URL} distance={8} />
        </group>
      </Suspense>
    </group>
  );
}
