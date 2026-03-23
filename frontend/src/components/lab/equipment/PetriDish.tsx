import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ContainerSubstance } from "../../../stores/labStore";
import { computeFillState, getGlassAppearance } from "./equipmentUtils";
import ContentsLabel from "./ContentsLabel";
import GasReleaseEffect from "../effects/GasReleaseEffect";

const CAPACITY_ML = 30;
const COLD_GLASS_COLOR = "#d4eaff";

interface PetriDishProps {
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

export default function PetriDish({
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
}: PetriDishProps) {
  const groupRef = useRef<THREE.Group>(null);

  const radius = 0.09;
  const wallHeight = 0.015;
  const wallThickness = 0.005;
  const radialSegments = 28;

  const gasContent = contents?.find(s => s.phase === "g");
  const computed = contents && contents.length > 0 ? computeFillState(contents, CAPACITY_ML) : null;
  const fillLevel = computed ? computed.fillLevel : 0;
  const fillColor = computed ? computed.fillColor : "#4fc3f7";

  const { glassColor: baseGlassColor, glassEmissive, glassEmissiveIntensity } = getGlassAppearance(temperature, COLD_GLASS_COLOR);
  const glassColor = damaged ? "#5c4033" : baseGlassColor;
  const glassOpacity = damaged ? 0.4 : 0.2;

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
      {/* Bottom disk */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[radius, radius, 0.005, radialSegments]} />
        <meshPhysicalMaterial
          transparent
          opacity={glassOpacity + 0.05}
          roughness={0.0}
          metalness={0.0}
          transmission={0.88}
          thickness={0.2}
          side={THREE.DoubleSide}
          color={glassColor}
          emissive={glassEmissive}
          emissiveIntensity={glassEmissiveIntensity}
        />
      </mesh>

      {/* Cylindrical wall */}
      <mesh castShadow position={[0, wallHeight / 2, 0]}>
        <cylinderGeometry args={[radius, radius, wallHeight, radialSegments, 1, true]} />
        <meshPhysicalMaterial
          transparent
          opacity={glassOpacity}
          roughness={0.0}
          metalness={0.0}
          transmission={0.9}
          thickness={0.15}
          side={THREE.DoubleSide}
          color={glassColor}
          emissive={glassEmissive}
          emissiveIntensity={glassEmissiveIntensity}
        />
      </mesh>

      {/* Contents fill — flat disk inside */}
      {fillLevel > 0 && (
        <mesh position={[0, 0.006, 0]}>
          <cylinderGeometry
            args={[radius - wallThickness - 0.002, radius - wallThickness - 0.002, 0.003 + fillLevel * (wallHeight - 0.008), radialSegments]}
          />
          <meshStandardMaterial
            color={fillColor}
            transparent
            opacity={0.8}
            roughness={0.2}
          />
        </mesh>
      )}

      {/* Selection highlight */}
      {selected && (
        <>
          <mesh position={[0, wallHeight / 2, 0]}>
            <cylinderGeometry args={[radius + 0.006, radius + 0.006, wallHeight + 0.01, radialSegments, 1, true]} />
            <meshBasicMaterial color="#facc15" wireframe transparent opacity={0.6} />
          </mesh>
          <pointLight color="#facc15" intensity={0.3} distance={0.5} />
        </>
      )}

      {(activeEffects.includes("gas_release") || activeEffects.includes("bubbles")) && gasContent && (
        <GasReleaseEffect position={[0, wallHeight + 0.02, 0]} gasFormula={gasContent.formula} />
      )}

      <ContentsLabel contents={contents ?? []} yOffset={wallHeight + 0.1} temperature={temperature} />
    </group>
  );
}
