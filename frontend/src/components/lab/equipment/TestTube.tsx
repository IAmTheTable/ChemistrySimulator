import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ContainerSubstance } from "../../../stores/labStore";
import BubbleEffect from "../effects/BubbleEffect";
import SteamEffect from "../effects/SteamEffect";
import FlameEffect from "../effects/FlameEffect";
import PrecipitateEffect from "../effects/PrecipitateEffect";
import { computeFillState, getGlassAppearance } from "./equipmentUtils";
import ContentsLabel from "./ContentsLabel";

const CAPACITY_ML = 15;
const COLD_GLASS_COLOR = "#ddeeff";

interface TestTubeProps {
  position: [number, number, number];
  selected?: boolean;
  damaged?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (e: ThreeEvent<MouseEvent>) => void;
  // Legacy direct props
  fillLevel?: number;
  fillColor?: string;
  // Dynamic props from store
  contents?: ContainerSubstance[];
  activeEffects?: string[];
  temperature?: number;
}

export default function TestTube({
  position,
  selected = false,
  damaged = false,
  onClick,
  onContextMenu,
  fillLevel: fillLevelProp,
  fillColor: fillColorProp,
  contents,
  activeEffects = [],
  temperature = 25,
}: TestTubeProps) {
  const groupRef = useRef<THREE.Group>(null);

  const height = 0.25;
  const radius = 0.025;
  const radialSegments = 16;
  const wallThickness = 0.003;

  // Derive fill from contents if provided
  const computed = contents && contents.length > 0 ? computeFillState(contents, CAPACITY_ML) : null;
  const fillLevel = computed ? computed.fillLevel : (fillLevelProp ?? 0);
  const fillColor = computed ? computed.fillColor : (fillColorProp ?? "#a5d6a7");

  // Liquid fill
  const fillHeight = Math.max(0, fillLevel) * (height - 0.02);
  const fillRadius = radius - wallThickness;
  const fillY = -height / 2 + fillHeight / 2 + 0.01;

  // Hot glow; darken if damaged
  const { glassColor: baseGlassColor, glassEmissive, glassEmissiveIntensity } = getGlassAppearance(temperature, COLD_GLASS_COLOR);
  const glassColor = damaged ? "#5c4033" : baseGlassColor;
  const glassOpacity = damaged ? 0.4 : 0.2;

  const effectAnchorY = -height / 2 + fillHeight + 0.01;
  const effectPos: [number, number, number] = [0, effectAnchorY, 0];
  const precipColor = contents && contents.length > 0 ? contents[0].color : "#ffffff";

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <group ref={groupRef} position={position} onClick={handleClick} onContextMenu={onContextMenu}>
      {/* Glass tube body — open-top cylinder */}
      <mesh castShadow>
        <cylinderGeometry
          args={[radius, radius, height, radialSegments, 1, true]}
        />
        <meshPhysicalMaterial
          transparent
          opacity={glassOpacity}
          roughness={0.0}
          metalness={0.0}
          transmission={0.92}
          thickness={0.3}
          side={THREE.DoubleSide}
          color={glassColor}
          emissive={glassEmissive}
          emissiveIntensity={glassEmissiveIntensity}
        />
      </mesh>

      {/* Rounded bottom — small hemisphere */}
      <mesh position={[0, -height / 2, 0]} castShadow>
        <sphereGeometry args={[radius, radialSegments, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.22}
          roughness={0.0}
          metalness={0.0}
          transmission={0.92}
          thickness={0.3}
          color={glassColor}
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

      {/* Active effects */}
      {activeEffects.includes("bubbles") && (
        <BubbleEffect position={effectPos} rate="gentle" />
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

      {/* Floating contents label */}
      <ContentsLabel contents={contents ?? []} yOffset={height / 2 + 0.1} />
    </group>
  );
}
