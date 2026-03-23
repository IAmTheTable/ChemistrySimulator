import { useRef, useEffect } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useLabStore } from "../../stores/labStore";
import MainBench from "./stations/MainBench";
import FumeHood from "./stations/FumeHood";
import InstrumentRoom from "./stations/InstrumentRoom";
import ElectrochemistryLab from "./stations/ElectrochemistryLab";
import GloveBox from "./stations/GloveBox";
import ThermalAnalysis from "./stations/ThermalAnalysis";
import StorageSafety from "./stations/StorageSafety";

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

      <CameraControls />

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
  const pouringFrom = useLabStore((s) => s.pouringFrom);
  const selectBenchItem = useLabStore((s) => s.selectBenchItem);

  const handleClick = (_e: ThreeEvent<MouseEvent>) => {
    if (!placingEquipment && !pouringFrom) {
      selectBenchItem(null);
      return;
    }
  };

  return (
    <mesh
      position={[0, 0, 0]}
      receiveShadow
      onClick={handleClick}
    >
      <boxGeometry args={[4, 0.1, 2.5]} />
      <meshStandardMaterial
        color={placingEquipment ? "#4a4540" : "#44403c"}
        roughness={0.8}
      />
    </mesh>
  );
}

function CameraControls() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const draggingItem = useLabStore((s) => s.draggingItem);
  const { camera } = useThree();
  const keys = useRef(new Set<string>());

  // Disable orbit when dragging equipment
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !draggingItem;
    }
  }, [draggingItem]);

  // WASD keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      keys.current.add(e.key.toLowerCase());
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (!controlsRef.current || keys.current.size === 0) return;
    const speed = 3 * delta;
    const target = controlsRef.current.target;

    if (keys.current.has("w")) { camera.position.z -= speed; target.z -= speed; }
    if (keys.current.has("s")) { camera.position.z += speed; target.z += speed; }
    if (keys.current.has("a")) { camera.position.x -= speed; target.x -= speed; }
    if (keys.current.has("d")) { camera.position.x += speed; target.x += speed; }
    if (keys.current.has("q")) { camera.position.y += speed; target.y += speed; }
    if (keys.current.has("e")) { camera.position.y -= speed; target.y -= speed; }

    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      target={[0, 0, 0]}
      maxPolarAngle={Math.PI / 2.2}
      minDistance={2}
      maxDistance={12}
      enablePan
    />
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
