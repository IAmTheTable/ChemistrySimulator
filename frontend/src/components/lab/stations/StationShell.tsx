import React from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useLabStore } from "../../../stores/labStore";
import { EQUIPMENT_Y_OFFSETS } from "../equipment/equipmentUtils";

export const LABEL_STYLE: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "6px",
  whiteSpace: "nowrap",
  background: "rgba(0,0,0,0.4)",
  padding: "0px 3px",
  borderRadius: "2px",
  pointerEvents: "none",
};

function WorkSurface() {
  const placingEquipment = useLabStore((s) => s.placingEquipment);
  const addBenchItem = useLabStore((s) => s.addBenchItem);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!placingEquipment || placingEquipment.startsWith("substance:")) return;
    e.stopPropagation();
    const point = e.point;
    addBenchItem({
      id: `${placingEquipment}-${Date.now()}`,
      type: placingEquipment,
      position: [
        Math.round(point.x * 10) / 10,
        EQUIPMENT_Y_OFFSETS[placingEquipment] ?? 0.20,
        Math.round(point.z * 10) / 10,
      ],
      contents: [],
      temperature: 25,
      activeEffects: [],
      damaged: false,
    });
  };

  return (
    <mesh position={[0, 0.06, 0]} receiveShadow onClick={handleClick}>
      <boxGeometry args={[3.5, 0.01, 2.2]} />
      <meshStandardMaterial transparent opacity={0} />
    </mesh>
  );
}

export default function StationShell({
  children,
  wallColor = "#3f3f46",
  showShelf = true,
}: {
  children: React.ReactNode;
  wallColor?: string;
  showShelf?: boolean;
}) {
  return (
    <group>
      <mesh position={[0, 0.6, -1.25]} castShadow>
        <boxGeometry args={[4, 1.1, 0.05]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {showShelf && (
        <mesh position={[0, 0.35, -1.1]} castShadow>
          <boxGeometry args={[3.8, 0.04, 0.3]} />
          <meshStandardMaterial color="#44403c" roughness={0.8} />
        </mesh>
      )}
      <WorkSurface />
      {children}
    </group>
  );
}
