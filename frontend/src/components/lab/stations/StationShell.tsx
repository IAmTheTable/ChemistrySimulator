import React from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useLabStore } from "../../../stores/labStore";
import { EQUIPMENT_Y_OFFSETS } from "../equipment/equipmentUtils";
import Beaker from "../equipment/Beaker";
import TestTube from "../equipment/TestTube";
import ErlenmeyerFlask from "../equipment/ErlenmeyerFlask";
import RoundBottomFlask from "../equipment/RoundBottomFlask";
import WatchGlass from "../equipment/WatchGlass";
import GraduatedCylinder from "../equipment/GraduatedCylinder";
import PetriDish from "../equipment/PetriDish";
import Crucible from "../equipment/Crucible";
import Funnel from "../equipment/Funnel";
import Pipette from "../equipment/Pipette";
import ClampStand from "../equipment/ClampStand";
import VacuumFilter from "../equipment/VacuumFilter";

export const LABEL_STYLE: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "5px",
  whiteSpace: "nowrap",
  background: "rgba(0,0,0,0.3)",
  padding: "0px 2px",
  borderRadius: "2px",
  pointerEvents: "none",
  userSelect: "none",
};

const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  beaker: Beaker,
  erlenmeyer: ErlenmeyerFlask,
  "test-tube": TestTube,
  "round-bottom": RoundBottomFlask,
  "watch-glass": WatchGlass,
  "graduated-cylinder": GraduatedCylinder,
  "petri-dish": PetriDish,
  crucible: Crucible,
  funnel: Funnel,
  pipette: Pipette,
  "clamp-stand": ClampStand,
  "vacuum-filter": VacuumFilter,
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
      <DynamicItems />
      {children}
    </group>
  );
}

function DynamicItems() {
  const benchItems = useLabStore((s) => s.benchItems);
  const selectedBenchItem = useLabStore((s) => s.selectedBenchItem);
  const connections = useLabStore((s) => s.connections);
  const selectBenchItem = useLabStore((s) => s.selectBenchItem);
  const openContextMenu = useLabStore((s) => s.openContextMenu);
  const combineContainers = useLabStore((s) => s.combineContainers);
  const placingEquipment = useLabStore((s) => s.placingEquipment);
  const addSubstanceToContainer = useLabStore((s) => s.addSubstanceToContainer);
  const substanceAmount = useLabStore((s) => s.substanceAmount);
  const pouringFrom = useLabStore((s) => s.pouringFrom);
  const cancelPouring = useLabStore((s) => s.cancelPouring);
  const startDragItem = useLabStore((s) => s.startDragItem);
  const draggingItem = useLabStore((s) => s.draggingItem);
  const stopDragItem = useLabStore((s) => s.stopDragItem);
  const moveBenchItem = useLabStore((s) => s.moveBenchItem);
  const setHoveredItem = useLabStore((s) => s.setHoveredItem);
  const setActiveBottomTab = useLabStore((s) => s.setActiveBottomTab);

  return (
    <>
      {benchItems.map((item) => {
        const isSelected = selectedBenchItem === item.id;
        const isPourTarget = !!(pouringFrom && pouringFrom !== item.id);
        const isPlaceTarget = !!(placingEquipment?.startsWith("substance:"));
        const showTargetGlow = isPourTarget || isPlaceTarget;

        const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
          if (e.nativeEvent.button !== 0) return;
          if (placingEquipment || pouringFrom) return;
          e.stopPropagation();
          startDragItem(item.id);
        };
        const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
          if (draggingItem !== item.id) return;
          e.stopPropagation();
          const yOffset = EQUIPMENT_Y_OFFSETS[item.type] ?? 0.20;
          moveBenchItem(item.id, [Math.round(e.point.x * 10) / 10, yOffset, Math.round(e.point.z * 10) / 10]);
        };
        const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
          if (draggingItem === item.id) { e.stopPropagation(); stopDragItem(); }
        };
        const onItemClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (placingEquipment?.startsWith("substance:")) {
            const formula = placingEquipment.replace("substance:", "");
            fetch(`/api/substances/lookup?formula=${encodeURIComponent(formula)}`, { method: "POST" })
              .then((res) => res.ok ? res.json() : null)
              .then((info) => {
                addSubstanceToContainer(item.id, { formula, amount_ml: substanceAmount, phase: info?.phase ?? "aq", color: info?.color ?? "#cccccc" });
              })
              .catch(() => {
                addSubstanceToContainer(item.id, { formula, amount_ml: substanceAmount, phase: "aq", color: "#cccccc" });
              });
            return;
          }
          if (pouringFrom && pouringFrom !== item.id) {
            combineContainers(pouringFrom, item.id);
            cancelPouring();
            selectBenchItem(null);
            return;
          }
          if (e.nativeEvent.shiftKey && selectedBenchItem && selectedBenchItem !== item.id) {
            combineContainers(selectedBenchItem, item.id);
            selectBenchItem(null);
          } else {
            const newSelection = selectedBenchItem === item.id ? null : item.id;
            selectBenchItem(newSelection);
            if (newSelection) setActiveBottomTab("inspector");
          }
        };
        const onCtxMenu = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          openContextMenu({ itemId: item.id, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
        };
        const onItemDoubleClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          selectBenchItem(item.id);
          setActiveBottomTab("inspector");
        };
        const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHoveredItem(item.id);
          document.body.style.cursor = "pointer";
        };
        const onPointerOut = () => {
          setHoveredItem(null);
          document.body.style.cursor = "default";
        };

        const Component = COMPONENT_MAP[item.type];
        if (!Component) return null;
        const isConnected = connections.some((c) => c.targetId === item.id);
        return (
          <group key={item.id}>
            <Component
              position={item.position}
              selected={isSelected}
              damaged={item.damaged}
              connected={isConnected}
              onClick={onItemClick}
              onDoubleClick={onItemDoubleClick}
              onContextMenu={onCtxMenu}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerOver={onPointerOver}
              onPointerOut={onPointerOut}
              contents={item.contents}
              activeEffects={item.activeEffects}
              temperature={item.temperature}
            />
            {showTargetGlow && (
              <mesh position={[item.position[0], 0.06, item.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.1, 0.14, 32]} />
                <meshBasicMaterial color="#22d3ee" transparent opacity={0.5} />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
}
