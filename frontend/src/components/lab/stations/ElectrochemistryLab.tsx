import { useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import StationShell, { LABEL_STYLE } from "./StationShell";
import { useStationTool } from "./useStationTool";
import InteractiveTool from "./InteractiveTool";

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

// Standard reduction potentials (V) for common metals
const REDUCTION_POTENTIALS: Record<string, number> = {
  Li: -3.04, K: -2.93, Ca: -2.87, Na: -2.71, Mg: -2.37, Al: -1.66,
  Zn: -0.76, Fe: -0.44, Ni: -0.26, Sn: -0.14, Pb: -0.13, H2: 0.0,
  Cu: 0.34, Ag: 0.80, Pt: 1.20, Au: 1.50,
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

  const handleVoltmeter = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container with metal electrodes first");
      return;
    }
    // Look for metal contents to form a galvanic pair
    const metals = selectedItem.contents.filter(
      (s) => s.phase === "s" && REDUCTION_POTENTIALS[s.formula] !== undefined
    );
    if (metals.length >= 2) {
      const e1 = REDUCTION_POTENTIALS[metals[0].formula];
      const e2 = REDUCTION_POTENTIALS[metals[1].formula];
      const voltage = Math.abs(e1 - e2);
      showNotification(
        `Voltmeter: ${metals[0].formula} / ${metals[1].formula} -- E\u00B0cell = ${voltage.toFixed(2)} V`
      );
    } else if (metals.length === 1) {
      const e1 = REDUCTION_POTENTIALS[metals[0].formula];
      showNotification(
        `Voltmeter: ${metals[0].formula} vs SHE -- E\u00B0 = ${e1.toFixed(2)} V`
      );
    } else {
      showNotification("Voltmeter: No metal electrodes found -- 0.00 V");
    }
  };

  return (
    <StationShell wallColor="#2a3028">
      {/* Electrolysis cell (central) */}
      <InteractiveTool
        name="Electrolysis Cell"
        description="Click to electrolyze ionic solution"
        onClick={handleElectrolysis}
        labelOffset={[0, 0.6, 0]}
      >
        {/* Cell body -- transparent box */}
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
        {/* Electrode rod -- anode (left, dark) */}
        <mesh position={[-0.15, 0.32, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.45, 10]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} metalness={0.7} />
        </mesh>
        {/* Electrode rod -- cathode (right, silver) */}
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
      </InteractiveTool>

      {/* Power supply box */}
      <InteractiveTool
        name="DC Power Supply"
        description="Click to toggle power on/off"
        onClick={handlePowerSupply}
        position={[1.1, 0, 0.3]}
        labelOffset={[0, 0.5, 0]}
      >
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[0.38, 0.28, 0.28]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Power supply display */}
        <mesh position={[0, 0.22, -0.135]}>
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
          <mesh key={i} position={[x, 0.1, -0.134]}>
            <cylinderGeometry args={[0.025, 0.025, 0.015, 12]} />
            <meshStandardMaterial color="#444444" roughness={0.4} metalness={0.6} />
          </mesh>
        ))}
        {/* Terminal posts on power supply */}
        <mesh position={[-0.16, 0.28, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
          <meshStandardMaterial color="#cc2200" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[-0.06, 0.28, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
          <meshStandardMaterial color="#111111" roughness={0.3} metalness={0.5} />
        </mesh>
      </InteractiveTool>

      {/* Wire connections (thin cylinders) */}
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

      {/* pH meter */}
      <InteractiveTool
        name="pH Meter"
        description="Click to measure pH of selected solution"
        onClick={handlePHMeter}
        position={[-1.0, 0, 0.4]}
        labelOffset={[0, 0.65, 0]}
      >
        {/* Body */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.22, 0.3, 0.14]} />
          <meshStandardMaterial color="#e8e0d0" roughness={0.5} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0.26, -0.07]}>
          <boxGeometry args={[0.14, 0.1, 0.01]} />
          <meshStandardMaterial
            color="#001122"
            emissive="#00aaff"
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>
        {/* pH probe */}
        <mesh position={[0, 0.02, -0.07]} castShadow>
          <cylinderGeometry args={[0.008, 0.005, 0.35, 8]} />
          <meshStandardMaterial color="#888888" roughness={0.4} metalness={0.5} />
        </mesh>
      </InteractiveTool>

      {/* Burette on clamp stand */}
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

      {/* Galvanic cell setup -- two beakers + salt bridge */}
      {/* Left half-cell beaker */}
      <group position={[-0.6, 0.06, 0.65]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.065, 0.07, 0.16, 14]} />
          <meshPhysicalMaterial color="#c8e8ff" transparent opacity={0.28} roughness={0.05} transmission={0.78} />
        </mesh>
        {/* Solution (ZnSO4 -- blue-ish) */}
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.058, 0.062, 0.1, 14]} />
          <meshStandardMaterial color="#aaccee" transparent opacity={0.5} roughness={0.1} />
        </mesh>
        {/* Zinc working electrode rod */}
        <mesh position={[0.02, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.22, 8]} />
          <meshStandardMaterial color="#9999aa" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Label strip */}
        <mesh position={[0, -0.02, 0.068]}>
          <boxGeometry args={[0.06, 0.06, 0.002]} />
          <meshStandardMaterial color="#eedd88" roughness={0.8} />
        </mesh>
      </group>

      {/* Right half-cell beaker */}
      <group position={[0.1, 0.06, 0.65]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.065, 0.07, 0.16, 14]} />
          <meshPhysicalMaterial color="#c8e8ff" transparent opacity={0.28} roughness={0.05} transmission={0.78} />
        </mesh>
        {/* Solution (CuSO4 -- blue) */}
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.058, 0.062, 0.1, 14]} />
          <meshStandardMaterial color="#2255cc" transparent opacity={0.45} roughness={0.1} />
        </mesh>
        {/* Copper working electrode */}
        <mesh position={[-0.02, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.009, 0.009, 0.22, 8]} />
          <meshStandardMaterial color="#cc6633" roughness={0.3} metalness={0.7} />
        </mesh>
        {/* Label strip */}
        <mesh position={[0, -0.02, 0.068]}>
          <boxGeometry args={[0.06, 0.06, 0.002]} />
          <meshStandardMaterial color="#88ccee" roughness={0.8} />
        </mesh>
      </group>

      {/* Salt bridge -- U-tube over both beakers */}
      {/* Left arm */}
      <mesh position={[-0.54, 0.28, 0.65]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.22, 8]} />
        <meshPhysicalMaterial color="#ffe8aa" transparent opacity={0.5} roughness={0.05} transmission={0.6} />
      </mesh>
      {/* Bridge top horizontal */}
      <mesh position={[-0.25, 0.34, 0.55]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.009, 0.009, 0.62, 8]} />
        <meshPhysicalMaterial color="#ffe8aa" transparent opacity={0.5} roughness={0.05} transmission={0.6} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.04, 0.28, 0.65]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 0.22, 8]} />
        <meshPhysicalMaterial color="#ffe8aa" transparent opacity={0.5} roughness={0.05} transmission={0.6} />
      </mesh>
      {/* Salt bridge fill */}
      <mesh position={[-0.25, 0.334, 0.555]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.006, 0.006, 0.58, 8]} />
        <meshStandardMaterial color="#ffee88" transparent opacity={0.55} roughness={0.1} />
      </mesh>
      <Html position={[-0.25, 0.52, 0.55]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Galvanic Cell + Salt Bridge</span>
      </Html>

      {/* Voltmeter -- now interactive */}
      <InteractiveTool
        name="Voltmeter"
        description="Click to read voltage between electrodes"
        onClick={handleVoltmeter}
        position={[-0.25, 0.12, 0.95]}
        labelOffset={[0, 0.3, 0]}
      >
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.14, 0.1]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* Display */}
        <mesh position={[0, 0.02, 0.051]}>
          <boxGeometry args={[0.12, 0.07, 0.005]} />
          <meshStandardMaterial color="#001100" emissive="#00ff66" emissiveIntensity={1.0} roughness={0.2} />
        </mesh>
        {/* Label */}
        <mesh position={[0, -0.04, 0.051]}>
          <boxGeometry args={[0.1, 0.02, 0.003]} />
          <meshStandardMaterial color="#444444" roughness={0.7} />
        </mesh>
        {/* Terminal posts */}
        <mesh position={[-0.04, 0.065, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.025, 8]} />
          <meshStandardMaterial color="#cc2200" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0.04, 0.065, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.025, 8]} />
          <meshStandardMaterial color="#111111" metalness={0.5} roughness={0.3} />
        </mesh>
      </InteractiveTool>

      {/* Ammeter */}
      <group position={[0.3, 0.12, 0.95]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.13, 0.09]} />
          <meshStandardMaterial color="#2a2222" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* Display */}
        <mesh position={[0, 0.02, 0.046]}>
          <boxGeometry args={[0.1, 0.06, 0.005]} />
          <meshStandardMaterial color="#110011" emissive="#ff8800" emissiveIntensity={0.9} roughness={0.2} />
        </mesh>
        {/* Terminals */}
        <mesh position={[-0.035, 0.06, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.025, 8]} />
          <meshStandardMaterial color="#cc2200" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0.035, 0.06, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.025, 8]} />
          <meshStandardMaterial color="#111111" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
      <Html position={[0.3, 0.36, 0.95]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Ammeter</span>
      </Html>

      {/* Alligator clip wires connecting instruments to galvanic cell */}
      {/* Red wire from voltmeter to Zn electrode */}
      <mesh position={[-0.44, 0.28, 0.78]} rotation={[0.4, 0.3, 0.1]}>
        <cylinderGeometry args={[0.005, 0.005, 0.36, 6]} />
        <meshStandardMaterial color="#cc2200" roughness={0.7} />
      </mesh>
      {/* Black wire from voltmeter to Cu electrode */}
      <mesh position={[-0.1, 0.28, 0.8]} rotation={[0.4, -0.3, -0.1]}>
        <cylinderGeometry args={[0.005, 0.005, 0.32, 6]} />
        <meshStandardMaterial color="#111111" roughness={0.7} />
      </mesh>
      {/* Alligator clip (red) -- small flattened cylinder */}
      <mesh position={[-0.56, 0.22, 0.68]} rotation={[0, 0.3, 0.2]}>
        <boxGeometry args={[0.025, 0.01, 0.01]} />
        <meshStandardMaterial color="#cc2200" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Alligator clip (black) */}
      <mesh position={[0.08, 0.22, 0.68]} rotation={[0, -0.3, -0.2]}>
        <boxGeometry args={[0.025, 0.01, 0.01]} />
        <meshStandardMaterial color="#111111" roughness={0.4} metalness={0.4} />
      </mesh>

      {/* Electrode holder/stand for reference electrode */}
      <group position={[0.5, 0.06, -1.07]}>
        {/* Stand vertical rod */}
        <mesh position={[0.08, 0.25, 0]}>
          <cylinderGeometry args={[0.008, 0.008, 0.4, 8]} />
          <meshStandardMaterial color="#888890" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Stand base */}
        <mesh>
          <boxGeometry args={[0.2, 0.03, 0.12]} />
          <meshStandardMaterial color="#707078" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Clamp arm holding ref electrode */}
        <mesh position={[0.04, 0.36, 0]}>
          <boxGeometry args={[0.1, 0.014, 0.014]} />
          <meshStandardMaterial color="#888890" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Reference electrode glass tube */}
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.28, 10]} />
          <meshPhysicalMaterial color="#c8e8ff" transparent opacity={0.35} roughness={0.05} transmission={0.75} />
        </mesh>
        {/* Ag/AgCl wire inside ref electrode */}
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.22, 6]} />
          <meshStandardMaterial color="#cccccc" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Solution in reference electrode */}
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.009, 0.009, 0.18, 10]} />
          <meshStandardMaterial color="#cceeaa" transparent opacity={0.5} roughness={0.1} />
        </mesh>
      </group>
      <Html position={[0.5, 0.62, -1.07]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Reference Electrode</span>
      </Html>

      {/* Electrode cleaning solution bottle */}
      <group position={[1.4, 0.06, -0.8]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.035, 0.04, 0.14, 12]} />
          <meshStandardMaterial color="#336699" roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Cap */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.025, 0.03, 0.03, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        {/* Label */}
        <mesh position={[0, -0.01, 0.041]}>
          <boxGeometry args={[0.04, 0.05, 0.002]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
        {/* Label text strip */}
        <mesh position={[0, -0.01, 0.043]}>
          <boxGeometry args={[0.03, 0.01, 0.002]} />
          <meshStandardMaterial color="#336699" roughness={0.7} />
        </mesh>
      </group>
      <Html position={[1.4, 0.28, -0.8]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Electrode Cleaner</span>
      </Html>

      {/* Magnetic stirrer on bench */}
      <group position={[1.4, 0.06, 0.7]}>
        {/* Stirrer base */}
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.06, 0.18]} />
          <meshStandardMaterial color="#e8e0d0" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Top plate */}
        <mesh position={[0, 0.035, 0]}>
          <boxGeometry args={[0.2, 0.01, 0.16]} />
          <meshStandardMaterial color="#cccccc" metalness={0.4} roughness={0.3} />
        </mesh>
        {/* Speed dial */}
        <mesh position={[0.08, 0.02, -0.09]}>
          <cylinderGeometry args={[0.018, 0.018, 0.015, 10]} />
          <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Indicator LED */}
        <mesh position={[-0.08, 0.035, -0.085]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshStandardMaterial color="#00ff44" emissive="#00ff44" emissiveIntensity={1.0} />
        </mesh>
        {/* Stir bar on plate */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0.5]}>
          <cylinderGeometry args={[0.004, 0.004, 0.04, 6]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
      </group>
      <Html position={[1.4, 0.22, 0.7]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Magnetic Stirrer</span>
      </Html>
    </StationShell>
  );
}
