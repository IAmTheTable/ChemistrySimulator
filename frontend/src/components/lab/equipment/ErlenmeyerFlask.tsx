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

const CAPACITY_ML = 250;
const COLD_GLASS_COLOR = "#c8e6ff";

interface ErlenmeyerFlaskProps {
  position: [number, number, number];
  selected?: boolean;
  damaged?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  // Legacy direct props
  fillLevel?: number;
  fillColor?: string;
  // Dynamic props from store
  contents?: ContainerSubstance[];
  activeEffects?: string[];
  temperature?: number;
}

export default function ErlenmeyerFlask({
  position,
  selected = false,
  damaged = false,
  onClick,
  onDoubleClick,
  onContextMenu,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerOver,
  onPointerOut,
  fillLevel: fillLevelProp,
  fillColor: fillColorProp,
  contents,
  activeEffects = [],
  temperature = 25,
}: ErlenmeyerFlaskProps) {
  const groupRef = useRef<THREE.Group>(null);

  const bodyHeight = 0.18;
  const neckHeight = 0.08;
  const baseRadius = 0.1;
  const shoulderRadius = 0.025;
  const neckRadius = 0.02;
  const radialSegments = 24;

  // Derive fill from contents if provided
  const computed = contents && contents.length > 0 ? computeFillState(contents, CAPACITY_ML) : null;
  const fillLevel = computed ? computed.fillLevel : (fillLevelProp ?? 0);
  const fillColor = computed ? computed.fillColor : (fillColorProp ?? "#ffb74d");

  // Total height for fill calculations
  const totalFillableHeight = bodyHeight - 0.01;
  const fillHeight = Math.max(0, fillLevel) * totalFillableHeight;
  const fillTopRadius =
    baseRadius - (baseRadius - shoulderRadius) * Math.min(1, fillLevel);
  const fillBottomRadius = baseRadius - 0.005;
  const fillY = -bodyHeight / 2 + fillHeight / 2 + 0.005;

  // Hot glow; darken if damaged
  const { glassColor: baseGlassColor, glassEmissive, glassEmissiveIntensity } = getGlassAppearance(temperature, COLD_GLASS_COLOR);
  const glassColor = damaged ? "#5c4033" : baseGlassColor;
  const glassOpacity = damaged ? 0.4 : 0.22;

  const effectAnchorY = -bodyHeight / 2 + fillHeight + 0.01;
  const effectPos: [number, number, number] = [0, effectAnchorY, 0];
  const precipColor = contents && contents.length > 0 ? contents[0].color : "#ffffff";

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <group ref={groupRef} position={position} onClick={handleClick} onDoubleClick={onDoubleClick} onContextMenu={onContextMenu} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      {/* Conical body — wide at bottom, narrow at top */}
      <mesh castShadow>
        <cylinderGeometry
          args={[shoulderRadius, baseRadius, bodyHeight, radialSegments, 1, true]}
        />
        <meshPhysicalMaterial
          transparent
          opacity={glassOpacity}
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
      <mesh position={[0, -bodyHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[baseRadius, baseRadius, 0.008, radialSegments]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.28}
          roughness={0.0}
          metalness={0.0}
          transmission={0.88}
          thickness={0.3}
          color={glassColor}
        />
      </mesh>

      {/* Neck cylinder */}
      <mesh position={[0, bodyHeight / 2 + neckHeight / 2, 0]} castShadow>
        <cylinderGeometry
          args={[neckRadius, shoulderRadius, neckHeight, radialSegments, 1, true]}
        />
        <meshPhysicalMaterial
          transparent
          opacity={glassOpacity}
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
        <>
          <mesh>
            <cylinderGeometry
              args={[
                shoulderRadius + 0.008,
                baseRadius + 0.008,
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
              opacity={0.6}
            />
          </mesh>
          <pointLight color="#facc15" intensity={0.3} distance={0.5} />
        </>
      )}

      {/* Active effects */}
      {activeEffects.includes("bubbles") && (
        <BubbleEffect position={effectPos} rate="moderate" />
      )}
      {activeEffects.includes("steam") && (
        <SteamEffect position={[0, bodyHeight / 2 + neckHeight, 0]} />
      )}
      {activeEffects.includes("flame") && (
        <FlameEffect position={[0, -bodyHeight / 2 - 0.04, 0]} />
      )}
      {activeEffects.includes("precipitate") && (
        <PrecipitateEffect position={effectPos} color={precipColor} />
      )}
      {activeEffects.includes("explosion") && (
        <ExplosionEffect position={[0, 0.1, 0]} />
      )}
      {activeEffects.includes("smoke") && (
        <SmokeEffect position={[0, bodyHeight / 2 + neckHeight, 0]} />
      )}
      {activeEffects.includes("sparks") && (
        <SparkEffect position={[0, 0.1, 0]} />
      )}

      {/* Floating contents label */}
      <ContentsLabel contents={contents ?? []} yOffset={bodyHeight / 2 + neckHeight + 0.1} temperature={temperature} />
    </group>
  );
}
