import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import StationShell, { LABEL_STYLE } from "./StationShell";
import { useStationTool } from "./useStationTool";
import InteractiveTool from "./InteractiveTool";

export default function InstrumentRoom() {
  const { selectedItem, selectedBenchItem, updateBenchItemContents, openStructureViewer, setActiveRightTab, showNotification } = useStationTool();

  const handleMassSpec = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || selectedItem.contents.length === 0) {
      showNotification("Select a container with contents first");
      return;
    }
    const formula = selectedItem.contents[0].formula;
    openStructureViewer(formula);
    setActiveRightTab("spectra");
    showNotification(`Mass spectrum analysis of ${formula}`);
  };

  const handleHPLC = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || selectedItem.contents.length === 0) {
      showNotification("Select a container with contents first");
      return;
    }
    const formula = selectedItem.contents[0].formula;
    openStructureViewer(formula);
    setActiveRightTab("spectra");
    showNotification(`HPLC chromatogram of ${formula}`);
  };

  const handleUVVis = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || selectedItem.contents.length === 0) {
      showNotification("Select a container with contents first");
      return;
    }
    const formula = selectedItem.contents[0].formula;
    openStructureViewer(formula);
    setActiveRightTab("spectra");
    showNotification(`UV-Vis spectrum of ${formula}`);
  };

  const handleNMR = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || selectedItem.contents.length === 0) {
      showNotification("Select a container with contents first");
      return;
    }
    const formula = selectedItem.contents[0].formula;
    showNotification(`NMR spectrum -- analyzing ${formula} (coming soon)`);
  };

  const handleCentrifuge = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    if (selectedItem.contents.length === 0) {
      showNotification("Container is empty");
      return;
    }
    const solids = selectedItem.contents.filter((s) => s.phase === "s");
    const others = selectedItem.contents.filter((s) => s.phase !== "s");
    if (solids.length === 0) {
      showNotification("No solids to separate -- centrifuge had no effect");
      return;
    }
    // Move solids to end (bottom) of contents array, mark as precipitated
    updateBenchItemContents(selectedBenchItem, [...others, ...solids]);
    showNotification(`Centrifuged -- separated ${solids.map((s) => s.formula).join(", ")} from liquid`);
  };

  const handleMicroscope = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || selectedItem.contents.length === 0) {
      showNotification("Select a container with contents first");
      return;
    }
    const solids = selectedItem.contents.filter((s) => s.phase === "s");
    if (solids.length === 0) {
      showNotification("No solid crystals to examine");
      return;
    }
    const crystal = solids[0];
    const crystalInfo: Record<string, string> = {
      NaCl: "Cubic (halite) -- face-centered cubic lattice",
      KCl: "Cubic (sylvite) -- face-centered cubic lattice",
      CuSO4: "Triclinic -- blue vitriol crystals",
      Fe: "Body-centered cubic (BCC) -- metallic",
      Cu: "Face-centered cubic (FCC) -- metallic copper",
      Al: "Face-centered cubic (FCC) -- metallic aluminum",
      Zn: "Hexagonal close-packed (HCP) -- metallic zinc",
      Na: "Body-centered cubic (BCC) -- soft metal",
      I2: "Orthorhombic -- purple-black crystals",
      K: "Body-centered cubic (BCC) -- soft metal",
    };
    const info = crystalInfo[crystal.formula] ?? "Crystal structure data not available";
    showNotification(`Microscope: ${crystal.formula} -- ${info}`);
  };

  return (
    <StationShell wallColor="#2d3142" showShelf={false}>
      {/* Long counter along back wall */}
      <mesh position={[0, 0.06, -1.0]} receiveShadow castShadow>
        <boxGeometry args={[3.8, 0.08, 0.7]} />
        <meshStandardMaterial color="#1e2235" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Counter front edge trim */}
      <mesh position={[0, 0.06, -0.65]}>
        <boxGeometry args={[3.8, 0.08, 0.04]} />
        <meshStandardMaterial color="#2a2f4a" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Instrument 1: Mass spectrometer (large box, left) */}
      <InteractiveTool
        name="Mass Spectrometer"
        description="Click to analyze mass spectrum of selected substance"
        onClick={handleMassSpec}
        labelOffset={[0, 0.35, 0]}
      >
        <mesh position={[-1.4, 0.28, -0.95]} castShadow>
          <boxGeometry args={[0.7, 0.4, 0.5]} />
          <meshStandardMaterial color="#252a3d" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* Screen on instrument 1 */}
        <mesh position={[-1.4, 0.35, -0.69]}>
          <boxGeometry args={[0.4, 0.2, 0.01]} />
          <meshStandardMaterial
            color="#001a33"
            emissive="#0066cc"
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>
        {/* Scan line on screen */}
        <mesh position={[-1.4, 0.37, -0.688]}>
          <boxGeometry args={[0.35, 0.01, 0.005]} />
          <meshStandardMaterial
            color="#00aaff"
            emissive="#00aaff"
            emissiveIntensity={1.2}
          />
        </mesh>
        {/* Instrument 1 sample port */}
        <mesh position={[-1.05, 0.28, -0.95]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.08, 10]} />
          <meshStandardMaterial color="#444455" metalness={0.8} roughness={0.2} />
        </mesh>
      </InteractiveTool>

      {/* Instrument 2: HPLC / chromatograph (medium, center-left) */}
      <InteractiveTool
        name="HPLC"
        description="Click to run chromatography on selected substance"
        onClick={handleHPLC}
        labelOffset={[0, 0.3, 0]}
      >
        <mesh position={[-0.4, 0.22, -0.97]} castShadow>
          <boxGeometry args={[0.55, 0.28, 0.45]} />
          <meshStandardMaterial color="#1e2840" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Screen */}
        <mesh position={[-0.4, 0.28, -0.74]}>
          <boxGeometry args={[0.28, 0.14, 0.01]} />
          <meshStandardMaterial
            color="#001100"
            emissive="#00cc44"
            emissiveIntensity={0.5}
            roughness={0.2}
          />
        </mesh>
        {/* Small knobs row */}
        {([-0.55, -0.4, -0.25] as number[]).map((x, i) => (
          <mesh key={i} position={[x, 0.13, -0.745]}>
            <cylinderGeometry args={[0.018, 0.018, 0.02, 8]} />
            <meshStandardMaterial color="#334466" metalness={0.6} roughness={0.4} />
          </mesh>
        ))}
      </InteractiveTool>

      {/* Instrument 3: UV/Vis spectrophotometer (medium, center-right) */}
      <InteractiveTool
        name="UV-Vis Spectrophotometer"
        description="Click to measure UV-Vis spectrum"
        onClick={handleUVVis}
        labelOffset={[0, 0.3, 0]}
      >
        <mesh position={[0.55, 0.2, -0.97]} castShadow>
          <boxGeometry args={[0.5, 0.24, 0.42]} />
          <meshStandardMaterial color="#22273d" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Lid/sample compartment */}
        <mesh position={[0.55, 0.25, -0.84]}>
          <boxGeometry args={[0.22, 0.06, 0.18]} />
          <meshStandardMaterial color="#1a1f35" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* Screen */}
        <mesh position={[0.8, 0.22, -0.745]}>
          <boxGeometry args={[0.12, 0.1, 0.01]} />
          <meshStandardMaterial
            color="#110011"
            emissive="#cc44ff"
            emissiveIntensity={0.4}
            roughness={0.2}
          />
        </mesh>
      </InteractiveTool>

      {/* Instrument 4: NMR / large analyzer (right, tall) */}
      <InteractiveTool
        name="NMR Spectrometer"
        description="Click to analyze NMR spectrum (coming soon)"
        onClick={handleNMR}
        labelOffset={[0, 0.4, 0]}
      >
        <mesh position={[1.45, 0.35, -0.93]} castShadow>
          <boxGeometry args={[0.55, 0.55, 0.5]} />
          <meshStandardMaterial color="#1c2035" roughness={0.45} metalness={0.35} />
        </mesh>
        {/* Circular display / port */}
        <mesh position={[1.45, 0.38, -0.675]}>
          <cylinderGeometry args={[0.1, 0.1, 0.015, 24]} />
          <meshStandardMaterial
            color="#000811"
            emissive="#ff8800"
            emissiveIntensity={0.45}
            roughness={0.15}
          />
        </mesh>
        {/* Status LEDs */}
        {([0, 1, 2] as number[]).map((i) => (
          <mesh key={i} position={[1.18, 0.52 - i * 0.08, -0.675]}>
            <boxGeometry args={[0.02, 0.015, 0.01]} />
            <meshStandardMaterial
              color="#00ff44"
              emissive="#00ff44"
              emissiveIntensity={1.5}
            />
          </mesh>
        ))}
      </InteractiveTool>

      {/* Computer workstation */}
      <Html position={[0.05, 0.72, 0.6]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Data Workstation</span>
      </Html>
      {/* Monitor stand */}
      <mesh position={[0.05, 0.2, 0.6]} castShadow>
        <boxGeometry args={[0.06, 0.35, 0.06]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.6} />
      </mesh>
      {/* Monitor base */}
      <mesh position={[0.05, 0.04, 0.6]}>
        <boxGeometry args={[0.28, 0.03, 0.18]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.6} />
      </mesh>
      {/* Monitor screen */}
      <mesh position={[0.05, 0.42, 0.6]} castShadow>
        <boxGeometry args={[0.55, 0.33, 0.03]} />
        <meshStandardMaterial color="#111122" roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Screen display */}
      <mesh position={[0.05, 0.42, 0.585]}>
        <boxGeometry args={[0.49, 0.27, 0.005]} />
        <meshStandardMaterial
          color="#001122"
          emissive="#2255aa"
          emissiveIntensity={0.5}
          roughness={0.1}
        />
      </mesh>
      {/* Keyboard */}
      <mesh position={[0.05, 0.08, 0.95]}>
        <boxGeometry args={[0.4, 0.015, 0.14]} />
        <meshStandardMaterial color="#1e1e2e" roughness={0.7} />
      </mesh>
      {/* Mouse */}
      <mesh position={[0.38, 0.08, 0.95]}>
        <boxGeometry args={[0.07, 0.018, 0.1]} />
        <meshStandardMaterial color="#1e1e2e" roughness={0.7} />
      </mesh>

      {/* Cable tray under counter */}
      <mesh position={[0, -0.02, -0.9]}>
        <boxGeometry args={[3.5, 0.03, 0.1]} />
        <meshStandardMaterial color="#161b2e" roughness={0.8} />
      </mesh>

      {/* Analytical balance (enclosed glass case) */}
      <group position={[-1.4, 0.1, 0.2]}>
        {/* Base */}
        <mesh castShadow>
          <boxGeometry args={[0.38, 0.06, 0.3]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* Glass housing */}
        <mesh position={[0, 0.09, 0]}>
          <boxGeometry args={[0.36, 0.12, 0.28]} />
          <meshPhysicalMaterial color="#a8c8ff" transparent opacity={0.12} roughness={0.05} transmission={0.88} />
        </mesh>
        {/* Glass frame sides */}
        <mesh position={[-0.18, 0.09, 0]}>
          <boxGeometry args={[0.01, 0.12, 0.28]} />
          <meshStandardMaterial color="#2a3050" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0.18, 0.09, 0]}>
          <boxGeometry args={[0.01, 0.12, 0.28]} />
          <meshStandardMaterial color="#2a3050" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Balance pan */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.065, 0.065, 0.008, 16]} />
          <meshStandardMaterial color="#cccccc" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Display */}
        <mesh position={[0.12, 0.14, -0.14]}>
          <boxGeometry args={[0.1, 0.035, 0.005]} />
          <meshStandardMaterial color="#001100" emissive="#00ff44" emissiveIntensity={0.8} roughness={0.2} />
        </mesh>
      </group>
      <Html position={[-1.4, 0.32, 0.2]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Analytical Balance</span>
      </Html>

      {/* pH meter with probe */}
      <group position={[-0.4, 0.08, 0.35]}>
        {/* Meter body */}
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.2, 0.06]} />
          <meshStandardMaterial color="#e8e0d0" roughness={0.5} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0.04, 0.031]}>
          <boxGeometry args={[0.07, 0.08, 0.005]} />
          <meshStandardMaterial color="#001122" emissive="#00aaff" emissiveIntensity={0.7} roughness={0.2} />
        </mesh>
        {/* Buttons */}
        {([-0.025, 0.025] as number[]).map((x, i) => (
          <mesh key={i} position={[x, -0.06, 0.031]}>
            <boxGeometry args={[0.025, 0.018, 0.005]} />
            <meshStandardMaterial color="#3344aa" roughness={0.5} />
          </mesh>
        ))}
        {/* Probe cable */}
        <mesh position={[0, 0.1, 0]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.14, 6]} />
          <meshStandardMaterial color="#333333" roughness={0.7} />
        </mesh>
        {/* Probe tip */}
        <mesh position={[0, 0.2, 0.025]}>
          <cylinderGeometry args={[0.007, 0.004, 0.1, 8]} />
          <meshStandardMaterial color="#888888" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Probe bulb */}
        <mesh position={[0, 0.245, 0.025]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshStandardMaterial color="#aacccc" metalness={0.3} roughness={0.3} />
        </mesh>
      </group>
      <Html position={[-0.4, 0.42, 0.35]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>pH Meter</span>
      </Html>

      {/* Centrifuge -- now interactive */}
      <InteractiveTool
        name="Centrifuge"
        description="Click to centrifuge -- separates solids from liquids"
        onClick={handleCentrifuge}
        position={[0.55, 0.1, 0.25]}
        labelOffset={[0, 0.4, 0]}
      >
        {/* Body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.14, 0.16, 0.22, 20]} />
          <meshStandardMaterial color="#ddd8d0" roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Lid */}
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.13, 0.14, 0.06, 20]} />
          <meshStandardMaterial color="#ccccc8" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Lid hinge */}
        <mesh position={[-0.1, 0.14, 0.0]}>
          <boxGeometry args={[0.04, 0.02, 0.025]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Control panel front */}
        <mesh position={[0, -0.04, 0.16]}>
          <boxGeometry args={[0.14, 0.05, 0.01]} />
          <meshStandardMaterial color="#222230" roughness={0.4} />
        </mesh>
        {/* RPM display */}
        <mesh position={[0, -0.03, 0.166]}>
          <boxGeometry args={[0.07, 0.025, 0.005]} />
          <meshStandardMaterial color="#001100" emissive="#00ee44" emissiveIntensity={0.6} roughness={0.2} />
        </mesh>
        {/* Start button */}
        <mesh position={[0.05, -0.055, 0.161]}>
          <cylinderGeometry args={[0.01, 0.01, 0.01, 8]} />
          <meshStandardMaterial color="#44cc44" emissive="#22aa22" emissiveIntensity={0.4} roughness={0.4} />
        </mesh>
      </InteractiveTool>

      {/* Microscope -- now interactive */}
      <InteractiveTool
        name="Microscope"
        description="Click to examine crystal structure of solid"
        onClick={handleMicroscope}
        position={[1.45, 0.06, 0.3]}
        labelOffset={[0, 0.7, 0]}
      >
        {/* Heavy base */}
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.04, 0.2]} />
          <meshStandardMaterial color="#222228" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* Arm pillar */}
        <mesh position={[-0.05, 0.22, 0]}>
          <boxGeometry args={[0.04, 0.4, 0.04]} />
          <meshStandardMaterial color="#222228" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* Stage platform */}
        <mesh position={[0.02, 0.2, 0]}>
          <boxGeometry args={[0.14, 0.02, 0.12]} />
          <meshStandardMaterial color="#333338" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* Objective turret */}
        <mesh position={[0.0, 0.36, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.05, 10]} />
          <meshStandardMaterial color="#444448" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Objectives (3 lenses) */}
        {([0, Math.PI * 0.66, Math.PI * 1.33] as number[]).map((angle, i) => (
          <mesh key={i} position={[0.025 * Math.cos(angle), 0.3, 0.025 * Math.sin(angle)]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.007, 0.01, 0.06, 8]} />
            <meshStandardMaterial color="#111118" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        {/* Binocular head */}
        <mesh position={[-0.01, 0.46, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.06]} />
          <meshStandardMaterial color="#333338" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* Eyepiece tubes */}
        <mesh position={[-0.02, 0.52, 0.025]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.07, 8]} />
          <meshStandardMaterial color="#222228" roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh position={[0.02, 0.52, 0.025]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.07, 8]} />
          <meshStandardMaterial color="#222228" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* Focus knob */}
        <mesh position={[-0.065, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 12]} />
          <meshStandardMaterial color="#555558" metalness={0.5} roughness={0.3} />
        </mesh>
      </InteractiveTool>

      {/* Vortex mixer */}
      <group position={[1.05, 0.08, 0.55]}>
        {/* Body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.14, 16]} />
          <meshStandardMaterial color="#cc6600" roughness={0.5} metalness={0.1} />
        </mesh>
        {/* Rubber cup on top */}
        <mesh position={[0, 0.09, 0]}>
          <coneGeometry args={[0.045, 0.06, 14]} />
          <meshStandardMaterial color="#222222" roughness={0.8} />
        </mesh>
        {/* On/off switch on side */}
        <mesh position={[0.075, 0.0, 0]}>
          <boxGeometry args={[0.01, 0.03, 0.03]} />
          <meshStandardMaterial color="#111111" roughness={0.5} />
        </mesh>
        {/* Speed dial */}
        <mesh position={[0, -0.04, 0.08]}>
          <cylinderGeometry args={[0.015, 0.015, 0.015, 10]} />
          <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.4} />
        </mesh>
      </group>
      <Html position={[1.05, 0.35, 0.55]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Vortex Mixer</span>
      </Html>

      {/* Small printer next to each major instrument */}
      <group position={[-1.4, 0.06, 0.55]}>
        <mesh castShadow>
          <boxGeometry args={[0.24, 0.1, 0.18]} />
          <meshStandardMaterial color="#d8d4cc" roughness={0.5} />
        </mesh>
        {/* Paper slot */}
        <mesh position={[0, 0.04, -0.09]}>
          <boxGeometry args={[0.18, 0.015, 0.005]} />
          <meshStandardMaterial color="#aaaaaa" roughness={0.6} />
        </mesh>
        {/* Status LED */}
        <mesh position={[0.09, 0.052, 0.09]}>
          <sphereGeometry args={[0.006, 6, 6]} />
          <meshStandardMaterial color="#00ff44" emissive="#00ff44" emissiveIntensity={1.0} />
        </mesh>
      </group>

      {/* Sample preparation area (cutting board surface) */}
      <group position={[-0.8, 0.08, 0.7]}>
        {/* Prep board */}
        <mesh castShadow>
          <boxGeometry args={[0.3, 0.02, 0.2]} />
          <meshStandardMaterial color="#e8dcc8" roughness={0.8} />
        </mesh>
        {/* Edge trim */}
        <mesh position={[0, 0.0, -0.1]}>
          <boxGeometry args={[0.3, 0.02, 0.01]} />
          <meshStandardMaterial color="#c0b090" roughness={0.7} />
        </mesh>
        {/* Razor blade */}
        <mesh position={[0.08, 0.02, 0.04]} rotation={[-Math.PI / 2, 0, 0.3]}>
          <boxGeometry args={[0.04, 0.08, 0.002]} />
          <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Mortar (small bowl) */}
        <mesh position={[-0.08, 0.04, 0.02]}>
          <cylinderGeometry args={[0.03, 0.035, 0.05, 12]} />
          <meshStandardMaterial color="#a09888" roughness={0.7} />
        </mesh>
        {/* Pestle */}
        <mesh position={[-0.06, 0.07, 0.02]} rotation={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.006, 0.01, 0.08, 8]} />
          <meshStandardMaterial color="#b0a898" roughness={0.6} />
        </mesh>
      </group>
      <Html position={[-0.8, 0.22, 0.7]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Sample Prep</span>
      </Html>

      {/* Reagent bottles on counter */}
      <group position={[1.5, 0.1, -0.7]}>
        {([[-0.08, "#4488cc"], [0, "#cc6644"], [0.08, "#44aa66"]] as [number, string][]).map(([x, color], i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.022, 0.025, 0.1, 10]} />
              <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
            </mesh>
            {/* Cap */}
            <mesh position={[0, 0.058, 0]}>
              <cylinderGeometry args={[0.016, 0.02, 0.02, 8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
            {/* Label */}
            <mesh position={[0, -0.01, 0.026]}>
              <boxGeometry args={[0.025, 0.03, 0.002]} />
              <meshStandardMaterial color="#ffffff" roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
      <Html position={[1.5, 0.28, -0.7]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Reagents</span>
      </Html>
    </StationShell>
  );
}
