import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface PrecipitateEffectProps {
  position: [number, number, number];
  color?: string;
}

const PARTICLE_COUNT = 20;
const FALL_BOTTOM = -0.08; // y at which particles stop (bottom of liquid)
const SPAWN_TOP = 0.15;    // y at which particles spawn (top of liquid)

export default function PrecipitateEffect({ position, color = "#ffffff" }: PrecipitateEffectProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef<THREE.Object3D>(new THREE.Object3D());

  // Each particle: x, y, z, settled (0 = falling, 1 = settled)
  const particles = useRef<Float32Array | undefined>(undefined);

  if (!particles.current) {
    particles.current = new Float32Array(PARTICLE_COUNT * 4);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const spread = 0.07;
      particles.current[i * 4] = (Math.random() - 0.5) * spread;
      particles.current[i * 4 + 1] = Math.random() * (SPAWN_TOP - FALL_BOTTOM) + FALL_BOTTOM;
      particles.current[i * 4 + 2] = (Math.random() - 0.5) * spread;
      particles.current[i * 4 + 3] = 0; // not settled initially
    }
  }

  useFrame((_, delta) => {
    if (!meshRef.current || !particles.current) return;
    const fallSpeed = 0.018;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const settled = particles.current[i * 4 + 3];
      if (settled < 1) {
        particles.current[i * 4 + 1] -= fallSpeed * delta;
        if (particles.current[i * 4 + 1] <= FALL_BOTTOM) {
          particles.current[i * 4 + 1] = FALL_BOTTOM;
          particles.current[i * 4 + 3] = 1; // mark as settled
        }
      }

      dummy.current.position.set(
        particles.current[i * 4],
        particles.current[i * 4 + 1],
        particles.current[i * 4 + 2],
      );
      dummy.current.scale.setScalar(1);
      dummy.current.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.current.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const precipColor = new THREE.Color(color);

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[0.005, 6, 6]} />
        <meshStandardMaterial color={precipColor} roughness={0.8} metalness={0.1} />
      </instancedMesh>
    </group>
  );
}
