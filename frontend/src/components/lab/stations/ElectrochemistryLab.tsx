import { useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import StationShell, { LABEL_STYLE } from "./StationShell";
import { useStationTool } from "./useStationTool";

// Simple electrolysis product mapping
const ELECTROLYSIS_MAP: Record<string, { remove: string; products: Array<{ formula: string; phase: string; color: string }> }> = {
  NaCl: { remove: "NaCl", products: [{ formula: "Na", phase: "s", color: "#cccccc" }, { formula: "Cl2", phase: "g", color: "#ccff66" }] },
  "CuSO4": { remove: "CuSO4", products: [{ formula: "Cu", phase: "s", color: "#cc6633" }, { formula: "O2", phase: "g", color: "#ffffff" }, { formula: "H2SO4", phase: "aq", color: "#ffffff" }] },
  KI: { remove: "KI", products: [{ formula: "K", phase: "s", color: "#cccccc" }, { formula: "I2", phase: "s", color: "#551166" }] },
  H2O: { remove: "H2O", products: [{ formula: "H2", phase: "g", color: "#ffffff" }, { formula: "O2", phase: "g", color: "#ffffff" }] },
};

// Simple pH lookup
const PH_MAP: Record<string, number> = {
  HCl: 1, H2SO4: 0.5, HNO3: 1, "H3PO4": 1.5, HF: 2, HBr: 1,
  NaOH: 14, KOH: 14, "Ca(OH)2": 12.5, "Ba(OH)2": 13, NH3: 11,
  NaCl: 7, KCl: 7, "CaCl2": 7, KBr: 7, NaI: 7,
  H2O: 7,
  "CH3COOH": 3, "C6H8O7": 2.2,
  "Na2CO3": 11.5, NaHCO3: 8.3,
};

export default function ElectrochemistryLab() {
  const { selectedItem, selectedBenchItem, updateBenchItemContents, showNotification } = useStationTool();
  const [powerOn, setPowerOn] = useState(false);

  const handleElectrolysis = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container with an ionic solution first");
      return;
    }
    if (selectedItem.contents.length === 0) {
      showNotification("Container is empty");
      return;
    }
    // Find the first substance that can be electrolyzed
    const match = selectedItem.contents.find((s) => ELECTROLYSIS_MAP[s.formula]);
    if (!match) {
      showNotification("No electrolyzable substance found in container");
      return;
    }
    const reaction = ELECTROLYSIS_MAP[match.formula];
    const remaining = selectedItem.contents.filter((s) => s !== match);
    const newProducts = reaction.products.map((p) => ({
      formula: p.formula,
      amount_ml: match.amount_ml / reaction.products.length,
      phase: p.phase,
      color: p.color,
    }));
    updateBenchItemContents(selectedBenchItem, [...remaining, ...newProducts]);
    showNotification(`Electrolysis: ${match.formula} -> ${reaction.products.map((p) => p.formula).join(" + ")}`);
  };

  const handlePHMeter = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    if (selectedItem.contents.length === 0) {
      showNotification("Container is empty -- cannot measure pH");
      return;
    }
    const substance = selectedItem.contents[0];
    const ph = PH_MAP[substance.formula] ?? 7;
    showNotification(`pH Meter: ${substance.formula} -- pH = ${ph.toFixed(1)}`);
  };

  const handlePowerSupply = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setPowerOn((prev) => !prev);
    showNotification(powerOn ? "Power supply OFF" : "Power supply ON");
  };

  return (
    <StationShell wallColor="#2a3028">
      {/* ── Electrolysis cell (central) ── */}
      <Html position={[0, 0.5, 0]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Electrolysis Cell</span>
      </Html>
      {/* Cell body — transparent box */}
      <group onClick={handleElectrolysis}>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.55, 0.32, 0.35]} />
        <meshPhysicalMaterial
          color="#a0d0ff"
          transparent
          opacity={0.22}
          roughness={0.05}
          transmission={0.8}
        />
      </mesh>
      {/* Cell bottom/rim */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.58, 0.04, 0.38]} />
        <meshStandardMaterial color="#4a5540" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Electrolyte solution (blue fill) */}
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.52, 0.16, 0.32]} />
        <meshStandardMaterial
          color="#3399cc"
          transparent
          opacity={0.35}
          roughness={0.1}
        />
      </mesh>
      {/* Electrode rod — anode (left, dark) */}
      <mesh position={[-0.15, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.45, 10]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.7} />
      </mesh>
      {/* Electrode rod — cathode (right, silver) */}
      <mesh position={[0.15, 0.32, 0]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.45, 10]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.3} metalness={0.85} />
      </mesh>
      {/* Bubble indicators near anode */}
      {([0.04, 0.09, 0.14] as number[]).map((y, i) => (
        <mesh key={i} position={[-0.15 + i * 0.02, y + 0.2, 0.04]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
        </mesh>
      ))}
      </group>

      {/* ── Power supply box ── */}
      <Html position={[1.1, 0.5, 0.3]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>DC Power Supply</span>
      </Html>
      <group onClick={handlePowerSupply}>
      <mesh position={[1.1, 0.18, 0.3]} castShadow>
        <boxGeometry args={[0.38, 0.28, 0.28]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Power supply display */}
      <mesh position={[1.1, 0.22, 0.165]}>
        <boxGeometry args={[0.2, 0.1, 0.01]} />
        <meshStandardMaterial
          color={powerOn ? "#002200" : "#001100"}
          emissive={powerOn ? "#00ff66" : "#004422"}
          emissiveIntensity={powerOn ? 1.2 : 0.3}
          roughness={0.2}
        />
      </mesh>
      {/* Voltage/current dials */}
      {([-0.07, 0.07] as number[]).map((x, i) => (
        <mesh key={i} position={[1.1 + x, 0.1, 0.166]}>
          <cylinderGeometry args={[0.025, 0.025, 0.015, 12]} />
          <meshStandardMaterial color="#444444" roughness={0.4} metalness={0.6} />
        </mesh>
      ))}
      {/* Terminal posts on power supply */}
      <mesh position={[0.94, 0.28, 0.3]}>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
        <meshStandardMaterial color="#cc2200" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[1.04, 0.28, 0.3]}>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
        <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.5} />
      </mesh>
      </group>

      {/* ── Wire connections (thin cylinders) ── */}
      {/* Red wire from power supply to anode */}
      <mesh position={[0.47, 0.42, 0.15]} rotation={[0.1, -0.7, 0.3]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 1.05, 6]} />
        <meshStandardMaterial color="#cc2200" roughness={0.7} />
      </mesh>
      {/* Black wire from power supply to cathode */}
      <mesh position={[0.6, 0.42, 0.12]} rotation={[0.05, -0.5, 0.25]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.98, 6]} />
        <meshStandardMaterial color="#111111" roughness={0.7} />
      </mesh>

      {/* ── pH meter ── */}
      <Html position={[-1.0, 0.58, 0.4]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>pH Meter</span>
      </Html>
      <group onClick={handlePHMeter}>
      {/* Body */}
      <mesh position={[-1.0, 0.2, 0.4]} castShadow>
        <boxGeometry args={[0.22, 0.3, 0.14]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.5} />
      </mesh>
      {/* Screen */}
      <mesh position={[-1.0, 0.26, 0.33]}>
        <boxGeometry args={[0.14, 0.1, 0.01]} />
        <meshStandardMaterial
          color="#001122"
          emissive="#00aaff"
          emissiveIntensity={0.6}
          roughness={0.2}
        />
      </mesh>
      {/* pH probe */}
      <mesh position={[-1.0, 0.02, 0.33]} castShadow>
        <cylinderGeometry args={[0.008, 0.005, 0.35, 8]} />
        <meshStandardMaterial color="#888888" roughness={0.4} metalness={0.5} />
      </mesh>
      </group>

      {/* ── Burette on clamp stand ── */}
      <Html position={[-1.3, 0.95, -0.3]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Burette</span>
      </Html>
      {/* Stand vertical rod */}
      <mesh position={[-1.55, 0.5, -0.3]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.9, 8]} />
        <meshStandardMaterial color="#707070" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Stand base */}
      <mesh position={[-1.55, 0.07, -0.3]}>
        <boxGeometry args={[0.3, 0.04, 0.2]} />
        <meshStandardMaterial color="#606060" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Horizontal clamp arm */}
      <mesh position={[-1.43, 0.72, -0.3]}>
        <boxGeometry args={[0.22, 0.025, 0.025]} />
        <meshStandardMaterial color="#707070" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Burette tube */}
      <mesh position={[-1.3, 0.5, -0.3]} castShadow>
        <cylinderGeometry args={[0.018, 0.018, 0.7, 10]} />
        <meshPhysicalMaterial
          color="#c8e8ff"
          transparent
          opacity={0.28}
          roughness={0.05}
          transmission={0.78}
        />
      </mesh>
      {/* Burette tip */}
      <mesh position={[-1.3, 0.12, -0.3]}>
        <cylinderGeometry args={[0.006, 0.003, 0.1, 8]} />
        <meshPhysicalMaterial
          color="#c8e8ff"
          transparent
          opacity={0.3}
          roughness={0.05}
          transmission={0.78}
        />
      </mesh>
      {/* Liquid in burette */}
      <mesh position={[-1.3, 0.52, -0.3]}>
        <cylinderGeometry args={[0.014, 0.014, 0.55, 10]} />
        <meshStandardMaterial color="#cc8844" transparent opacity={0.6} roughness={0.1} />
      </mesh>

      {/* Reference electrode beaker on shelf */}
      <mesh position={[0.5, 0.42, -1.07]}>
        <cylinderGeometry args={[0.055, 0.06, 0.14, 12]} />
        <meshPhysicalMaterial
          color="#c8e8ff"
          transparent
          opacity={0.3}
          roughness={0.05}
          transmission={0.78}
        />
      </mesh>
    </StationShell>
  );
}
