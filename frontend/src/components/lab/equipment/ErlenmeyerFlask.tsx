import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { ContainerSubstance } from "../../../stores/labStore";
import BubbleEffect from "../effects/BubbleEffect";
import SteamEffect from "../effects/SteamEffect";
import FlameEffect from "../effects/FlameEffect";
import PrecipitateEffect from "../effects/PrecipitateEffect";
import { computeFillState, getGlassAppearance } from "./equipmentUtils";

const CAPACITY_ML = 250;
const COLD_GLASS_COLOR = "#c8e6ff";

interface ErlenmeyerFlaskProps {
  position: [number, number, number];
  selected?: boolean;
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

export default function ErlenmeyerFlask({
  position,
  selected = false,
  onClick,
  onContextMenu,
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

  // Hot glow
  const { glassColor, glassEmissive, glassEmissiveIntensity } = getGlassAppearance(temperature, COLD_GLASS_COLOR);

  const effectAnchorY = -bodyHeight / 2 + fillHeight + 0.01;
  const effectPos: [number, number, number] = [0, effectAnchorY, 0];
  const precipColor = contents && contents.length > 0 ? contents[0].color : "#ffffff";

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <group ref={groupRef} position={position} onClick={handleClick} onContextMenu={onContextMenu}>
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
          opacity={0.22}
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

      {/* Floating contents label */}
      {contents && contents.length > 0 && (
        <Html position={[0, 0.22, 0]} center distanceFactor={8}>
          <div style={{ background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap", pointerEvents: "none" }}>
            <span style={{ color: "#e2e8f0", fontSize: "8px" }}>
              {contents.map(s => s.formula).join(" + ")}
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
