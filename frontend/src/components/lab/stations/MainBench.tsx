import { useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useLabStore } from "../../../stores/labStore";
import { EQUIPMENT_Y_OFFSETS } from "../equipment/equipmentUtils";
import Beaker from "../equipment/Beaker";
import TestTube from "../equipment/TestTube";
import ErlenmeyerFlask from "../equipment/ErlenmeyerFlask";
import RoundBottomFlask from "../equipment/RoundBottomFlask";
import WatchGlass from "../equipment/WatchGlass";
import GraduatedCylinder from "../equipment/GraduatedCylinder";
import StationShell, { LABEL_STYLE } from "./StationShell";
import { useStationTool } from "./useStationTool";

const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  beaker: Beaker,
  erlenmeyer: ErlenmeyerFlask,
  "test-tube": TestTube,
  "round-bottom": RoundBottomFlask,
  "watch-glass": WatchGlass,
  "graduated-cylinder": GraduatedCylinder,
};

export default function MainBench() {
  const { selectedItem, selectedBenchItem, updateBenchItemContents, showNotification, setBenchItemEffects } = useStationTool();
  const [burnerActive, setBurnerActive] = useState(false);

  const handleBunsenBurner = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    const newTemp = selectedItem.temperature + 50;
    updateBenchItemContents(selectedBenchItem, selectedItem.contents, newTemp);
    setBenchItemEffects(selectedBenchItem, [...selectedItem.activeEffects.filter(e => e !== "heating"), "heating"]);
    setBurnerActive(true);
    showNotification(`Heating ${selectedItem.type} to ${newTemp}\u00B0C`);
    setTimeout(() => {
      setBurnerActive(false);
      const current = useLabStore.getState().benchItems.find(b => b.id === selectedBenchItem);
      if (current) {
        useLabStore.getState().setBenchItemEffects(selectedBenchItem, current.activeEffects.filter(e => e !== "heating"));
      }
    }, 3000);
  };

  const handleBalance = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    if (selectedItem.contents.length === 0) {
      showNotification(`${selectedItem.type} is empty -- mass: 0.00 g`);
      return;
    }
    const totalMass = selectedItem.contents.reduce((sum, s) => sum + s.amount_ml * 1.0, 0);
    showNotification(`Analytical Balance -- Mass: ${totalMass.toFixed(2)} g`);
  };

  return (
    <StationShell>
      {/* Test tube rack on shelf */}
      <mesh position={[-1.2, 0.42, -1.05]}>
        <boxGeometry args={[0.4, 0.1, 0.15]} />
        <meshStandardMaterial color="#78716c" />
      </mesh>
      <Html position={[-1.2, 0.58, -1.05]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Test Tube Rack</span>
      </Html>

      {/* Bunsen burner spot (placeholder cylinder) */}
      <group onClick={handleBunsenBurner}>
        <mesh position={[1.5, 0.12, 0.5]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.15, 16]} />
          <meshStandardMaterial color="#52525b" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Flame effect when active */}
        {burnerActive && (
          <>
            <mesh position={[1.5, 0.28, 0.5]}>
              <coneGeometry args={[0.03, 0.12, 8]} />
              <meshStandardMaterial color="#3388ff" emissive="#3388ff" emissiveIntensity={2} transparent opacity={0.7} />
            </mesh>
            <mesh position={[1.5, 0.35, 0.5]}>
              <coneGeometry args={[0.02, 0.08, 8]} />
              <meshStandardMaterial color="#ffaa22" emissive="#ffaa22" emissiveIntensity={2} transparent opacity={0.6} />
            </mesh>
            <pointLight position={[1.5, 0.35, 0.5]} color="#ffaa22" intensity={0.5} distance={1.5} />
          </>
        )}
      </group>
      <Html position={[1.5, 0.35, 0.5]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Bunsen Burner</span>
      </Html>

      {/* Analytics balance area marker */}
      <mesh position={[-1.5, 0.06, 0.8]} receiveShadow onClick={handleBalance}>
        <boxGeometry args={[0.5, 0.02, 0.4]} />
        <meshStandardMaterial color="#1c1917" roughness={0.5} />
      </mesh>
      <Html position={[-1.5, 0.22, 0.8]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Analytical Balance</span>
      </Html>

      {/* ── All items from store ── */}
      <DynamicItems />
    </StationShell>
  );
}

function DynamicItems() {
  const benchItems = useLabStore((s) => s.benchItems);
  const selectedBenchItem = useLabStore((s) => s.selectedBenchItem);
  const selectBenchItem = useLabStore((s) => s.selectBenchItem);
  const openContextMenu = useLabStore((s) => s.openContextMenu);
  const combineContainers = useLabStore((s) => s.combineContainers);
  const placingEquipment = useLabStore((s) => s.placingEquipment);
  const addSubstanceToContainer = useLabStore((s) => s.addSubstanceToContainer);
  const substanceAmount = useLabStore((s) => s.substanceAmount);
  const pouringFrom = useLabStore((s) => s.pouringFrom);
  const cancelPouring = useLabStore((s) => s.cancelPouring);
  const draggingItem = useLabStore((s) => s.draggingItem);
  const startDragItem = useLabStore((s) => s.startDragItem);
  const stopDragItem = useLabStore((s) => s.stopDragItem);
  const moveBenchItem = useLabStore((s) => s.moveBenchItem);
  const setHoveredItem = useLabStore((s) => s.setHoveredItem);
  const setActiveBottomTab = useLabStore((s) => s.setActiveBottomTab);

  return (
    <>
      {benchItems.map((item) => {
        const isSelected = selectedBenchItem === item.id;
        // Highlight containers as valid pour targets
        const isPourTarget = !!(pouringFrom && pouringFrom !== item.id);
        const isPlaceTarget = !!(placingEquipment?.startsWith("substance:"));
        const showTargetGlow = isPourTarget || isPlaceTarget;

        const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
          if (e.nativeEvent.button !== 0) return; // left click only
          if (placingEquipment || pouringFrom) return; // don't drag while placing/pouring
          e.stopPropagation();
          startDragItem(item.id);
        };

        const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
          if (draggingItem !== item.id) return;
          e.stopPropagation();
          const point = e.point;
          const yOffset = EQUIPMENT_Y_OFFSETS[item.type] ?? 0.20;
          moveBenchItem(item.id, [
            Math.round(point.x * 10) / 10,
            yOffset,
            Math.round(point.z * 10) / 10,
          ]);
        };

        const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
          if (draggingItem === item.id) {
            e.stopPropagation();
            stopDragItem();
          }
        };

        const onItemClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();

          // Substance placement: add substance to clicked container
          if (placingEquipment?.startsWith("substance:")) {
            const formula = placingEquipment.replace("substance:", "");
            // Fetch substance info from the lookup endpoint for accurate phase/color
            fetch(`/api/substances/lookup?formula=${encodeURIComponent(formula)}`, { method: "POST" })
              .then((res) => res.ok ? res.json() : null)
              .then((info) => {
                addSubstanceToContainer(item.id, {
                  formula,
                  amount_ml: substanceAmount,
                  phase: info?.phase ?? "aq",
                  color: info?.color ?? "#cccccc",
                });
              })
              .catch(() => {
                addSubstanceToContainer(item.id, {
                  formula,
                  amount_ml: substanceAmount,
                  phase: "aq",
                  color: "#cccccc",
                });
              });
            return;
          }

          // Pour mode: pour from source into this container
          if (pouringFrom && pouringFrom !== item.id) {
            combineContainers(pouringFrom, item.id);
            cancelPouring();
            selectBenchItem(null);
            return;
          }

          // Shift+click combine
          if (e.nativeEvent.shiftKey && selectedBenchItem && selectedBenchItem !== item.id) {
            combineContainers(selectedBenchItem, item.id);
            selectBenchItem(null);
          } else {
            selectBenchItem(selectedBenchItem === item.id ? null : item.id);
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
        return (
          <group key={item.id}>
            <Component
              position={item.position}
              selected={isSelected}
              damaged={item.damaged}
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
            {/* Pulsing glow ring for valid pour/place targets */}
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
