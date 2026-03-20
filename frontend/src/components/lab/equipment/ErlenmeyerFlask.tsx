import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

interface ErlenmeyerFlaskProps {
  position: [number, number, number];
  selected?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  fillLevel?: number; // 0–1
  fillColor?: string;
}

export default function ErlenmeyerFlask({
  position,
  selected = false,
  onClick,
  fillLevel = 0,
  fillColor = "#ffb74d",
}: ErlenmeyerFlaskProps) {
  const groupRef = useRef<THREE.Group>(null);

  const bodyHeight = 0.18;
  const neckHeight = 0.08;
  const baseRadius = 0.1;
  const shoulderRadius = 0.025;
  const neckRadius = 0.02;
  const radialSegments = 24;

  // Conical body: wide at bottom, narrow at top (shoulder)
  // Neck sits on top of the conical body

  // Total height for fill calculations
  const totalFillableHeight = bodyHeight - 0.01;
  const fillHeight = Math.max(0, fillLevel) * totalFillableHeight;
  // Fill radius interpolates from baseRadius to shoulderRadius as fill rises
  const fillTopRadius =
    baseRadius - (baseRadius - shoulderRadius) * Math.min(1, fillLevel);
  const fillBottomRadius = baseRadius - 0.005;
  const fillY = -bodyHeight / 2 + fillHeight / 2 + 0.005;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <group ref={groupRef} position={position} onClick={handleClick}>
      {/* Conical body — wide at bottom, narrow at top */}
      <mesh castShadow>
        <cylinderGeometry
          args={[shoulderRadius, baseRadius, bodyHeight, radialSegments, 1, true]}
        />
        <meshPhysicalMaterial
          transparent
          opacity={0.22}
          roughness={0.0}
          metalness={0.0}
          transmission={0.9}
          thickness={0.5}
          side={THREE.DoubleSide}
          color="#c8e6ff"
        />
      </mesh>

      {/* Bottom disk */}
      <mesh position={[0, -bodyHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[baseRadius, baseRadius, 0.008, radialSegments]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.28}
          roughness={0.0}
          metalness={0.0}
          transmission={0.88}
          thickness={0.3}
          color="#c8e6ff"
        />
      </mesh>

      {/* Neck cylinder */}
      <mesh position={[0, bodyHeight / 2 + neckHeight / 2, 0]} castShadow>
        <cylinderGeometry
          args={[neckRadius, shoulderRadius, neckHeight, radialSegments, 1, true]}
        />
        <meshPhysicalMaterial
          transparent
          opacity={0.22}
          roughness={0.0}
          metalness={0.0}
          transmission={0.9}
          thickness={0.5}
          side={THREE.DoubleSide}
          color="#c8e6ff"
        />
      </mesh>

      {/* Liquid fill (in conical body only) */}
      {fillLevel > 0 && (
        <mesh position={[0, fillY, 0]}>
          <cylinderGeometry
            args={[fillTopRadius, fillBottomRadius, fillHeight, radialSegments]}
          />
          <meshStandardMaterial
            color={fillColor}
            transparent
            opacity={0.75}
            roughness={0.1}
          />
        </mesh>
      )}

      {/* Selection highlight — wireframe around conical body */}
      {selected && (
        <mesh>
          <cylinderGeometry
            args={[
              shoulderRadius + 0.005,
              baseRadius + 0.005,
              bodyHeight + 0.01,
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
