import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function World() {
  const ground = useRef();
  useFrame(() => {
    if (ground.current) ground.current.rotation.z += 0.0002;
  });

  const Tower = ({ pos=[0,0,0], h=2.2, color="#1b2740" }) => (
    <mesh position={[pos[0], h/2, pos[2]]} castShadow receiveShadow>
      <boxGeometry args={[1.1, h, 1.1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );

  return (
    <group>
      {/* Island base */}
      <mesh ref={ground} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[8, 64]} />
        <meshStandardMaterial color="#152035" />
      </mesh>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[8.2, 8.6, 64]} />
        <meshBasicMaterial color="#22314f" />
      </mesh>

      {/* Cross roads */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} receiveShadow>
        <planeGeometry args={[8, 1.6]} />
        <meshStandardMaterial color="#1a1f2e" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]} receiveShadow>
        <planeGeometry args={[1.6, 8]} />
        <meshStandardMaterial color="#1a1f2e" />
      </mesh>
      {[...Array(6)].map((_, i) => (
        <mesh key={`hz-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-3.5 + i * 1.4, 0.003, 0]}>
          <planeGeometry args={[0.6, 0.06]} />
          <meshStandardMaterial color="#dedede" />
        </mesh>
      ))}
      {[...Array(6)].map((_, i) => (
        <mesh key={`vt-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -3.5 + i * 1.4]}>
          <planeGeometry args={[0.06, 0.6]} />
          <meshStandardMaterial color="#dedede" />
        </mesh>
      ))}

      {/* Background towers for skyline depth */}
      <Tower pos={[3.2,0,2.6]} h={2.0} />
      <Tower pos={[-3.0,0,-2.6]} h={2.6} color="#223356" />
      <Tower pos={[2.4,0,-3.2]} h={2.2} color="#2a3a60" />
      <Tower pos={[-2.6,0,3.2]} h={1.8} color="#1f2b46" />
    </group>
  );
}
