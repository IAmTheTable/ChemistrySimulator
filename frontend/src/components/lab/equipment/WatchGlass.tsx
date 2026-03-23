import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ContainerSubstance } from "../../../stores/labStore";
import { computeFillState, getGlassAppearance } from "./equipmentUtils";
import ContentsLabel from "./ContentsLabel";
import GasReleaseEffect from "../effects/GasReleaseEffect";

const CAPACITY_ML = 20;
const COLD_GLASS_COLOR = "#d4eaff";

interface WatchGlassProps {
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

export default function WatchGlass({
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
}: WatchGlassProps) {
  const groupRef = useRef<THREE.Group>(null);

  const radius = 0.1;
  const radialSegments = 32;

  const gasContent = contents?.find(s => s.phase === "g");
  const computed = contents && contents.length > 0 ? computeFillState(contents, CAPACITY_ML) : null;
  const fillLevel = computed ? computed.fillLevel : 0;
  const fillColor = computed ? computed.fillColor : "#4fc3f7";

  const { glassColor: baseGlassColor, glassEmissive, glassEmissiveIntensity } = getGlassAppearance(temperature, COLD_GLASS_COLOR);
  const glassColor = damaged ? "#5c4033" : baseGlassColor;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <group ref={groupRef} position={position} onClick={handleClick} onDoubleClick={onDoubleClick} onContextMenu={onContextMenu} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      {/* Shallow curved dish — upper hemisphere, very flat */}
      <mesh castShadow rotation={[Math.PI, 0, 0]}>
        <sphereGeometry
          args={[radius, radialSegments, 8, 0, Math.PI * 2, 0, Math.PI * 0.15]}
        />
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
        <>
          <mesh rotation={[Math.PI, 0, 0]}>
            <sphereGeometry
              args={[radius + 0.008, radialSegments, 8, 0, Math.PI * 2, 0, Math.PI * 0.15]}
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

      {(activeEffects.includes("gas_release") || activeEffects.includes("bubbles")) && gasContent && (
        <GasReleaseEffect position={[0, 0.03, 0]} gasFormula={gasContent.formula} />
      )}

      {/* Floating contents label */}
      <ContentsLabel contents={contents ?? []} yOffset={0.12} temperature={temperature} />
    </group>
  );
}
