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
import GasReleaseEffect from "../effects/GasReleaseEffect";
import { computeFillState, getGlassAppearance } from "./equipmentUtils";
import ContentsLabel from "./ContentsLabel";

const CAPACITY_ML = 250;
const COLD_GLASS_COLOR = "#c8e6ff";

interface RoundBottomFlaskProps {
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

export default function RoundBottomFlask({
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
}: RoundBottomFlaskProps) {
  const groupRef = useRef<THREE.Group>(null);

  const sphereRadius = 0.1;
  const neckHeight = 0.12;
  const neckRadius = 0.02;
  const radialSegments = 24;

  const computed = contents && contents.length > 0 ? computeFillState(contents, CAPACITY_ML) : null;
  const fillLevel = computed ? computed.fillLevel : 0;
  const fillColor = computed ? computed.fillColor : "#4fc3f7";

  const { glassColor: baseGlassColor, glassEmissive, glassEmissiveIntensity } = getGlassAppearance(temperature, COLD_GLASS_COLOR);
  const glassColor = damaged ? "#5c4033" : baseGlassColor;
  const glassOpacity = damaged ? 0.4 : 0.22;

  // Fill: liquid sits in the bottom of the sphere
  const fillHeight = fillLevel * sphereRadius * 1.6;
  const fillY = -sphereRadius + fillHeight / 2 + 0.01;
  const fillRadius = sphereRadius * 0.85 * Math.min(1, fillLevel * 1.2);

  const effectAnchorY = -sphereRadius + fillHeight + 0.01;
  const effectPos: [number, number, number] = [0, effectAnchorY, 0];
  const precipColor = contents && contents.length > 0 ? contents[0].color : "#ffffff";
  const gasContent = contents?.find(s => s.phase === "g");

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <group ref={groupRef} position={position} onClick={handleClick} onDoubleClick={onDoubleClick} onContextMenu={onContextMenu} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
      {/* Spherical body */}
      <mesh castShadow>
        <sphereGeometry args={[sphereRadius, radialSegments, radialSegments]} />
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

      {/* Neck cylinder */}
      <mesh position={[0, sphereRadius + neckHeight / 2, 0]} castShadow>
        <cylinderGeometry
          args={[neckRadius, neckRadius * 1.5, neckHeight, radialSegments, 1, true]}
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

      {/* Liquid fill */}
      {fillLevel > 0 && (
        <mesh position={[0, fillY, 0]}>
          <sphereGeometry
            args={[fillRadius, radialSegments, radialSegments, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.7]}
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
        <>
          <mesh>
            <sphereGeometry args={[sphereRadius + 0.008, radialSegments, radialSegments]} />
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
        <SteamEffect position={[0, sphereRadius + neckHeight, 0]} />
      )}
      {activeEffects.includes("flame") && (
        <FlameEffect position={[0, -sphereRadius - 0.04, 0]} />
      )}
      {activeEffects.includes("precipitate") && (
        <PrecipitateEffect position={effectPos} color={precipColor} />
      )}
      {activeEffects.includes("explosion") && (
        <ExplosionEffect position={[0, 0.1, 0]} />
      )}
      {activeEffects.includes("smoke") && (
        <SmokeEffect position={[0, sphereRadius + neckHeight, 0]} />
      )}
      {activeEffects.includes("sparks") && (
        <SparkEffect position={[0, 0.1, 0]} />
      )}
      {(activeEffects.includes("gas_release") || activeEffects.includes("bubbles")) && gasContent && (
        <GasReleaseEffect position={[0, sphereRadius + neckHeight, 0]} gasFormula={gasContent.formula} />
      )}

      {/* Floating contents label */}
      <ContentsLabel contents={contents ?? []} yOffset={sphereRadius + neckHeight + 0.1} temperature={temperature} />
    </group>
  );
}
