// src/components/Player.jsx
import React, { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PositionalAudio } from "@react-three/drei";
import usePlayer from "../store/usePlayer.js";
import useControls from "../store/useControls.js";

// Tuning
const MODEL_FORWARD_IS_NEG_Z = false;
const MAX_SPEED = 6.2;
const MAX_REVERSE = 1.9;
const ACCEL = 8.2;
const BRAKE = 7.2;
const DRAG = 1.6;
const TURN_BASE = 1.5;
const TURN_RATE = 2.6;
const LAMBDA_STEER = 12;
const LAMBDA_THR = 10;
const CHASE_BACK = 5.5;
const CHASE_HEIGHT = 3.8;
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

/**
 * Player car stays mounted at all times. We pass `active`
 * to turn physics/camera updates on/off to avoid setState-after-unmount.
 */
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
  const mode = useControls((s) => s.mode); // "car" | "foot"

  useEffect(() => () => { alive.current = false; }, []);

  // Spawn facing -Z and position camera once
  useEffect(() => {
    if (!ref.current) return;
    heading.current = Math.PI; // 180°
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

  useFrame((_state, dt) => {
    // If not alive or not the active controller, do nothing
    if (!alive.current || !ref.current) return;
    if (!active || mode !== "car") return;

    // INPUTS
    const targetSteer = curve(-steer.x);
    const targetThr   = curve(-steer.y);
    steerFilt.current = expSmooth(steerFilt.current, targetSteer, LAMBDA_STEER, dt);
    thrFilt.current   = expSmooth(thrFilt.current,   targetThr,   LAMBDA_THR,   dt);

    // PHYS
    const throttle = thrFilt.current;
    const accel = throttle >= 0 ? throttle * ACCEL : throttle * BRAKE;
    speed.current += accel * dt;

    // drag towards 0
    const drag = DRAG * dt;
    if (speed.current > 0) speed.current = Math.max(0, speed.current - drag);
    else if (speed.current < 0) speed.current = Math.min(0, speed.current + drag);

    // clamp
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

    // clamp to island radius
    const r = Math.hypot(ref.current.position.x, ref.current.position.z);
    const maxR = 13.0;
    if (r > maxR) {
      const t = maxR / r;
      ref.current.position.x *= t;
      ref.current.position.z *= t;
      speed.current *= -0.4; // soft bounce
    }

    // face heading
    const yaw = MODEL_FORWARD_IS_NEG_Z ? heading.current + Math.PI : heading.current;
    ref.current.rotation.y = yaw;

    // chase camera when active
    const p = ref.current.position;
    const camX = p.x - Math.sin(heading.current) * CHASE_BACK;
    const camZ = p.z - Math.cos(heading.current) * CHASE_BACK;
    camera.position.lerp({ x: camX, y: p.y + CHASE_HEIGHT, z: camZ }, 0.12);
    camera.lookAt(p.x, p.y + 0.55, p.z);

    // skid sound
    const a = skidRef.current;
    if (a) {
      const turnForce = Math.abs(steerAmount);
      const skidLevel = Math.min(1, turnForce * 2.2) * (Math.abs(speed.current) / MAX_SPEED);
      try {
        a.setVolume(skidLevel * SKID_VOL);
        if (!a.isPlaying && skidLevel > 0.02) a.play();
      } catch {}
    }

    // publish position (only while active)
    if (alive.current) setPos(p.x, p.y, p.z);
  });

  return (
    <group ref={ref} position={[0, 0.02, 0]} visible={true}>
      {/* Simple proxy car (replace with your model if needed) */}
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.22, 1.2]} />
        <meshStandardMaterial color={active ? "#6aa7ff" : "#334155"} />
      </mesh>
      <PositionalAudio ref={skidRef} url={SKID_URL} distance={8} />
    </group>
  );
}
