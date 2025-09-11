// src/components/BulletLayer.jsx
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import useControls from "../store/useControls.js";

// Simple moving bullets; handle collisions against pedestrians via refs
export default function BulletLayer({ pedRefs, islandRadius = 14 }) {
  const bullets = useRef([]); // { pos:Vector3, dir:Vector3, speed, life, mesh }

  useFrame((_, dt) => {
    const store = useControls.getState();

    // consume queued spawns
    while (store.bulletQueue.length > 0) {
      const b = store.bulletQueue[0];
      store.shiftBullet();
      const pos = new THREE.Vector3().fromArray(b.pos || [0, 0.25, 0]);
      const dir = new THREE.Vector3().fromArray(b.dir || [0, 0, 1]).normalize();
      const speed = b.speed ?? 16;
      const life = 2.0;

      // make a mesh for this bullet
      const geom = new THREE.SphereGeometry(0.06, 10, 10);
      const mat = new THREE.MeshStandardMaterial({
        color: "#ff4444",
        emissive: "#ff6666",
        emissiveIntensity: 0.5,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);

      bullets.current.push({ pos, dir, speed, life, mesh });
      // attach to scene root via three fiber group? We'll rely on returning children below.
    }

    // advance, collide, cull
    for (let i = bullets.current.length - 1; i >= 0; i--) {
      const b = bullets.current[i];
      b.life -= dt;
      if (b.life <= 0) {
        b._remove = true;
      } else {
        const step = b.dir.clone().multiplyScalar(b.speed * dt);
        b.pos.add(step);
        b.mesh.position.copy(b.pos);

        // clamp if outside island
        const r = Math.hypot(b.pos.x, b.pos.z);
        if (r > islandRadius + 0.5) b._remove = true;

        // collide with pedestrians (simple radius test)
        for (const pr of pedRefs) {
          const target = pr.current;
          if (!target || !target.getPosition || !target.becomeGhost) continue;
          const tp = target.getPosition();
          const d2 = (b.pos.x - tp.x) ** 2 + (b.pos.z - tp.z) ** 2;
          if (d2 < 0.18 * 0.18) { // hit radius ~ 0.18m
            try { target.becomeGhost(); } catch {}
            b._remove = true;
            break;
          }
        }
      }
      if (b._remove) {
        if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
        bullets.current.splice(i, 1);
      }
    }
  });

  // render bullet meshes as children so Three adds them to the scene
  return (
    <group>
      {bullets.current.map((b, i) => (
        <primitive key={i} object={b.mesh} />
      ))}
    </group>
  );
}
