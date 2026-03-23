import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ContainerSubstance } from "../../../stores/labStore";
import { computeFillState, getGlassAppearance } from "./equipmentUtils";
import ContentsLabel from "./ContentsLabel";

const CAPACITY_ML = 50;
const COLD_GLASS_COLOR = "#c8e6ff";

interface FunnelProps {
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

export default function Funnel({
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
  activeEffects: _activeEffects = [],
  temperature = 25,
}: FunnelProps) {
  const groupRef = useRef<THREE.Group>(null);

  const coneTopRadius = 0.1;
  const coneBottomRadius = 0.01;
  const coneHeight = 0.18;
  const stemRadius = 0.008;
  const stemHeight = 0.1;
  const radialSegments = 20;

  const computed = contents && contents.length > 0 ? computeFillState(contents, CAPACITY_ML) : null;
  const fillLevel = computed ? computed.fillLevel : 0;
  const fillColor = computed ? computed.fillColor : "#4fc3f7";

  const { glassColor: baseGlassColor, glassEmissive, glassEmissiveIntensity } = getGlassAppearance(temperature, COLD_GLASS_COLOR);
  const glassColor = damaged ? "#5c4033" : baseGlassColor;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  // Liquid fill in the cone portion
  const fillConeHeight = fillLevel * coneHeight * 0.8;
  const fillTopRadius = coneBottomRadius + (coneTopRadius - coneBottomRadius) * fillLevel * 0.8;

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
      {/* Inverted cone (wide top, narrow bottom) */}
      <mesh castShadow position={[0, stemHeight / 2, 0]}>
        <coneGeometry args={[coneTopRadius, coneHeight, radialSegments, 1, true]} />
        <meshStandardMaterial
          transparent
          opacity={damaged ? 0.35 : 0.15}
          roughness={0.1}
          metalness={0.1}
          color={glassColor}
          emissive={glassEmissive}
          emissiveIntensity={glassEmissiveIntensity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Stem tube below cone */}
      <mesh castShadow position={[0, -(coneHeight / 2), 0]}>
        <cylinderGeometry args={[stemRadius, stemRadius, stemHeight, radialSegments, 1, true]} />
        <meshStandardMaterial
          transparent
          opacity={damaged ? 0.35 : 0.15}
          roughness={0.1}
          metalness={0.1}
          color={glassColor}
          emissive={glassEmissive}
          emissiveIntensity={glassEmissiveIntensity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Liquid in cone */}
      {fillLevel > 0 && (
        <mesh position={[0, stemHeight / 2 + coneHeight / 2 - fillConeHeight / 2, 0]}>
          <coneGeometry args={[fillTopRadius, fillConeHeight, radialSegments]} />
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
        <>
          <mesh position={[0, stemHeight / 2, 0]}>
            <coneGeometry args={[coneTopRadius + 0.008, coneHeight + 0.01, radialSegments, 1, true]} />
            <meshBasicMaterial color="#facc15" wireframe transparent opacity={0.6} />
          </mesh>
          <pointLight color="#facc15" intensity={0.3} distance={0.5} />
        </>
      )}

      <ContentsLabel
        contents={contents ?? []}
        yOffset={stemHeight / 2 + coneHeight / 2 + 0.08}
        temperature={temperature}
      />
    </group>
  );
}
