// src/components/TitanHead.jsx
import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import usePlayer from "../store/usePlayer.js";

/** Simple toon Titan head that sits ON the wall ring and follows the player. */
export default function TitanHead({
  islandRadius = 14,
  wallRadius   = islandRadius + 0.2, // must match your World wall cylinder radius
  wallTop      = 2.8,

  // Placement/look
  headR         = 0.52,   // skull radius
  headAboveWall = 1.80,   // raised so the full face is visible
  lean          = -0.02,  // negative = slightly toward the city; positive = outward
  skinColor     = "#C79676",
  hairColor     = "#111111",
  irisColor     = "#64E79A",
  eyeWhite      = "#FFFFFF",
  teethColor    = "#FFF6DD",
  mouthColor    = "#5A1515",
  outlineColor  = "#0A0A0A",
}) {
  const root  = useRef();
  const faceG = useRef();
  const playerPos = usePlayer((s) => s.pos);

  /* Materials */
  const mats = useMemo(() => ({
    skin:   new THREE.MeshToonMaterial({ color: skinColor }),
    hair:   new THREE.MeshToonMaterial({ color: hairColor }),
    white:  new THREE.MeshToonMaterial({ color: eyeWhite }),
    iris:   new THREE.MeshToonMaterial({ color: irisColor, emissive: irisColor, emissiveIntensity: 0.25 }),
    pupil:  new THREE.MeshToonMaterial({ color: 0x111111 }),
    teeth:  new THREE.MeshToonMaterial({ color: teethColor }),
    mouth:  new THREE.MeshToonMaterial({ color: mouthColor }),
    brow:   new THREE.MeshToonMaterial({ color: 0x1a1a1a }),
    outline:new THREE.MeshBasicMaterial({ color: outlineColor, side: THREE.BackSide }),
  }), [skinColor, hairColor, eyeWhite, irisColor, teethColor, mouthColor, outlineColor]);

  /* Geometries */
  const geos = useMemo(() => {
    const skull    = new THREE.SphereGeometry(headR, 32, 32);

    // hair
    const hairCap  = new THREE.SphereGeometry(headR + 0.05, 24, 18);
    const bang     = new THREE.BoxGeometry(0.08, 0.26, 0.05);
    const sideburn = new THREE.BoxGeometry(0.06, 0.22, 0.05);

    // ears (bigger & slightly forward)
    const ear      = new THREE.CapsuleGeometry(0.10, 0.06, 10, 16);

    // eyes (iris/pupil/shine float in front of the eyeball)
    const eyeball  = new THREE.SphereGeometry(0.11, 28, 28);
    const irisCir  = new THREE.CircleGeometry(0.074, 28);
    const pupilCir = new THREE.CircleGeometry(0.028, 24);
    const highlight= new THREE.CircleGeometry(0.014, 16);
    const lid      = new THREE.BoxGeometry(0.30, 0.06, 0.06);
    const browBar  = new THREE.BoxGeometry(0.36, 0.06, 0.06);

    // nose + mouth/teeth
    const nose     = new THREE.BoxGeometry(0.08, 0.16, 0.12);
    const lipFrame = new THREE.BoxGeometry(0.56, 0.08, 0.12); // smaller & closer to face
    const tooth    = new THREE.BoxGeometry(0.055, 0.09, 0.045);

    return { skull, hairCap, bang, sideburn, ear, eyeball, irisCir, pupilCir, highlight, lid, browBar, nose, lipFrame, tooth };
  }, [headR]);

  const Outline = ({ geometry, scale = 1.012 }) => (
    <mesh geometry={geometry} material={mats.outline} scale={scale} />
  );

  const Eye = ({ side = 1 }) => {
    const x = side * 0.19;
    // float details in front so they never sink into the sphere
    const irisZ = 0.120, pupilZ = 0.128, hiZ = 0.132;
    return (
      <group position={[x, 0.02, 0.40]}>
        <mesh geometry={geos.eyeball} material={mats.white} />
        <mesh geometry={geos.irisCir}  material={mats.iris}  position={[0, 0, irisZ]} />
        <mesh geometry={geos.pupilCir} material={mats.pupil} position={[0, 0, pupilZ]} />
        <mesh geometry={geos.highlight} material={mats.white} position={[-0.02, 0.015, hiZ]} />
        {/* lids */}
        <mesh geometry={geos.lid} material={mats.skin} position={[0, 0.092, -0.02]} rotation={[0.23 * side, 0, 0]} />
        <mesh geometry={geos.lid} material={mats.skin} position={[0, -0.092, -0.02]} rotation={[-0.20, 0, 0]} />
      </group>
    );
  };

  useFrame((_, dt) => {
    if (!root.current || !playerPos) return;

    const [px, , pz] = playerPos;
    const len = Math.hypot(px, pz) || 1;
    const nx = px / len, nz = pz / len;

    // EXACT ring position; tiny lean along normal if desired
    const r = wallRadius + lean;
    const tx = nx * r, tz = nz * r;
    const ty = wallTop + headAboveWall;

    const k = Math.min(1, dt * 3.0);
    const p = root.current.position;
    p.x += (tx - p.x) * k;
    p.y += (ty - p.y) * k;
    p.z += (tz - p.z) * k;

    // look slightly above player so face stays readable
    faceG.current?.lookAt(px, wallTop + headAboveWall + 1.15, pz);
  });

  return (
    <group ref={root} position={[wallRadius + lean, wallTop + headAboveWall, 0]}>
      <group ref={faceG}>
        {/* skull */}
        <mesh geometry={geos.skull} material={mats.skin} castShadow />
        <Outline geometry={geos.skull} />

        {/* hair cap pulled BACK (won't cover eyes) */}
        <group position={[0, 0.03, -0.16]}>
          <mesh geometry={geos.hairCap} material={mats.hair} castShadow scale={[1.03, 1.02, 0.82]} />
          <Outline geometry={geos.hairCap} scale={1.004} />
        </group>
        {/* center-part + sideburns */}
        {[-2, -1, 1, 2].map((i) => (
          <group key={i} position={[i * 0.11, 0.12 + Math.abs(i) * 0.02, 0.34]} rotation={[0.18, 0, i * 0.08]}>
            <mesh geometry={geos.bang} material={mats.hair} castShadow />
          </group>
        ))}
        <group position={[-0.27, 0.02, 0.26]}><mesh geometry={geos.sideburn} material={mats.hair} castShadow /></group>
        <group position={[0.27, 0.02, 0.26]}><mesh geometry={geos.sideburn} material={mats.hair} castShadow /></group>

        {/* ears (bigger & forward so they read) */}
        <group position={[-0.38, 0.05, 0.04]} rotation={[0, 0, Math.PI / 2]}>
          <mesh geometry={geos.ear} material={mats.skin} castShadow />
        </group>
        <group position={[0.38, 0.05, 0.04]} rotation={[0, 0, -Math.PI / 2]}>
          <mesh geometry={geos.ear} material={mats.skin} castShadow />
        </group>

        {/* brows */}
        <group position={[0.22, 0.12, 0.36]} rotation={[0, 0, -0.45]}>
          <mesh geometry={geos.browBar} material={mats.brow} />
        </group>
        <group position={[-0.22, 0.12, 0.36]} rotation={[0, 0, 0.45]}>
          <mesh geometry={geos.browBar} material={mats.brow} />
        </group>

        {/* eyes */}
        <Eye side={1} />
        <Eye side={-1} />

        {/* nose */}
        <group position={[0, 0.03, 0.30]}>
          <mesh geometry={geos.nose} material={mats.skin} castShadow />
          <Outline geometry={geos.nose} scale={1.008} />
        </group>

        {/* mouth (tighter to face, not floating) */}
        <group position={[0, -0.12, 0.34]}>
          <mesh geometry={geos.lipFrame} material={mats.skin} />
          <Outline geometry={geos.lipFrame} />
          {/* inner mouth */}
          <mesh position={[0, -0.02, 0.00]}>
            <boxGeometry args={[0.52, 0.10, 0.08]} />
            <meshToonMaterial color={mouthColor} />
          </mesh>
          {/* upper teeth */}
          {[-0.22,-0.11,0,0.11,0.22].map((x,i)=>(
            <mesh key={`ut-${i}`} geometry={geos.tooth} material={mats.teeth} position={[x, 0.02, 0.05]} />
          ))}
          {/* lower teeth */}
          {[-0.22,-0.11,0,0.11,0.22].map((x,i)=>(
            <mesh key={`lt-${i}`} geometry={geos.tooth} material={mats.teeth} position={[x, -0.06, 0.00]} />
          ))}
        </group>
      </group>
    </group>
  );
}
