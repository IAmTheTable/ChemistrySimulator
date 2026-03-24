import { useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import StationShell, { LABEL_STYLE } from "./StationShell";
import { useStationTool } from "./useStationTool";
import InteractiveTool from "./InteractiveTool";
import { useLabStore } from "../../../stores/labStore";

export default function FumeHood() {
  const { selectedItem, selectedBenchItem, updateBenchItemContents, showNotification } = useStationTool();
  const connectEquipment = useLabStore((s) => s.connectEquipment);
  const connections = useLabStore((s) => s.connections);
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

  const handleGasNozzle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    const newTemp = selectedItem.temperature + 30;
    updateBenchItemContents(selectedBenchItem, selectedItem.contents, newTemp);
    showNotification(`Gas nozzle heating -- ${selectedItem.type} to ${newTemp}\u00B0C`);
  };

  const handleVacuumLine = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }

    // If selected item is a vacuum filter, connect it to the vacuum line
    if (selectedItem.type === "vacuum-filter") {
      const alreadyConnected = connections.some(
        (c) => c.targetId === selectedBenchItem && c.type === "vacuum"
      );
      if (alreadyConnected) {
        showNotification("Vacuum filter already connected to vacuum line");
      } else {
        connectEquipment("vacuum-line", selectedBenchItem, "vacuum");
        showNotification("Vacuum line connected to filter flask");
      }
      return;
    }

    // Default behaviour: extract gas from any container
    const gasContents = selectedItem.contents.filter((s) => s.phase === "g");
    if (gasContents.length === 0) {
      showNotification("No gas phase contents to extract");
      return;
    }
    const remaining = selectedItem.contents.filter((s) => s.phase !== "g");
    updateBenchItemContents(selectedBenchItem, remaining);
    const removed = gasContents.map((g) => g.formula).join(", ");
    showNotification(`Vacuum extracted gas: ${removed}`);
  };

  const handleRotavap = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    if (selectedItem.contents.length === 0) {
      showNotification("Container is empty");
      return;
    }
    // Remove the substance with lowest boiling point (most volatile)
    const sorted = [...selectedItem.contents].sort((a, b) => a.amount_ml - b.amount_ml);
    const evaporated = sorted[0];
    const remaining = selectedItem.contents.filter((s) => s !== evaporated);
    updateBenchItemContents(selectedBenchItem, remaining);
    showNotification(`Rotavap evaporated ${evaporated.formula} (${evaporated.amount_ml} mL)`);
  };

  const sashY = sashOpen ? 0.8 : 1.25;
  const sashBarY = sashOpen ? 1.27 : 1.72;

  return (
    <StationShell wallColor="#3a3a44" showShelf={false}>
      {/* Hood enclosure -- top panel */}
      <mesh position={[0, 1.5, -0.6]} castShadow>
        <boxGeometry args={[3.2, 0.06, 1.4]} />
        <meshStandardMaterial color="#4a4a55" roughness={0.7} metalness={0.3} />
      </mesh>
      <Html position={[0, 1.65, -0.6]} center distanceFactor={15}>
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

      {/* Glass sash panel + frame bar -- wrapped together as one interactive tool */}
      <InteractiveTool
        name="Sash"
        description="Click to open/close fume hood"
        onClick={handleSash}
        position={[0, sashY, 0.1]}
        hitboxSize={[3.15, 0.95, 0.08]}
        labelOffset={[0, 0.6, 0]}
      >
        <mesh>
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
        {/* Sash frame top bar */}
        <mesh position={[0, sashBarY - sashY, 0]} castShadow>
          <boxGeometry args={[3.15, 0.05, 0.04]} />
          <meshStandardMaterial color="#5a5a66" roughness={0.5} metalness={0.5} />
        </mesh>
      </InteractiveTool>

      {/* Interior workspace surface */}
      <mesh position={[0, 0.08, -0.7]} receiveShadow>
        <boxGeometry args={[3.1, 0.04, 1.1]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.6} />
      </mesh>

      {/* Ventilation slots at top -- 4 thin rectangles */}
      {([-0.9, -0.3, 0.3, 0.9] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 1.48, -0.55]}>
          <boxGeometry args={[0.12, 0.02, 0.6]} />
          <meshStandardMaterial color="#2a2a33" roughness={0.9} />
        </mesh>
      ))}

      {/* Distillation flask (round bottom) -- click to distill */}
      <InteractiveTool
        name="Distillation Setup"
        description="Click to separate mixture by boiling point"
        onClick={handleDistillation}
        position={[0, 0.33, -0.75]}
        hitboxSize={[1.1, 0.5, 0.35]}
        labelOffset={[0, 0.4, 0]}
      >
        <mesh position={[-0.5, -0.11, 0]} castShadow>
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
        <mesh position={[-0.5, 0.09, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.24, 12]} />
          <meshPhysicalMaterial
            color="#c8e0ff"
            transparent
            opacity={0.3}
            roughness={0.05}
            transmission={0.75}
          />
        </mesh>

        {/* Condenser tube (angled) -- approximated as cylinder */}
        <mesh position={[0.1, 0.12, 0]} rotation={[0, 0, -Math.PI / 5]} castShadow>
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
        <mesh position={[0.45, -0.15, 0]} castShadow>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshPhysicalMaterial
            color="#c8e0ff"
            transparent
            opacity={0.3}
            roughness={0.05}
            transmission={0.75}
          />
        </mesh>
      </InteractiveTool>

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

      {/* Interior light strip at top of hood */}
      <mesh position={[0, 1.46, -0.6]}>
        <boxGeometry args={[2.8, 0.04, 0.12]} />
        <meshStandardMaterial color="#ffffee" emissive="#ffffcc" emissiveIntensity={1.2} roughness={0.8} />
      </mesh>
      <pointLight position={[0, 1.3, -0.7]} color="#fffde8" intensity={0.6} distance={2.5} />

      {/* Gas nozzle on interior LEFT wall (swapped) */}
      <InteractiveTool
        name="Gas Nozzle"
        description="Click to apply gas heating to selected container (+30\u00B0C)"
        onClick={handleGasNozzle}
        position={[-1.54, 0.55, -0.75]}
        hitboxSize={[0.12, 0.18, 0.12]}
        labelOffset={[0.15, 0.25, 0]}
      >
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.012, 0.016, 0.055, 10]} />
          <meshStandardMaterial color="#cc6600" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.01, 10]} />
          <meshStandardMaterial color="#aa5500" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Gas valve knob */}
        <mesh position={[0.02, -0.04, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.015, 8]} />
          <meshStandardMaterial color="#884400" metalness={0.4} roughness={0.4} />
        </mesh>
      </InteractiveTool>

      {/* Vacuum line nozzle on interior RIGHT wall (swapped) */}
      <InteractiveTool
        name="Vacuum Line"
        description="Click to extract gas from selected container"
        onClick={handleVacuumLine}
        position={[1.54, 0.65, -0.8]}
        hitboxSize={[0.12, 0.18, 0.12]}
        labelOffset={[-0.15, 0.2, 0]}
      >
        <mesh rotation={[0, -Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.014, 0.018, 0.06, 10]} />
          <meshStandardMaterial color="#555560" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[-0.02, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.015, 10]} />
          <meshStandardMaterial color="#444450" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Vacuum valve knob */}
        <mesh position={[-0.02, -0.04, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.015, 8]} />
          <meshStandardMaterial color="#333340" metalness={0.6} roughness={0.3} />
        </mesh>
      </InteractiveTool>

      {/* Separating funnel on clamp */}
      {/* Clamp stand vertical rod */}
      <mesh position={[1.1, 0.58, -0.85]} castShadow>
        <cylinderGeometry args={[0.01, 0.01, 0.88, 8]} />
        <meshStandardMaterial color="#707070" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Stand base */}
      <mesh position={[1.1, 0.1, -0.85]}>
        <boxGeometry args={[0.2, 0.035, 0.14]} />
        <meshStandardMaterial color="#606060" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Clamp arm */}
      <mesh position={[1.16, 0.68, -0.85]}>
        <boxGeometry args={[0.13, 0.02, 0.018]} />
        <meshStandardMaterial color="#707070" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Separating funnel body -- inverted cone top */}
      <mesh position={[1.25, 0.6, -0.85]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.075, 0.18, 14]} />
        <meshPhysicalMaterial color="#c8e0ff" transparent opacity={0.28} roughness={0.05} transmission={0.78} />
      </mesh>
      {/* Funnel neck/stem */}
      <mesh position={[1.25, 0.44, -0.85]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.1, 10]} />
        <meshPhysicalMaterial color="#c8e0ff" transparent opacity={0.28} roughness={0.05} transmission={0.78} />
      </mesh>
      {/* Stopcock */}
      <mesh position={[1.25, 0.38, -0.85]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.009, 0.009, 0.06, 8]} />
        <meshStandardMaterial color="#333344" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Liquid inside funnel */}
      <mesh position={[1.25, 0.58, -0.85]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.065, 0.12, 14]} />
        <meshStandardMaterial color="#cc9933" transparent opacity={0.5} roughness={0.1} />
      </mesh>
      <Html position={[1.25, 0.88, -0.85]} center distanceFactor={15}>
        <span style={LABEL_STYLE}>Separating Funnel</span>
      </Html>

      {/* Rotary evaporator (Rotovap) -- left side -- now interactive */}
      <InteractiveTool
        name="Rotary Evaporator"
        description="Click to evaporate most volatile substance"
        onClick={handleRotavap}
        position={[-1.1, 0, -0.85]}
        hitboxSize={[0.5, 0.9, 0.4]}
        labelOffset={[0, 1.0, 0]}
      >
        {/* Rotovap stand */}
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.82, 8]} />
          <meshStandardMaterial color="#606068" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.22, 0.04, 0.16]} />
          <meshStandardMaterial color="#505058" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Motor housing box */}
        <mesh position={[0, 0.72, 0]} castShadow>
          <boxGeometry args={[0.14, 0.1, 0.12]} />
          <meshStandardMaterial color="#2a2a35" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* Motor indicator LED */}
        <mesh position={[0.06, 0.74, 0.06]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshStandardMaterial color="#00ff44" emissive="#00ff44" emissiveIntensity={1.5} />
        </mesh>
        {/* Rotating flask neck (angled) */}
        <mesh position={[-0.08, 0.64, 0.03]} rotation={[0, 0, -Math.PI / 4]}>
          <cylinderGeometry args={[0.014, 0.014, 0.22, 10]} />
          <meshPhysicalMaterial color="#c8e0ff" transparent opacity={0.28} roughness={0.05} transmission={0.78} />
        </mesh>
        {/* Round bottom flask */}
        <mesh position={[-0.2, 0.5, 0.07]}>
          <sphereGeometry args={[0.085, 14, 14]} />
          <meshPhysicalMaterial color="#c8e0ff" transparent opacity={0.28} roughness={0.05} transmission={0.78} />
        </mesh>
        {/* Condenser tube (vertical) */}
        <mesh position={[0.15, 0.6, -0.03]}>
          <cylinderGeometry args={[0.018, 0.018, 0.36, 10]} />
          <meshPhysicalMaterial color="#c8e0ff" transparent opacity={0.25} roughness={0.05} transmission={0.78} />
        </mesh>
        {/* Collection flask */}
        <mesh position={[0.15, 0.32, -0.03]}>
          <sphereGeometry args={[0.065, 12, 12]} />
          <meshPhysicalMaterial color="#c8e0ff" transparent opacity={0.28} roughness={0.05} transmission={0.78} />
        </mesh>
        {/* Temperature controller box */}
        <mesh position={[0.22, 0.2, 0.06]} castShadow>
          <boxGeometry args={[0.12, 0.08, 0.08]} />
          <meshStandardMaterial color="#1a1a25" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Temperature display */}
        <mesh position={[0.22, 0.22, 0.101]}>
          <boxGeometry args={[0.08, 0.035, 0.005]} />
          <meshStandardMaterial color="#001100" emissive="#00ff66" emissiveIntensity={0.8} roughness={0.2} />
        </mesh>
        {/* Temp controller buttons */}
        {([-0.02, 0.02] as number[]).map((x, i) => (
          <mesh key={i} position={[0.22 + x, 0.185, 0.101]}>
            <boxGeometry args={[0.015, 0.012, 0.005]} />
            <meshStandardMaterial color="#334455" roughness={0.5} />
          </mesh>
        ))}
      </InteractiveTool>

      {/* Drain in hood floor */}
      <mesh position={[0.6, 0.1, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.01, 16]} />
        <meshStandardMaterial color="#606068" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.6, 0.1, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.015, 0.035, 16]} />
        <meshStandardMaterial color="#3a3a44" roughness={0.8} />
      </mesh>
      {/* Drain grid lines */}
      {([-0.01, 0, 0.01] as number[]).map((x, i) => (
        <mesh key={i} position={[0.6 + x, 0.105, -0.4]}>
          <boxGeometry args={[0.003, 0.003, 0.06]} />
          <meshStandardMaterial color="#505058" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}

      {/* Sash handle bar (visible grip) */}
      <mesh position={[0, sashBarY - 0.03, 0.12]}>
        <boxGeometry args={[0.28, 0.025, 0.025]} />
        <meshStandardMaterial color="#888890" metalness={0.6} roughness={0.3} />
      </mesh>
    </StationShell>
  );
}
