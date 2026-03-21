import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface BubbleEffectProps {
  position: [number, number, number];
  rate?: string;
}

const COUNTS = { gentle: 5, moderate: 15, vigorous: 30 };

export default function BubbleEffect({ position, rate = "moderate" }: BubbleEffectProps) {
  const count = COUNTS[rate as keyof typeof COUNTS] ?? 15;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef<THREE.Object3D>(new THREE.Object3D());
  const positions = useRef<Float32Array | undefined>(undefined);

  if (!positions.current) {
    positions.current = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions.current[i * 3] = (Math.random() - 0.5) * 0.08;
      positions.current[i * 3 + 1] = Math.random() * 0.25;
      positions.current[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
    }
  }

  useFrame((_, delta) => {
    if (!meshRef.current || !positions.current) return;
    const speed = rate === "vigorous" ? 0.15 : rate === "gentle" ? 0.04 : 0.08;
    for (let i = 0; i < count; i++) {
      positions.current[i * 3 + 1] += speed * delta;
      if (positions.current[i * 3 + 1] > 0.3) {
        positions.current[i * 3 + 1] = 0;
        positions.current[i * 3] = (Math.random() - 0.5) * 0.08;
        positions.current[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
      }
      dummy.current.position.set(
        positions.current[i * 3],
        positions.current[i * 3 + 1],
        positions.current[i * 3 + 2],
      );
      dummy.current.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.current.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.4} />
      </instancedMesh>
    </group>
  );
}
