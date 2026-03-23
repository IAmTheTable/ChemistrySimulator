import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SmokeEffectProps {
  position: [number, number, number];
}

const PARTICLE_COUNT = 14;

export default function SmokeEffect({ position }: SmokeEffectProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef<THREE.Object3D>(new THREE.Object3D());

  // Each particle: x, y, z, age (0–1)
  const particles = useRef<Float32Array | undefined>(undefined);

  useLayoutEffect(() => {
    particles.current = new Float32Array(PARTICLE_COUNT * 4);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.current[i * 4] = (Math.random() - 0.5) * 0.18;
      particles.current[i * 4 + 1] = Math.random() * 0.5; // start spread out
      particles.current[i * 4 + 2] = (Math.random() - 0.5) * 0.18;
      particles.current[i * 4 + 3] = Math.random(); // age
    }
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current || !particles.current) return;
    const speed = 0.035; // slower than steam
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.current[i * 4 + 1] += speed * delta;
      particles.current[i * 4 + 3] += delta * 0.18; // slow age advance — lingers longer

      if (particles.current[i * 4 + 3] > 1.0) {
        // reset particle
        particles.current[i * 4] = (Math.random() - 0.5) * 0.18;
        particles.current[i * 4 + 1] = 0.05;
        particles.current[i * 4 + 2] = (Math.random() - 0.5) * 0.18;
        particles.current[i * 4 + 3] = 0;
      }

      const age = particles.current[i * 4 + 3];
      // Larger than steam, grows slightly then fades
      const scale = Math.max(0.01, (1 - age) * 2.0 + 0.15);
      dummy.current.position.set(
        particles.current[i * 4],
        particles.current[i * 4 + 1],
        particles.current[i * 4 + 2],
      );
      dummy.current.scale.setScalar(scale);
      dummy.current.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.current.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#333333" transparent opacity={0.35} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
