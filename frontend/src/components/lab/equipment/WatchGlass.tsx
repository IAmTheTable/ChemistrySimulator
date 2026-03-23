import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ContainerSubstance } from "../../../stores/labStore";
import { computeFillState, getGlassAppearance } from "./equipmentUtils";
import ContentsLabel from "./ContentsLabel";

const CAPACITY_ML = 20;
const COLD_GLASS_COLOR = "#d4eaff";

interface WatchGlassProps {
  position: [number, number, number];
  selected?: boolean;
  damaged?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (e: ThreeEvent<MouseEvent>) => void;
  contents?: ContainerSubstance[];
  activeEffects?: string[];
  temperature?: number;
}

export default function WatchGlass({
  position,
  selected = false,
  damaged = false,
  onClick,
  onContextMenu,
  contents,
  activeEffects: _activeEffects = [],
  temperature = 25,
}: WatchGlassProps) {
  const groupRef = useRef<THREE.Group>(null);

  const radius = 0.1;
  const radialSegments = 32;

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
    <group ref={groupRef} position={position} onClick={handleClick} onContextMenu={onContextMenu}>
      {/* Shallow curved dish — upper hemisphere, very flat */}
      <mesh castShadow rotation={[Math.PI, 0, 0]}>
        <sphereGeometry
          args={[radius, radialSegments, 8, 0, Math.PI * 2, 0, Math.PI * 0.15]}
        />
        <meshPhysicalMaterial
          transparent
          opacity={glassOpacity}
          roughness={0.0}
          metalness={0.0}
          transmission={0.92}
          thickness={0.2}
          side={THREE.DoubleSide}
          color={glassColor}
          emissive={glassEmissive}
          emissiveIntensity={glassEmissiveIntensity}
        />
      </mesh>

      {/* Substance on the watch glass — thin disk */}
      {fillLevel > 0 && (
        <mesh position={[0, 0.003, 0]}>
          <cylinderGeometry
            args={[radius * 0.7 * fillLevel, radius * 0.8 * fillLevel, 0.005, radialSegments]}
          />
          <meshStandardMaterial
            color={fillColor}
            transparent
            opacity={0.8}
            roughness={0.3}
          />
        </mesh>
      )}

      {/* Selection highlight */}
      {selected && (
        <mesh rotation={[Math.PI, 0, 0]}>
          <sphereGeometry
            args={[radius + 0.005, radialSegments, 8, 0, Math.PI * 2, 0, Math.PI * 0.15]}
          />
          <meshBasicMaterial
            color="#facc15"
            wireframe
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Floating contents label */}
      <ContentsLabel contents={contents ?? []} yOffset={0.12} temperature={temperature} />
    </group>
  );
}
