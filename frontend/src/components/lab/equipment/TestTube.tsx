import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

interface TestTubeProps {
  position: [number, number, number];
  selected?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  fillLevel?: number; // 0–1
  fillColor?: string;
}

export default function TestTube({
  position,
  selected = false,
  onClick,
  fillLevel = 0,
  fillColor = "#a5d6a7",
}: TestTubeProps) {
  const groupRef = useRef<THREE.Group>(null);

  const height = 0.25;
  const radius = 0.025;
  const radialSegments = 16;
  const wallThickness = 0.003;

  // Liquid fill
  const fillHeight = Math.max(0, fillLevel) * (height - 0.02);
  const fillRadius = radius - wallThickness;
  const fillY = -height / 2 + fillHeight / 2 + 0.01;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <group ref={groupRef} position={position} onClick={handleClick}>
      {/* Glass tube body — open-top cylinder */}
      <mesh castShadow>
        <cylinderGeometry
          args={[radius, radius, height, radialSegments, 1, true]}
        />
        <meshPhysicalMaterial
          transparent
          opacity={0.2}
          roughness={0.0}
          metalness={0.0}
          transmission={0.92}
          thickness={0.3}
          side={THREE.DoubleSide}
          color="#ddeeff"
        />
      </mesh>

      {/* Rounded bottom — small hemisphere approximated by a flat disk + half-sphere */}
      <mesh position={[0, -height / 2, 0]} castShadow>
        <sphereGeometry args={[radius, radialSegments, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.22}
          roughness={0.0}
          metalness={0.0}
          transmission={0.92}
          thickness={0.3}
          color="#ddeeff"
        />
      </mesh>

      {/* Liquid fill */}
      {fillLevel > 0 && (
        <mesh position={[0, fillY, 0]}>
          <cylinderGeometry
            args={[fillRadius, fillRadius, fillHeight, radialSegments]}
          />
          <meshStandardMaterial
            color={fillColor}
            transparent
            opacity={0.8}
            roughness={0.1}
          />
        </mesh>
      )}

      {/* Selection highlight */}
      {selected && (
        <mesh>
          <cylinderGeometry
            args={[
              radius + 0.004,
              radius + 0.004,
              height + 0.01,
              radialSegments,
              1,
              true,
            ]}
          />
          <meshBasicMaterial
            color="#facc15"
            wireframe
            transparent
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
}
