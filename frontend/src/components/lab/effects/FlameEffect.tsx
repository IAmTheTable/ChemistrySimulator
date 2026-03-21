import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface FlameEffectProps {
  position: [number, number, number];
  color?: string;
}

export default function FlameEffect({ position, color = "#ff6600" }: FlameEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const timeRef = useRef(0); // random phase offset, seeded in useLayoutEffect
  useLayoutEffect(() => {
    timeRef.current = Math.random() * Math.PI * 2;
  }, []);

  useFrame((_, delta) => {
    timeRef.current += delta * 8;
    const t = timeRef.current;

    // Flicker scale on X and Z axes independently
    const scaleX = 1 + Math.sin(t * 1.3) * 0.12 + Math.sin(t * 2.7) * 0.06;
    const scaleY = 1 + Math.sin(t * 0.9) * 0.08 + Math.cos(t * 3.1) * 0.04;
    const scaleZ = 1 + Math.cos(t * 1.7) * 0.10 + Math.sin(t * 2.3) * 0.05;

    if (meshRef.current) {
      meshRef.current.scale.set(scaleX, scaleY, scaleZ);
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 1.8 + Math.sin(t * 2.1) * 0.6;
    }

    if (innerRef.current) {
      innerRef.current.scale.set(scaleX * 0.55, scaleY * 0.7, scaleZ * 0.55);
      const mat = innerRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 3.0 + Math.cos(t * 3.3) * 0.8;
    }

    if (lightRef.current) {
      lightRef.current.intensity = 1.2 + Math.sin(t * 2.5) * 0.4;
    }
  });

  const flameColor = new THREE.Color(color);
  // Inner (hotter) core: shift toward yellow-white
  const innerColor = new THREE.Color(color).lerp(new THREE.Color("#ffff88"), 0.6);

  return (
    <group position={position}>
      {/* Outer flame cone */}
      <mesh ref={meshRef} position={[0, 0.035, 0]}>
        <coneGeometry args={[0.018, 0.07, 10]} />
        <meshStandardMaterial
          color={flameColor}
          emissive={flameColor}
          emissiveIntensity={1.8}
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </mesh>

      {/* Inner core — brighter and tighter */}
      <mesh ref={innerRef} position={[0, 0.028, 0]}>
        <coneGeometry args={[0.010, 0.05, 8]} />
        <meshStandardMaterial
          color={innerColor}
          emissive={innerColor}
          emissiveIntensity={3.0}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </mesh>

      {/* Dynamic point light for scene illumination */}
      <pointLight
        ref={lightRef}
        color={color}
        intensity={1.2}
        distance={0.8}
        decay={2}
        position={[0, 0.04, 0]}
      />
    </group>
  );
}
