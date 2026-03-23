import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SparkEffectProps {
  position: [number, number, number];
}

const PARTICLE_COUNT = 15;

export default function SparkEffect({ position }: SparkEffectProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());
  const elapsed = useRef(0);
  const [visible, setVisible] = useState(true);

  // Random velocities — fast in all directions
  const velocities = useRef<Float32Array | undefined>(undefined);
  if (!velocities.current) {
    velocities.current = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      velocities.current[i * 3] = (Math.random() - 0.5) * 3.0;
      velocities.current[i * 3 + 1] = Math.random() * 2.5 + 0.5;
      velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 3.0;
    }
  }

  useFrame((_, delta) => {
    if (!visible) return;
    elapsed.current += delta;
    const t = elapsed.current;

    // Sparks live for 0.8 seconds
    if (t > 0.8) {
      setVisible(false);
      return;
    }

    if (meshRef.current && velocities.current) {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const vx = velocities.current[i * 3];
        const vy = velocities.current[i * 3 + 1];
        const vz = velocities.current[i * 3 + 2];
        // Apply gravity, fast travel
        dummy.current.position.set(vx * t, vy * t - 3.0 * t * t, vz * t);
        // Shrink quickly to a point
        const scale = Math.max(0, 1 - t / 0.8);
        dummy.current.scale.setScalar(scale);
        dummy.current.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.current.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  if (!visible) return null;

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[0.005, 4, 4]} />
        <meshBasicMaterial color="#ffee00" />
      </instancedMesh>
    </group>
  );
}
