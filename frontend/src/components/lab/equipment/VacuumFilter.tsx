import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ContainerSubstance } from "../../../stores/labStore";
import { computePhaseRendering, getGlassAppearance } from "./equipmentUtils";
import ContentsLabel from "./ContentsLabel";

const CAPACITY_ML = 500;
const COLD_GLASS_COLOR = "#c8e8ff";

interface VacuumFilterProps {
  position: [number, number, number];
  selected?: boolean;
  damaged?: boolean;
  connected?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
  onContextMenu?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOver?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (e: ThreeEvent<PointerEvent>) => void;
  contents?: ContainerSubstance[];
  activeEffects?: string[]; // reserved for future effects
  temperature?: number;
}

export default function VacuumFilter({
  position,
  selected = false,
  damaged = false,
  connected = false,
  onClick,
  onDoubleClick,
  onContextMenu,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerOver,
  onPointerOut,
  contents = [],
  temperature = 25,
}: VacuumFilterProps) {
  const groupRef = useRef<THREE.Group>(null);

  const { glassColor: baseGlassColor, glassEmissive, glassEmissiveIntensity } = getGlassAppearance(temperature, COLD_GLASS_COLOR);
  const glassColor = damaged ? "#5c4033" : baseGlassColor;

  const phaseData = contents.length > 0 ? computePhaseRendering(contents, CAPACITY_ML) : null;

  // Layout dimensions
  // Flask body: Erlenmeyer-ish wide base with side arm
  const flaskBaseRadius = 0.095;
  const flaskShoulderRadius = 0.028;
  const flaskBodyHeight = 0.19;
  const flaskNeckHeight = 0.065;

  // Rubber adapter ring
  const adapterY = flaskBodyHeight / 2 + flaskNeckHeight + 0.015;

  // Buchner funnel: sits on top of adapter
  const funnelBaseY = adapterY + 0.03;
  const funnelRadius = 0.075;
  const funnelHeight = 0.045;

  // Side arm nozzle — pointing right (+x direction), at mid-height of flask
  const sideArmY = -flaskBodyHeight / 2 + 0.06;
  const sideArmX = flaskBaseRadius + 0.02;

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
      {/* ===== Filter Flask (bottom) ===== */}

      {/* Conical flask body */}
      <mesh castShadow>
        <cylinderGeometry args={[flaskShoulderRadius, flaskBaseRadius, flaskBodyHeight, 24, 1, true]} />
        <meshStandardMaterial
          transparent
          opacity={damaged ? 0.4 : 0.18}
          roughness={0.1}
          metalness={0.1}
          color={glassColor}
          emissive={glassEmissive}
          emissiveIntensity={glassEmissiveIntensity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Flask bottom disk */}
      <mesh position={[0, -flaskBodyHeight / 2, 0]}>
        <cylinderGeometry args={[flaskBaseRadius, flaskBaseRadius, 0.007, 24]} />
        <meshStandardMaterial
          transparent opacity={0.22} roughness={0.1} metalness={0.1}
          color={glassColor} depthWrite={false}
        />
      </mesh>

      {/* Flask neck */}
      <mesh position={[0, flaskBodyHeight / 2 + flaskNeckHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[flaskShoulderRadius - 0.004, flaskShoulderRadius, flaskNeckHeight, 18, 1, true]} />
        <meshStandardMaterial
          transparent opacity={damaged ? 0.4 : 0.18}
          roughness={0.1} metalness={0.1}
          color={glassColor}
          emissive={glassEmissive}
          emissiveIntensity={glassEmissiveIntensity}
          side={THREE.DoubleSide} depthWrite={false}
        />
      </mesh>

      {/* Side arm nozzle — horizontal, pointing right */}
      <mesh position={[sideArmX, sideArmY, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.009, 0.009, 0.055, 10]} />
        <meshStandardMaterial
          transparent opacity={0.22} roughness={0.1} metalness={0.1}
          color={glassColor} depthWrite={false}
        />
      </mesh>
      {/* Nozzle tip cap */}
      <mesh position={[sideArmX + 0.03, sideArmY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.013, 0.009, 0.012, 10]} />
        <meshStandardMaterial color="#555560" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Liquid fill inside flask */}
      {phaseData && phaseData.hasLiquid && (
        <mesh position={[0, -flaskBodyHeight / 2 + phaseData.liquidLevel * flaskBodyHeight * 0.5, 0]}>
          <cylinderGeometry
            args={[
              flaskShoulderRadius - 0.012,
              flaskBaseRadius - 0.008,
              phaseData.liquidLevel * flaskBodyHeight,
              24,
            ]}
          />
          <meshStandardMaterial color={phaseData.liquidColor} transparent opacity={0.7} roughness={0.1} depthWrite={false} />
        </mesh>
      )}

      {/* ===== Rubber Adapter Ring (middle) ===== */}
      <mesh position={[0, adapterY, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.03, 18]} />
        <meshStandardMaterial color="#222222" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* ===== Buchner Funnel (top) ===== */}

      {/* Funnel body — wide shallow cylinder */}
      <mesh position={[0, funnelBaseY + funnelHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[funnelRadius, 0.028, funnelHeight, 24, 1, true]} />
        <meshStandardMaterial
          transparent opacity={0.18} roughness={0.1} metalness={0.1}
          color={glassColor}
          emissive={glassEmissive}
          emissiveIntensity={glassEmissiveIntensity}
          side={THREE.DoubleSide} depthWrite={false}
        />
      </mesh>

      {/* Funnel top rim */}
      <mesh position={[0, funnelBaseY + funnelHeight, 0]}>
        <cylinderGeometry args={[funnelRadius + 0.004, funnelRadius, 0.007, 24]} />
        <meshStandardMaterial transparent opacity={0.22} roughness={0.1} metalness={0.1} color={glassColor} depthWrite={false} />
      </mesh>

      {/* Funnel bottom plate (perforated filter area — solid disk) */}
      <mesh position={[0, funnelBaseY + 0.006, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.006, 18]} />
        <meshStandardMaterial transparent opacity={0.22} roughness={0.1} metalness={0.1} color={glassColor} depthWrite={false} />
      </mesh>

      {/* Filter paper circle (white disk inside funnel base) */}
      <mesh position={[0, funnelBaseY + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.024, 20]} />
        <meshStandardMaterial color="#f5f5f0" roughness={0.9} metalness={0.0} />
      </mesh>

      {/* Perforation dots on filter plate (4 small holes represented as dark disks) */}
      {([[-0.01, 0], [0.01, 0], [0, -0.01], [0, 0.01]] as [number, number][]).map(([dx, dz], i) => (
        <mesh key={i} position={[dx, funnelBaseY + 0.013, dz]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.003, 8]} />
          <meshStandardMaterial color="#aaaaaa" roughness={0.8} />
        </mesh>
      ))}

      {/* Solid retained on filter paper (when contents have solid phase) */}
      {phaseData && phaseData.hasSolid && (
        <mesh position={[0, funnelBaseY + 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[Math.min(0.023, 0.01 + phaseData.solidLevel * 0.013), 18]} />
          <meshStandardMaterial color={phaseData.solidColor} roughness={0.8} metalness={0.0} transparent opacity={0.85} />
        </mesh>
      )}

      {/* ===== Vacuum tube connection (shown when connected) ===== */}
      {connected && (
        <>
          {/* Rubber tubing from side arm toward right wall */}
          <mesh position={[sideArmX + 0.08, sideArmY, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
            <meshStandardMaterial color="#333333" roughness={0.8} metalness={0.05} />
          </mesh>
          {/* Small indicator light on nozzle (green = connected) */}
          <mesh position={[sideArmX + 0.04, sideArmY + 0.015, 0]}>
            <sphereGeometry args={[0.005, 6, 6]} />
            <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={1.8} />
          </mesh>
        </>
      )}

      {/* ===== Selection highlight ===== */}
      {selected && (
        <>
          <mesh>
            <cylinderGeometry args={[flaskBaseRadius + 0.01, flaskBaseRadius + 0.01, flaskBodyHeight + 0.01, 24, 1, true]} />
            <meshBasicMaterial color="#facc15" wireframe transparent opacity={0.5} />
          </mesh>
          <pointLight color="#facc15" intensity={0.3} distance={0.6} />
        </>
      )}

      {/* Floating contents label */}
      <ContentsLabel
        contents={contents}
        yOffset={funnelBaseY + funnelHeight + 0.12}
        temperature={temperature}
      />
    </group>
  );
}
