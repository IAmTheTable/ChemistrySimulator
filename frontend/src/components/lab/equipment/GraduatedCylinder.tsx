import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ContainerSubstance } from "../../../stores/labStore";
import BubbleEffect from "../effects/BubbleEffect";
import SteamEffect from "../effects/SteamEffect";
import FlameEffect from "../effects/FlameEffect";
import PrecipitateEffect from "../effects/PrecipitateEffect";
import ExplosionEffect from "../effects/ExplosionEffect";
import SmokeEffect from "../effects/SmokeEffect";
import SparkEffect from "../effects/SparkEffect";
import { computeFillState, getGlassAppearance } from "./equipmentUtils";
import ContentsLabel from "./ContentsLabel";

const CAPACITY_ML = 100;
const COLD_GLASS_COLOR = "#c8e6ff";

interface GraduatedCylinderProps {
  position: [number, number, number];
  selected?: boolean;
  damaged?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (e: ThreeEvent<MouseEvent>) => void;
  contents?: ContainerSubstance[];
  activeEffects?: string[];
  temperature?: number;
}

export default function GraduatedCylinder({
  position,
  selected = false,
  damaged = false,
  onClick,
  onContextMenu,
  contents,
  activeEffects = [],
  temperature = 25,
}: GraduatedCylinderProps) {
  const groupRef = useRef<THREE.Group>(null);

  const height = 0.45;
  const radius = 0.035;
  const radialSegments = 20;
  const wallThickness = 0.004;
  const baseRadius = 0.05;
  const baseHeight = 0.02;

  const computed = contents && contents.length > 0 ? computeFillState(contents, CAPACITY_ML) : null;
  const fillLevel = computed ? computed.fillLevel : 0;
  const fillColor = computed ? computed.fillColor : "#4fc3f7";

  const { glassColor: baseGlassColor, glassEmissive, glassEmissiveIntensity } = getGlassAppearance(temperature, COLD_GLASS_COLOR);
  const glassColor = damaged ? "#5c4033" : baseGlassColor;
  const glassOpacity = damaged ? 0.4 : 0.22;

  // Fill dimensions
  const fillHeight = Math.max(0, fillLevel) * (height - 0.02);
  const fillRadius = radius - wallThickness;
  const fillY = -height / 2 + fillHeight / 2 + 0.01;

  const effectAnchorY = -height / 2 + fillHeight + 0.01;
  const effectPos: [number, number, number] = [0, effectAnchorY, 0];
  const precipColor = contents && contents.length > 0 ? contents[0].color : "#ffffff";

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  // Graduation marks (white lines along the side)
  const graduations: [number, number, number][] = [];
  const numMarks = 10;
  for (let i = 1; i <= numMarks; i++) {
    const y = -height / 2 + (i / numMarks) * (height - 0.02);
    graduations.push([0, y, 0]);
  }

  return (
    <group ref={groupRef} position={position} onClick={handleClick} onContextMenu={onContextMenu}>
      {/* Glass cylinder body */}
      <mesh castShadow>
        <cylinderGeometry
          args={[radius, radius, height, radialSegments, 1, true]}
        />
        <meshPhysicalMaterial
          transparent
          opacity={glassOpacity}
          roughness={0.0}
          metalness={0.0}
          transmission={0.9}
          thickness={0.4}
          side={THREE.DoubleSide}
          color={glassColor}
          emissive={glassEmissive}
          emissiveIntensity={glassEmissiveIntensity}
        />
      </mesh>

      {/* Wide base for stability */}
      <mesh position={[0, -height / 2 - baseHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[baseRadius, baseRadius, baseHeight, radialSegments]} />
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

      {/* Bottom disk */}
      <mesh position={[0, -height / 2, 0]} castShadow>
        <cylinderGeometry args={[radius, radius, 0.006, radialSegments]} />
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

      {/* Graduation marks */}
      {graduations.map((pos, i) => (
        <mesh key={i} position={[0, pos[1], radius + 0.001]}>
          <boxGeometry args={[0.01, 0.001, 0.001]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Liquid fill */}
      {fillLevel > 0 && (
        <mesh position={[0, fillY, 0]}>
          <cylinderGeometry
            args={[fillRadius, fillRadius, fillHeight, radialSegments]}
          />
          <meshStandardMaterial
            color={fillColor}
            transparent
            opacity={0.75}
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

      {/* Active effects */}
      {activeEffects.includes("bubbles") && (
        <BubbleEffect position={effectPos} rate="gentle" />
      )}
      {activeEffects.includes("steam") && (
        <SteamEffect position={[0, height / 2, 0]} />
      )}
      {activeEffects.includes("flame") && (
        <FlameEffect position={[0, -height / 2 - baseHeight - 0.04, 0]} />
      )}
      {activeEffects.includes("precipitate") && (
        <PrecipitateEffect position={effectPos} color={precipColor} />
      )}
      {activeEffects.includes("explosion") && (
        <ExplosionEffect position={[0, 0.1, 0]} />
      )}
      {activeEffects.includes("smoke") && (
        <SmokeEffect position={[0, height / 2, 0]} />
      )}
      {activeEffects.includes("sparks") && (
        <SparkEffect position={[0, 0.1, 0]} />
      )}

      {/* Floating contents label */}
      <ContentsLabel contents={contents ?? []} yOffset={height / 2 + 0.1} />
    </group>
  );
}
