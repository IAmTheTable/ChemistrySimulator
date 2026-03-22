import { Canvas } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import { useLabStore } from "../../stores/labStore";
import MainBench from "./stations/MainBench";
import FumeHood from "./stations/FumeHood";
import InstrumentRoom from "./stations/InstrumentRoom";
import ElectrochemistryLab from "./stations/ElectrochemistryLab";
import GloveBox from "./stations/GloveBox";
import ThermalAnalysis from "./stations/ThermalAnalysis";
import StorageSafety from "./stations/StorageSafety";
import { EQUIPMENT_Y_OFFSETS } from "./equipment/equipmentUtils";

export default function LabScene() {
  return (
    <Canvas
      camera={{
        position: [0, 5, 5],
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      shadows
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-3, 4, -3]} intensity={0.3} color="#b4d4ff" />

      <OrbitControls
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={2}
        maxDistance={12}
        enablePan
      />

      {/* Ground grid for spatial reference */}
      <Grid
        position={[0, -0.01, 0]}
        cellSize={0.5}
        cellColor="#1e293b"
        sectionSize={2}
        sectionColor="#334155"
        fadeDistance={15}
        infiniteGrid
      />

      {/* Lab bench surface — clickable for equipment placement */}
      <BenchSurface />

      {/* Bench legs */}
      {(
        [
          [-1.8, -0.45, -1.1],
          [1.8, -0.45, -1.1],
          [-1.8, -0.45, 1.1],
          [1.8, -0.45, 1.1],
        ] as [number, number, number][]
      ).map((pos, i) => (
        <mesh key={i} position={pos} castShadow>
          <boxGeometry args={[0.08, 0.8, 0.08]} />
          <meshStandardMaterial color="#292524" />
        </mesh>
      ))}

      {/* Active station content */}
      <StationContent />

      {/* Soft environment for reflections */}
      <Environment preset="apartment" />
    </Canvas>
  );
}

function BenchSurface() {
  const placingEquipment = useLabStore((s) => s.placingEquipment);
  const addBenchItem = useLabStore((s) => s.addBenchItem);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!placingEquipment) return;
    // Substances go into existing containers, not onto the bench surface
    if (placingEquipment.startsWith("substance:")) return;
    e.stopPropagation();

    const point = e.point;
    // Y offset so equipment sits ON the bench (top at Y=0.05), not inside it
    const position: [number, number, number] = [
      Math.round(point.x * 10) / 10,
      EQUIPMENT_Y_OFFSETS[placingEquipment] ?? 0.20,
      Math.round(point.z * 10) / 10,
    ];

    addBenchItem({
      id: `${placingEquipment}-${Date.now()}`,
      type: placingEquipment,
      position,
      contents: [],
      temperature: 25,
      activeEffects: [],
    });
  };

  return (
    <mesh
      position={[0, 0, 0]}
      receiveShadow
      onClick={handleClick}
      onPointerOver={() => {
        if (placingEquipment) document.body.style.cursor = "crosshair";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <boxGeometry args={[4, 0.1, 2.5]} />
      <meshStandardMaterial
        color={placingEquipment ? "#4a4540" : "#44403c"}
        roughness={0.8}
      />
    </mesh>
  );
}

function StationContent() {
  const activeStation = useLabStore((s) => s.activeStation);

  switch (activeStation) {
    case "main-bench":
      return <MainBench />;
    case "fume-hood":
      return <FumeHood />;
    case "instrument-room":
      return <InstrumentRoom />;
    case "electrochemistry":
      return <ElectrochemistryLab />;
    case "glove-box":
      return <GloveBox />;
    case "thermal-analysis":
      return <ThermalAnalysis />;
    case "storage-safety":
      return <StorageSafety />;
    default:
      return null;
  }
}
