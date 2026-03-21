import type { ThreeEvent } from "@react-three/fiber";
import { useLabStore } from "../../../stores/labStore";
import Beaker from "../equipment/Beaker";
import TestTube from "../equipment/TestTube";
import ErlenmeyerFlask from "../equipment/ErlenmeyerFlask";

const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  beaker: Beaker,
  erlenmeyer: ErlenmeyerFlask,
  "test-tube": TestTube,
};

export default function MainBench() {
  return (
    <group>
      {/* Bench back wall / shelf */}
      <mesh position={[0, 0.6, -1.25]} castShadow>
        <boxGeometry args={[4, 1.1, 0.05]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.9} />
      </mesh>

      {/* Shelf */}
      <mesh position={[0, 0.35, -1.1]} castShadow>
        <boxGeometry args={[3.8, 0.04, 0.3]} />
        <meshStandardMaterial color="#44403c" roughness={0.8} />
      </mesh>

      {/* Test tube rack on shelf */}
      <mesh position={[-1.2, 0.42, -1.05]}>
        <boxGeometry args={[0.4, 0.1, 0.15]} />
        <meshStandardMaterial color="#78716c" />
      </mesh>

      {/* Bunsen burner spot (placeholder cylinder) */}
      <mesh position={[1.5, 0.12, 0.5]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.15, 16]} />
        <meshStandardMaterial color="#52525b" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Analytics balance area marker */}
      <mesh position={[-1.5, 0.06, 0.8]} receiveShadow>
        <boxGeometry args={[0.5, 0.02, 0.4]} />
        <meshStandardMaterial color="#1c1917" roughness={0.5} />
      </mesh>

      {/* ── All items from store ── */}
      <DynamicItems />
    </group>
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
  const pouringFrom = useLabStore((s) => s.pouringFrom);
  const cancelPouring = useLabStore((s) => s.cancelPouring);

  return (
    <>
      {benchItems.map((item) => {
        const isSelected = selectedBenchItem === item.id;
        const onItemClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();

          // Substance placement: add substance to clicked container
          if (placingEquipment?.startsWith("substance:")) {
            const formula = placingEquipment.replace("substance:", "");
            addSubstanceToContainer(item.id, {
              formula,
              amount_ml: 50,
              phase: "aq",
              color: "#cccccc",
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
        const onContextMenu = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          openContextMenu({ itemId: item.id, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY });
        };

        const Component = COMPONENT_MAP[item.type];
        if (!Component) return null;
        return (
          <Component
            key={item.id}
            position={item.position}
            selected={isSelected}
            onClick={onItemClick}
            onContextMenu={onContextMenu}
            contents={item.contents}
            activeEffects={item.activeEffects}
            temperature={item.temperature}
          />
        );
      })}
    </>
  );
}
