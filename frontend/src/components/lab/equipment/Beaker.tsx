import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ContainerSubstance } from "../../../stores/labStore";
import BubbleEffect from "../effects/BubbleEffect";
import SteamEffect from "../effects/SteamEffect";
import FlameEffect from "../effects/FlameEffect";
import PrecipitateEffect from "../effects/PrecipitateEffect";

const CAPACITY_ML = 250;

interface BeakerProps {
  position: [number, number, number];
  selected?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (e: ThreeEvent<MouseEvent>) => void;
  // Legacy direct props (used by static starter items)
  fillLevel?: number;
  fillColor?: string;
  // Dynamic props from store
  contents?: ContainerSubstance[];
  activeEffects?: string[];
  temperature?: number;
}

/** Blend hex colors equally by averaging RGB channels. */
function blendColors(colors: string[]): string {
  if (colors.length === 0) return "#4fc3f7";
  if (colors.length === 1) return colors[0];
  let r = 0, g = 0, b = 0;
  for (const hex of colors) {
    const c = new THREE.Color(hex);
    r += c.r; g += c.g; b += c.b;
  }
  return new THREE.Color(r / colors.length, g / colors.length, b / colors.length).getHexString().padStart(6, "0").replace(/^/, "#");
}

export default function Beaker({
  position,
  selected = false,
  onClick,
  onContextMenu,
  fillLevel: fillLevelProp,
  fillColor: fillColorProp,
  contents,
  activeEffects = [],
  temperature = 25,
}: BeakerProps) {
  const groupRef = useRef<THREE.Group>(null);

  const height = 0.3;
  const radiusBottom = 0.08;
  const radiusTop = 0.1;
  const radialSegments = 24;
  const wallThickness = 0.005;

  // Derive fill level and color from contents if provided, else fall back to legacy props
  let fillLevel = fillLevelProp ?? 0;
  let fillColor = fillColorProp ?? "#4fc3f7";

  if (contents && contents.length > 0) {
    const totalMl = contents.reduce((sum, s) => sum + s.amount_ml, 0);
    fillLevel = Math.min(1, totalMl / CAPACITY_ML);
    fillColor = blendColors(contents.map((s) => s.color));
  }

  // Liquid fill dimensions
  const fillHeight = Math.max(0, fillLevel) * (height - 0.02);
  const fillRadiusBottom = radiusBottom - wallThickness;
  const fillRadiusTop =
    fillRadiusBottom +
    (radiusTop - radiusBottom - wallThickness) * Math.min(1, fillLevel);
  const fillY = -height / 2 + fillHeight / 2 + 0.01;

  // Emissive glow when hot
  const isHot = temperature > 60;
  const glassColor = isHot ? "#ffe0b2" : "#c8e6ff";
  const glassEmissive = isHot ? new THREE.Color("#ff6600") : new THREE.Color("#000000");
  const glassEmissiveIntensity = isHot ? 0.15 : 0;

  // Effect anchor: top of the liquid, centered
  const effectAnchorY = -height / 2 + fillHeight + 0.02;
  const effectPos: [number, number, number] = [0, effectAnchorY, 0];

  // Precipitate color: first substance color, or white
  const precipColor = contents && contents.length > 0 ? contents[0].color : "#ffffff";

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <group ref={groupRef} position={position} onClick={handleClick} onContextMenu={onContextMenu}>
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
          color={glassColor}
          emissive={glassEmissive}
          emissiveIntensity={glassEmissiveIntensity}
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
          color={glassColor}
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

      {/* Active effects */}
      {activeEffects.includes("bubbles") && (
        <BubbleEffect position={effectPos} rate="moderate" />
      )}
      {activeEffects.includes("steam") && (
        <SteamEffect position={[0, height / 2, 0]} />
      )}
      {activeEffects.includes("flame") && (
        <FlameEffect position={[0, -height / 2 - 0.04, 0]} />
      )}
      {activeEffects.includes("precipitate") && (
        <PrecipitateEffect position={effectPos} color={precipColor} />
      )}
    </group>
  );
}
