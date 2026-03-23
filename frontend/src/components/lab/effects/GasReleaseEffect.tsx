import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface GasReleaseEffectProps {
  position: [number, number, number];
  gasFormula: string;
}

const GAS_COLORS: Record<string, string> = {
  H2: "#e0e0e0",
  He: "#e8e8e8",
  O2: "#e0e0e0",
  N2: "#e0e0e0",
  CO2: "#d0d0d0",
  Cl2: "#90ee90",
  Br2: "#8b4513",
  NO2: "#8b4513",
  NH3: "#e8e8ff",
  H2S: "#ffffcc",
  SO2: "#ffffcc",
  HCl: "#f0f0f0",
};

const GAS_RISE_SPEED: Record<string, number> = {
  H2: 0.12,
  He: 0.11,
  NH3: 0.07,
  H2O: 0.06,
  N2: 0.05,
  O2: 0.05,
  HCl: 0.045,
  NO2: 0.04,
  H2S: 0.035,
  CO2: 0.03,
  SO2: 0.025,
  Cl2: 0.02,
  Br2: 0.015,
};

const DEFAULT_COLOR = "#d8d8d8";
const DEFAULT_SPEED = 0.05;
const PARTICLE_COUNT = 16;

export default function GasReleaseEffect({ position, gasFormula }: GasReleaseEffectProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef<THREE.Object3D>(new THREE.Object3D());

  // Each particle: x, y, z, age (0–1), driftX, driftZ
  const particles = useRef<Float32Array | undefined>(undefined);

  const color = GAS_COLORS[gasFormula] ?? DEFAULT_COLOR;
  const riseSpeed = GAS_RISE_SPEED[gasFormula] ?? DEFAULT_SPEED;

  useLayoutEffect(() => {
    particles.current = new Float32Array(PARTICLE_COUNT * 6);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const base = i * 6;
      particles.current[base]     = (Math.random() - 0.5) * 0.15;  // x
      particles.current[base + 1] = Math.random() * 0.5;            // y — spread on first frame
      particles.current[base + 2] = (Math.random() - 0.5) * 0.15;  // z
      particles.current[base + 3] = Math.random();                   // age
      particles.current[base + 4] = (Math.random() - 0.5) * 0.04;  // driftX
      particles.current[base + 5] = (Math.random() - 0.5) * 0.04;  // driftZ
    }
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current || !particles.current) return;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const base = i * 6;

      // Rise and drift
      particles.current[base + 1] += riseSpeed * delta;
      particles.current[base]     += particles.current[base + 4] * delta;
      particles.current[base + 2] += particles.current[base + 5] * delta;
      particles.current[base + 3] += delta * 0.35; // age advances

      // Reset when particle dies
      if (particles.current[base + 3] > 1.0) {
        particles.current[base]     = (Math.random() - 0.5) * 0.1;
        particles.current[base + 1] = 0.0; // spawn at container mouth
        particles.current[base + 2] = (Math.random() - 0.5) * 0.1;
        particles.current[base + 3] = 0;
        particles.current[base + 4] = (Math.random() - 0.5) * 0.04;
        particles.current[base + 5] = (Math.random() - 0.5) * 0.04;
      }

      const age = particles.current[base + 3];
      // Start small, grow slightly, then fade out
      const scale = Math.max(0.01, (1 - age) * 0.08 + 0.02);

      dummy.current.position.set(
        particles.current[base],
        particles.current[base + 1],
        particles.current[base + 2],
      );
      dummy.current.scale.setScalar(scale);
      dummy.current.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.current.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Opacity varies by gas visibility: colorful gases are more opaque
  const isColorless = color === "#e0e0e0" || color === "#d0d0d0" || color === "#e8e8e8";
  const opacity = isColorless ? 0.22 : 0.45;

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
        <sphereGeometry args={[1, 7, 7]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
}
