// src/components/Car.jsx
import React, { useMemo, useLayoutEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * Normalizes any GLB:
 * 1) centers at origin
 * 2) scales so the longest side equals `fit`
 * 3) grounds lowest point at y = 0
 * 4) rotates by rotateY (set 0 or Math.PI depending on your model)
 */
export default function Car({ fit = 0.30, rotateY = 0, ...props }) {
  const { scene: loaded } = useGLTF("/models/cartoon-car.glb");
  const car = useMemo(() => loaded.clone(true), [loaded]);

  useLayoutEffect(() => {
    car.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(car);
    if (box.isEmpty()) return;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // 1) center
    car.position.sub(center);

    // 2) scale to fit
    const longest = Math.max(size.x, size.y, size.z) || 1;
    let k = fit / longest;
    if (!isFinite(k) || k <= 0) k = 0.01;
    car.scale.setScalar(k);

    // 3) ground
    const box2 = new THREE.Box3().setFromObject(car);
    if (!box2.isEmpty()) {
      car.position.y -= box2.min.y; // lowest point sits at y=0
    }

    // 4) orientation
    car.rotation.y = rotateY;

    // shadows
    car.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material) o.material.needsUpdate = true;
      }
    });
  }, [car, fit, rotateY]);

  return <primitive object={car} {...props} />;
}

useGLTF.preload("/models/cartoon-car.glb");
