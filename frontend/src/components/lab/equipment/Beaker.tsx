import { useRef } from "react";
import * as THREE from "three";

interface BeakerProps {
  position: [number, number, number];
  selected?: boolean;
  onClick?: (e: THREE.Event) => void;
  fillLevel?: number; // 0–1
  fillColor?: string;
}

export default function Beaker({
  position,
  selected = false,
  onClick,
  fillLevel = 0,
  fillColor = "#4fc3f7",
}: BeakerProps) {
  const groupRef = useRef<THREE.Group>(null);

  const height = 0.3;
  const radiusBottom = 0.08;
  const radiusTop = 0.1;
  const radialSegments = 24;
  const wallThickness = 0.005;

  // Liquid fill dimensions
  const fillHeight = Math.max(0, fillLevel) * (height - 0.02);
  const fillRadiusBottom = radiusBottom - wallThickness;
  const fillRadiusTop =
    fillRadiusBottom +
    (radiusTop - radiusBottom - wallThickness) * Math.min(1, fillLevel);
  const fillY = -height / 2 + fillHeight / 2 + 0.01;

  const handleClick = (e: any) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <group ref={groupRef} position={position} onClick={handleClick}>
      {/* Glass body */}
      <mesh castShadow>
        <cylinderGeometry
          args={[radiusTop, radiusBottom, height, radialSegments, 1, true]}
        />
        <meshPhysicalMaterial
          transparent
          opacity={0.25}
          roughness={0.0}
          metalness={0.0}
          transmission={0.9}
          thickness={0.5}
          side={THREE.DoubleSide}
          color="#c8e6ff"
        />
      </mesh>

      {/* Bottom disk */}
      <mesh position={[0, -height / 2, 0]} castShadow>
        <cylinderGeometry args={[radiusBottom, radiusBottom, 0.008, radialSegments]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.3}
          roughness={0.0}
          metalness={0.0}
          transmission={0.85}
          thickness={0.3}
          color="#c8e6ff"
        />
      </mesh>

      {/* Liquid fill */}
      {fillLevel > 0 && (
        <mesh position={[0, fillY, 0]}>
          <cylinderGeometry
            args={[fillRadiusTop, fillRadiusBottom, fillHeight, radialSegments]}
          />
          <meshStandardMaterial
            color={fillColor}
            transparent
            opacity={0.75}
            roughness={0.1}
          />
        </mesh>
      )}

      {/* Selection highlight — wireframe outline */}
      {selected && (
        <mesh>
          <cylinderGeometry
            args={[
              radiusTop + 0.005,
              radiusBottom + 0.005,
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
