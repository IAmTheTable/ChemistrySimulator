import { useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import StationShell, { LABEL_STYLE } from "./StationShell";
import { useStationTool } from "./useStationTool";

export default function FumeHood() {
  const { selectedItem, selectedBenchItem, updateBenchItemContents, showNotification } = useStationTool();
  const [sashOpen, setSashOpen] = useState(true);

  const handleDistillation = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    if (selectedItem.contents.length < 2) {
      showNotification("Need a mixture of at least 2 substances to distill");
      return;
    }
    // Remove the substance with lowest boiling point (approximate: lighter molecules first)
    const sorted = [...selectedItem.contents].sort((a, b) => a.amount_ml - b.amount_ml);
    const distilled = sorted[0];
    const remaining = selectedItem.contents.filter((s) => s !== distilled);
    updateBenchItemContents(selectedBenchItem, remaining);
    showNotification(`Distilled off ${distilled.formula} (${distilled.amount_ml} mL)`);
  };

  const handleSash = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setSashOpen((prev) => !prev);
    showNotification(sashOpen ? "Sash closed" : "Sash opened");
  };

  const sashY = sashOpen ? 0.8 : 1.25;
  const sashBarY = sashOpen ? 1.27 : 1.72;

  return (
    <StationShell wallColor="#3a3a44" showShelf={false}>
      {/* Hood enclosure — top panel */}
      <mesh position={[0, 1.5, -0.6]} castShadow>
        <boxGeometry args={[3.2, 0.06, 1.4]} />
        <meshStandardMaterial color="#4a4a55" roughness={0.7} metalness={0.3} />
      </mesh>
      <Html position={[0, 1.65, -0.6]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Fume Hood</span>
      </Html>

      {/* Hood left wall */}
      <mesh position={[-1.6, 0.95, -0.6]} castShadow>
        <boxGeometry args={[0.06, 1.1, 1.4]} />
        <meshStandardMaterial color="#4a4a55" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Hood right wall */}
      <mesh position={[1.6, 0.95, -0.6]} castShadow>
        <boxGeometry args={[0.06, 1.1, 1.4]} />
        <meshStandardMaterial color="#4a4a55" roughness={0.7} metalness={0.3} />
      </mesh>

      {/* Glass sash panel — click to toggle open/closed */}
      <mesh position={[0, sashY, 0.1]} onClick={handleSash}>
        <boxGeometry args={[3.1, 0.9, 0.03]} />
        <meshPhysicalMaterial
          color="#a8c8ff"
          transparent
          opacity={0.22}
          roughness={0.05}
          metalness={0.0}
          transmission={0.8}
        />
      </mesh>
      <Html position={[0, 1.32, 0.1]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Sash (click to toggle)</span>
      </Html>

      {/* Sash frame top bar */}
      <mesh position={[0, sashBarY, 0.1]} castShadow onClick={handleSash}>
        <boxGeometry args={[3.15, 0.05, 0.04]} />
        <meshStandardMaterial color="#5a5a66" roughness={0.5} metalness={0.5} />
      </mesh>

      {/* Interior workspace surface */}
      <mesh position={[0, 0.08, -0.7]} receiveShadow>
        <boxGeometry args={[3.1, 0.04, 1.1]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.6} />
      </mesh>

      {/* Ventilation slots at top — 4 thin rectangles */}
      {([-0.9, -0.3, 0.3, 0.9] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 1.48, -0.55]}>
          <boxGeometry args={[0.12, 0.02, 0.6]} />
          <meshStandardMaterial color="#2a2a33" roughness={0.9} />
        </mesh>
      ))}

      {/* Distillation flask (round bottom) — click to distill */}
      <Html position={[-0.1, 0.72, -0.75]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Distillation Setup</span>
      </Html>
      <group onClick={handleDistillation}>
        <mesh position={[-0.5, 0.22, -0.75]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshPhysicalMaterial
            color="#c8e0ff"
            transparent
            opacity={0.3}
            roughness={0.05}
            transmission={0.75}
          />
        </mesh>

        {/* Distillation neck */}
        <mesh position={[-0.5, 0.42, -0.75]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.24, 12]} />
          <meshPhysicalMaterial
            color="#c8e0ff"
            transparent
            opacity={0.3}
            roughness={0.05}
            transmission={0.75}
          />
        </mesh>

        {/* Condenser tube (angled) — approximated as cylinder */}
        <mesh position={[0.1, 0.45, -0.75]} rotation={[0, 0, -Math.PI / 5]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.5, 12]} />
          <meshPhysicalMaterial
            color="#c8e0ff"
            transparent
            opacity={0.3}
            roughness={0.05}
            transmission={0.75}
          />
        </mesh>

        {/* Collection flask */}
        <mesh position={[0.45, 0.18, -0.75]} castShadow>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshPhysicalMaterial
            color="#c8e0ff"
            transparent
            opacity={0.3}
            roughness={0.05}
            transmission={0.75}
          />
        </mesh>
      </group>

      {/* Stand rod for condenser */}
      <mesh position={[0.1, 0.6, -0.9]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 1.0, 8]} />
        <meshStandardMaterial color="#707080" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Stand base */}
      <mesh position={[0.1, 0.12, -0.9]}>
        <boxGeometry args={[0.25, 0.04, 0.18]} />
        <meshStandardMaterial color="#606070" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Chemical bottle on interior workspace */}
      <mesh position={[0.9, 0.2, -0.75]} castShadow>
        <cylinderGeometry args={[0.05, 0.055, 0.2, 12]} />
        <meshStandardMaterial color="#8899aa" roughness={0.4} metalness={0.1} />
      </mesh>
      <mesh position={[0.9, 0.32, -0.75]}>
        <cylinderGeometry args={[0.018, 0.018, 0.05, 8]} />
        <meshStandardMaterial color="#667788" roughness={0.4} />
      </mesh>
    </StationShell>
  );
}
