import { useLabStore } from "../../../stores/labStore";
import Beaker from "../equipment/Beaker";
import TestTube from "../equipment/TestTube";
import ErlenmeyerFlask from "../equipment/ErlenmeyerFlask";

// Starter equipment — fixed pieces always present on the bench
const STARTER_BEAKERS = [
  { id: "starter-beaker-1", position: [-0.6, 0.2, 0.3] as [number, number, number], fillLevel: 0, fillColor: "#4fc3f7" },
  { id: "starter-beaker-2", position: [-0.3, 0.2, 0.3] as [number, number, number], fillLevel: 0.45, fillColor: "#1e88e5" },
];

const STARTER_FLASK = {
  id: "starter-flask-1",
  position: [0.3, 0.2, 0.4] as [number, number, number],
  fillLevel: 0.35,
  fillColor: "#ffb74d",
};

// 5 test tubes on the shelf rack at position [-1.2, 0.42, -1.05]
// Rack mesh is at y=0.42; tubes stand upright ~0.25 tall, so top of rack is y≈0.47
// Tubes sit on rack surface: base at y=0.47, center at y=0.47+0.125=0.595
const SHELF_Y = 0.595;
const RACK_Z = -1.05;
const STARTER_TEST_TUBES = [
  { id: "starter-tt-1", position: [-1.35, SHELF_Y, RACK_Z] as [number, number, number], fillLevel: 0, fillColor: "#a5d6a7" },
  { id: "starter-tt-2", position: [-1.25, SHELF_Y, RACK_Z] as [number, number, number], fillLevel: 0.3, fillColor: "#ef9a9a" },
  { id: "starter-tt-3", position: [-1.15, SHELF_Y, RACK_Z] as [number, number, number], fillLevel: 0.55, fillColor: "#ce93d8" },
  { id: "starter-tt-4", position: [-1.05, SHELF_Y, RACK_Z] as [number, number, number], fillLevel: 0.2, fillColor: "#80cbc4" },
  { id: "starter-tt-5", position: [-0.95, SHELF_Y, RACK_Z] as [number, number, number], fillLevel: 0, fillColor: "#a5d6a7" },
];

export default function MainBench() {
  const selectedBenchItem = useLabStore((s) => s.selectedBenchItem);
  const selectBenchItem = useLabStore((s) => s.selectBenchItem);
  const benchItems = useLabStore((s) => s.benchItems);

  const handleSelect = (id: string) => {
    selectBenchItem(selectedBenchItem === id ? null : id);
  };

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

      {/* ── Starter equipment ── */}

      {STARTER_BEAKERS.map((b) => (
        <Beaker
          key={b.id}
          position={b.position}
          fillLevel={b.fillLevel}
          fillColor={b.fillColor}
          selected={selectedBenchItem === b.id}
          onClick={() => handleSelect(b.id)}
        />
      ))}

      <ErlenmeyerFlask
        position={STARTER_FLASK.position}
        fillLevel={STARTER_FLASK.fillLevel}
        fillColor={STARTER_FLASK.fillColor}
        selected={selectedBenchItem === STARTER_FLASK.id}
        onClick={() => handleSelect(STARTER_FLASK.id)}
      />

      {STARTER_TEST_TUBES.map((tt) => (
        <TestTube
          key={tt.id}
          position={tt.position}
          fillLevel={tt.fillLevel}
          fillColor={tt.fillColor}
          selected={selectedBenchItem === tt.id}
          onClick={() => handleSelect(tt.id)}
        />
      ))}

      {/* ── Dynamically placed items from store ── */}
      {benchItems.map((item) => {
        const isSelected = selectedBenchItem === item.id;
        const onItemClick = () => handleSelect(item.id);

        switch (item.type) {
          case "beaker":
            return (
              <Beaker
                key={item.id}
                position={item.position}
                selected={isSelected}
                onClick={onItemClick}
              />
            );
          case "erlenmeyer":
            return (
              <ErlenmeyerFlask
                key={item.id}
                position={item.position}
                selected={isSelected}
                onClick={onItemClick}
              />
            );
          case "test-tube":
            return (
              <TestTube
                key={item.id}
                position={item.position}
                selected={isSelected}
                onClick={onItemClick}
              />
            );
          default:
            return null;
        }
      })}
    </group>
  );
}
