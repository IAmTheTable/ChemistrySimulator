import { useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid, Environment } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useLabStore } from "../../stores/labStore";
import { EQUIPMENT_Y_OFFSETS } from "./equipment/equipmentUtils";
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
  const draggingItem = useLabStore((s) => s.draggingItem);
  const moveBenchItem = useLabStore((s) => s.moveBenchItem);
  const stopDragItem = useLabStore((s) => s.stopDragItem);
  const benchItems = useLabStore((s) => s.benchItems);

  const handleClick = (_e: ThreeEvent<MouseEvent>) => {
    if (!placingEquipment && !pouringFrom) {
      selectBenchItem(null);
      return;
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!draggingItem) return;
    const item = benchItems.find((i) => i.id === draggingItem);
    if (!item) return;
    const yOffset = EQUIPMENT_Y_OFFSETS[item.type] ?? 0.20;
    moveBenchItem(draggingItem, [
      Math.round(e.point.x * 10) / 10,
      yOffset,
      Math.round(e.point.z * 10) / 10,
    ]);
  };

  const handlePointerUp = () => {
    if (draggingItem) stopDragItem();
  };

  return (
    <mesh
      position={[0, 0, 0]}
      receiveShadow
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable) return;
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

    // Camera-relative directions projected onto XZ plane
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, camera.up).normalize();

    const move = new THREE.Vector3();
    if (keys.current.has("w")) move.add(forward);
    if (keys.current.has("s")) move.sub(forward);
    if (keys.current.has("d")) move.add(right);
    if (keys.current.has("a")) move.sub(right);
    if (keys.current.has("q")) move.y += 1;
    if (keys.current.has("e")) move.y -= 1;

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed);
      camera.position.add(move);
      target.add(move);
      controlsRef.current.update();
    }
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
