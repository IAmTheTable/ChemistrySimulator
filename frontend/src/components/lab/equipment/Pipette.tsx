import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ContainerSubstance } from "../../../stores/labStore";
import { computeFillState, getGlassAppearance } from "./equipmentUtils";
import PhaseFill from "./PhaseFill";
import ContentsLabel from "./ContentsLabel";

const CAPACITY_ML = 10;
const COLD_GLASS_COLOR = "#c8e6ff";

interface PipetteProps {
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

export default function Pipette({
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
}: PipetteProps) {
  const groupRef = useRef<THREE.Group>(null);

  const thinRadius = 0.008;
  const bulgeRadius = 0.022;
  const totalHeight = 0.38;
  const bulgeHeight = 0.06;
  // Lower shaft: from bottom tip up to bulge
  const lowerShaftHeight = totalHeight * 0.38;
  // Upper shaft: from bulge up to top
  const upperShaftHeight = totalHeight * 0.52;
  const radialSegments = 12;

  // Bulge sits in the upper third of the pipette
  const bulgeY = lowerShaftHeight / 2 + bulgeHeight / 2;
  const upperShaftY = bulgeY + bulgeHeight / 2 + upperShaftHeight / 2;

  const computed = contents && contents.length > 0 ? computeFillState(contents, CAPACITY_ML) : null;
  const fillLevel = computed ? computed.fillLevel : 0;
  const fillColor = computed ? computed.fillColor : "#4fc3f7";

  const { glassColor: baseGlassColor, glassEmissive, glassEmissiveIntensity } = getGlassAppearance(temperature, COLD_GLASS_COLOR);
  const glassColor = damaged ? "#5c4033" : baseGlassColor;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  // Fill runs up from bottom inside lower shaft + into bulge
  const fillHeight = Math.min(fillLevel * (lowerShaftHeight + bulgeHeight), lowerShaftHeight);
  const fillY = -totalHeight / 2 + fillHeight / 2 + 0.005;

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
      {/* Lower thin shaft */}
      <mesh castShadow position={[0, -totalHeight / 2 + lowerShaftHeight / 2, 0]}>
        <cylinderGeometry args={[thinRadius, thinRadius * 0.5, lowerShaftHeight, radialSegments, 1, true]} />
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

      {/* Bulge in the middle */}
      <mesh castShadow position={[0, -totalHeight / 2 + bulgeY, 0]}>
        <sphereGeometry args={[bulgeRadius, radialSegments, 8]} />
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

      {/* Upper thin shaft */}
      <mesh castShadow position={[0, -totalHeight / 2 + upperShaftY, 0]}>
        <cylinderGeometry args={[thinRadius, thinRadius, upperShaftHeight, radialSegments, 1, true]} />
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

      {/* Phase-aware fill in lower shaft */}
      {contents && contents.length > 0 ? (
        <group position={[0, -totalHeight / 2, 0]}>
          <PhaseFill
            contents={contents}
            capacityMl={CAPACITY_ML}
            height={lowerShaftHeight}
            radiusBottom={thinRadius * 0.5}
            radiusTop={thinRadius - 0.001}
            radialSegments={radialSegments}
          />
        </group>
      ) : fillLevel > 0 && fillHeight > 0 && (
        <mesh position={[0, fillY, 0]}>
          <cylinderGeometry args={[thinRadius - 0.001, thinRadius * 0.5, fillHeight, radialSegments]} />
          <meshStandardMaterial color={fillColor} transparent opacity={0.8} roughness={0.1} />
        </mesh>
      )}

      {/* Selection highlight */}
      {selected && (
        <>
          <mesh position={[0, -totalHeight / 2 + lowerShaftHeight / 2, 0]}>
            <cylinderGeometry args={[thinRadius + 0.005, thinRadius * 0.5 + 0.005, lowerShaftHeight + 0.01, radialSegments, 1, true]} />
            <meshBasicMaterial color="#facc15" wireframe transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, -totalHeight / 2 + bulgeY, 0]}>
            <sphereGeometry args={[bulgeRadius + 0.006, radialSegments, 8]} />
            <meshBasicMaterial color="#facc15" wireframe transparent opacity={0.6} />
          </mesh>
          <pointLight color="#facc15" intensity={0.3} distance={0.5} />
        </>
      )}

      <ContentsLabel
        contents={contents ?? []}
        yOffset={totalHeight / 2 + 0.06}
        temperature={temperature}
      />
    </group>
  );
}
