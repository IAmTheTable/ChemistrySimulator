import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SteamEffectProps {
  position: [number, number, number];
}

const PARTICLE_COUNT = 12;

export default function SteamEffect({ position }: SteamEffectProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef<THREE.Object3D>(new THREE.Object3D());

  // Each particle: x, y, z, age (0–1)
  const particles = useRef<Float32Array | undefined>(undefined);

  useLayoutEffect(() => {
    particles.current = new Float32Array(PARTICLE_COUNT * 4);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.current[i * 4] = (Math.random() - 0.5) * 0.12;
      particles.current[i * 4 + 1] = Math.random() * 0.35; // start spread out so it isn't empty on first frame
      particles.current[i * 4 + 2] = (Math.random() - 0.5) * 0.12;
      particles.current[i * 4 + 3] = Math.random(); // age
    }
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current || !particles.current) return;
    const speed = 0.06;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.current[i * 4 + 1] += speed * delta;
      particles.current[i * 4 + 3] += delta * 0.4; // age advances

      if (particles.current[i * 4 + 3] > 1.0) {
        // reset particle
        particles.current[i * 4] = (Math.random() - 0.5) * 0.12;
        particles.current[i * 4 + 1] = 0.28; // spawn just above container rim
        particles.current[i * 4 + 2] = (Math.random() - 0.5) * 0.12;
        particles.current[i * 4 + 3] = 0;
      }

      const age = particles.current[i * 4 + 3]; // 0 → 1
      // Scale down and drift slightly as age increases
      const scale = Math.max(0.01, (1 - age) * 1.2 + 0.1);
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
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#cccccc" transparent opacity={0.18} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
