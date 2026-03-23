import { useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { ContainerSubstance } from "../../../stores/labStore";
import ContentsLabel from "./ContentsLabel";

interface ClampStandProps {
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

export default function ClampStand({
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
}: ClampStandProps) {
  const groupRef = useRef<THREE.Group>(null);

  const rodHeight = 0.6;
  const rodRadius = 0.008;
  const baseWidth = 0.18;
  const baseDepth = 0.1;
  const baseHeight = 0.012;
  const armLength = 0.12;
  const armRadius = 0.006;
  // Clamp ring at mid-height of the rod
  const clampY = rodHeight * 0.3;
  const ringRadius = 0.025;
  const ringTube = 0.004;

  const metalColor = damaged ? "#5c4033" : "#78716c";

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
      {/* Heavy base */}
      <mesh castShadow position={[0, -rodHeight / 2 - baseHeight / 2, 0]}>
        <boxGeometry args={[baseWidth, baseHeight, baseDepth]} />
        <meshStandardMaterial color={metalColor} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Vertical rod */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[rodRadius, rodRadius, rodHeight, 10]} />
        <meshStandardMaterial color={metalColor} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Horizontal arm */}
      <mesh castShadow position={[armLength / 2, -rodHeight / 2 + clampY, 0]}>
        <cylinderGeometry args={[armRadius, armRadius, armLength, 8]} />
        <meshStandardMaterial color={metalColor} metalness={0.8} roughness={0.2} />
        <group rotation={[0, 0, Math.PI / 2]} />
      </mesh>

      {/* Arm rotated properly */}
      <group position={[0, -rodHeight / 2 + clampY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[armRadius, armRadius, armLength, 8]} />
          <meshStandardMaterial color={metalColor} metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Ring clamp at end of arm */}
      <group position={[armLength, -rodHeight / 2 + clampY, 0]}>
        <mesh castShadow>
          <torusGeometry args={[ringRadius, ringTube, 8, 20]} />
          <meshStandardMaterial color={metalColor} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Small screw knob on ring */}
        <mesh castShadow position={[0, ringRadius + ringTube + 0.005, 0]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshStandardMaterial color="#44403c" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>

      {/* Tightening screw on arm-rod junction */}
      <mesh castShadow position={[rodRadius + 0.006, -rodHeight / 2 + clampY, 0]}>
        <sphereGeometry args={[0.007, 6, 6]} />
        <meshStandardMaterial color="#44403c" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Selection highlight on rod */}
      {selected && (
        <>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[rodRadius + 0.005, rodRadius + 0.005, rodHeight + 0.01, 10, 1, true]} />
            <meshBasicMaterial color="#facc15" wireframe transparent opacity={0.6} />
          </mesh>
          <pointLight color="#facc15" intensity={0.3} distance={0.5} />
        </>
      )}

      <ContentsLabel
        contents={contents ?? []}
        yOffset={rodHeight / 2 + 0.08}
        temperature={temperature}
      />
    </group>
  );
}
