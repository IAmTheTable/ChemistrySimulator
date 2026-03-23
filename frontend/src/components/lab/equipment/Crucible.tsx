import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ContainerSubstance } from "../../../stores/labStore";
import { computeFillState, getGlassAppearance } from "./equipmentUtils";
import PhaseFill from "./PhaseFill";
import ContentsLabel from "./ContentsLabel";
import SteamEffect from "../effects/SteamEffect";
import GasReleaseEffect from "../effects/GasReleaseEffect";

const CAPACITY_ML = 25;
// Porcelain/ceramic — not glass colored, but use temperature for glow
const COLD_COLOR = "#f5f0eb";

interface CrucibleProps {
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
  contents?: ContainerSubstance[];
  activeEffects?: string[];
  temperature?: number;
}

export default function Crucible({
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
  contents,
  activeEffects = [],
  temperature = 25,
}: CrucibleProps) {
  const groupRef = useRef<THREE.Group>(null);

  const topRadius = 0.055;
  const bottomRadius = 0.032;
  const height = 0.065;
  const radialSegments = 18;
  const wallThickness = 0.006;

  const computed = contents && contents.length > 0 ? computeFillState(contents, CAPACITY_ML) : null;
  const fillLevel = computed ? computed.fillLevel : 0;
  const fillColor = computed ? computed.fillColor : "#d4c4a8";

  const { glassEmissive, glassEmissiveIntensity } = getGlassAppearance(temperature, COLD_COLOR);
  const bodyColor = damaged ? "#5c4033" : COLD_COLOR;

  const fillHeight = Math.max(0, fillLevel) * (height - 0.01);
  const fillBottomRadius = bottomRadius - wallThickness;
  const fillTopRadius = fillBottomRadius + (topRadius - bottomRadius - wallThickness) * fillLevel;
  const fillY = -height / 2 + fillHeight / 2 + 0.005;

  const gasContent = contents?.find(s => s.phase === "g");

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {/* Ceramic body — tapered cylinder, open top */}
      <mesh castShadow>
        <cylinderGeometry args={[topRadius, bottomRadius, height, radialSegments, 1, true]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.7}
          metalness={0.0}
          emissive={glassEmissive}
          emissiveIntensity={glassEmissiveIntensity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Bottom disk */}
      <mesh castShadow position={[0, -height / 2, 0]}>
        <cylinderGeometry args={[bottomRadius, bottomRadius, 0.006, radialSegments]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.7}
          metalness={0.0}
          emissive={glassEmissive}
          emissiveIntensity={glassEmissiveIntensity}
        />
      </mesh>

      {/* Phase-aware fill */}
      {contents && contents.length > 0 ? (
        <PhaseFill
          contents={contents}
          capacityMl={CAPACITY_ML}
          height={height}
          radiusBottom={fillBottomRadius}
          radiusTop={fillBottomRadius + (topRadius - bottomRadius - wallThickness)}
          radialSegments={radialSegments}
        />
      ) : fillLevel > 0 && (
        <mesh position={[0, fillY, 0]}>
          <cylinderGeometry args={[fillTopRadius, fillBottomRadius, fillHeight, radialSegments]} />
          <meshStandardMaterial color={fillColor} transparent opacity={0.85} roughness={0.3} />
        </mesh>
      )}

      {/* Selection highlight */}
      {selected && (
        <>
          <mesh>
            <cylinderGeometry args={[topRadius + 0.007, bottomRadius + 0.007, height + 0.01, radialSegments, 1, true]} />
            <meshBasicMaterial color="#facc15" wireframe transparent opacity={0.6} />
          </mesh>
          <pointLight color="#facc15" intensity={0.3} distance={0.5} />
        </>
      )}

      {activeEffects.includes("steam") && (
        <SteamEffect position={[0, height / 2, 0]} />
      )}
      {(activeEffects.includes("gas_release") || activeEffects.includes("bubbles")) && gasContent && (
        <GasReleaseEffect position={[0, height / 2, 0]} gasFormula={gasContent.formula} />
      )}

      <ContentsLabel contents={contents ?? []} yOffset={height / 2 + 0.1} temperature={temperature} />
    </group>
  );
}
