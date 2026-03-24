import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import StationShell, { LABEL_STYLE } from "./StationShell";
import { useStationTool } from "./useStationTool";
import InteractiveTool from "./InteractiveTool";

// Simple SDS safety data
const SDS_DATA: Record<string, { hazard: string; ghs: string; firstAid: string }> = {
  HCl: { hazard: "Corrosive, toxic", ghs: "GHS05/GHS07", firstAid: "Flush with water, seek medical attention" },
  NaOH: { hazard: "Corrosive", ghs: "GHS05", firstAid: "Flush with water for 15 min" },
  H2SO4: { hazard: "Corrosive, oxidizer", ghs: "GHS05/GHS03", firstAid: "Flush with water, do NOT induce vomiting" },
  HNO3: { hazard: "Corrosive, oxidizer", ghs: "GHS05/GHS03", firstAid: "Flush with water, seek medical attention" },
  NaCl: { hazard: "Low hazard", ghs: "None", firstAid: "Rinse with water" },
  "CuSO4": { hazard: "Harmful, irritant", ghs: "GHS07/GHS09", firstAid: "Wash skin, flush eyes" },
  "CH3COOH": { hazard: "Corrosive, flammable", ghs: "GHS02/GHS05", firstAid: "Flush with water" },
  "C2H5OH": { hazard: "Flammable", ghs: "GHS02", firstAid: "Move to fresh air" },
  NH3: { hazard: "Corrosive, toxic gas", ghs: "GHS05/GHS06", firstAid: "Move to fresh air, flush eyes" },
  H2O: { hazard: "No significant hazard", ghs: "None", firstAid: "N/A" },
};

export default function StorageSafety() {
  const { selectedItem, showNotification, resetAllDamage, clearAllEffects } = useStationTool();

  const handleSafetyShower = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    resetAllDamage();
    showNotification("Emergency shower activated -- all containers cleaned");
  };

  const handleEyeWash = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    resetAllDamage();
    showNotification("Eye wash station activated -- all containers reset");
  };

  const handleFireExtinguisher = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    clearAllEffects();
    showNotification("Fire extinguisher deployed -- all effects cleared");
  };

  const handleSDSTerminal = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || selectedItem.contents.length === 0) {
      showNotification("Select a container with a substance to look up SDS data");
      return;
    }
    const formula = selectedItem.contents[0].formula;
    const sds = SDS_DATA[formula];
    if (sds) {
      showNotification(`SDS: ${formula} -- Hazard: ${sds.hazard} | GHS: ${sds.ghs} | First Aid: ${sds.firstAid}`);
    } else {
      showNotification(`SDS: ${formula} -- No data on file. Treat as unknown hazard.`);
    }
  };

  const handleChemicalCabinet = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    showNotification("Chemical Cabinet -- Use the Lab tab to add substances from inventory");
  };

  const handleFirstAidKit = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    showNotification("First Aid: 1) Burns: cool with water 15 min. 2) Spills on skin: rinse immediately. 3) Ingestion: do NOT induce vomiting, call poison control. 4) Eye contact: flush 15 min.");
  };

  const handleAcidCabinet = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    showNotification("Acid Cabinet: HCl, H2SO4, HNO3, H3PO4, HF, CH3COOH, C6H8O7 -- Use Lab tab to add to containers");
  };

  const handleFlammableCabinet = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    showNotification("Flammable Cabinet: C2H5OH (ethanol), CH3OH (methanol), C3H8O (isopropanol), C6H6 (benzene), CH3COCH3 (acetone)");
  };

  return (
    <StationShell wallColor="#2a2820" showShelf={false}>
      {/* Chemical storage cabinet */}
      <InteractiveTool
        name="Chemical Cabinet"
        description="Click to browse available substances"
        onClick={handleChemicalCabinet}
        position={[-1.55, 0, -0.85]}
        hitboxSize={[0.6, 1.05, 0.45]}
        labelOffset={[0, 1.1, 0]}
      >
        {/* Cabinet body */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.55, 0.9, 0.4]} />
          <meshStandardMaterial color="#8a6a30" roughness={0.6} metalness={0.2} />
        </mesh>
        {/* Cabinet door lines (decorative) */}
        <mesh position={[0.15, 0.5, 0.21]}>
          <boxGeometry args={[0.01, 0.82, 0.005]} />
          <meshStandardMaterial color="#6a5020" roughness={0.7} />
        </mesh>
        <mesh position={[-0.13, 0.5, 0.21]}>
          <boxGeometry args={[0.01, 0.82, 0.005]} />
          <meshStandardMaterial color="#6a5020" roughness={0.7} />
        </mesh>
        <mesh position={[0.01, 0.5, 0.21]}>
          <boxGeometry args={[0.28, 0.005, 0.005]} />
          <meshStandardMaterial color="#6a5020" roughness={0.7} />
        </mesh>
        {/* Cabinet handle */}
        <mesh position={[0.1, 0.5, 0.212]}>
          <boxGeometry args={[0.025, 0.09, 0.012]} />
          <meshStandardMaterial color="#c0a040" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Hazard label (yellow rectangle) */}
        <mesh position={[0.01, 0.68, 0.212]}>
          <boxGeometry args={[0.18, 0.1, 0.005]} />
          <meshStandardMaterial
            color="#ffcc00"
            emissive="#ffcc00"
            emissiveIntensity={0.08}
            roughness={0.5}
          />
        </mesh>
      </InteractiveTool>

      {/* Safety shower */}
      <InteractiveTool
        name="Emergency Shower"
        description="Click to repair all damaged containers"
        onClick={handleSafetyShower}
        position={[1.5, 0.85, -1.0]}
        hitboxSize={[0.25, 1.6, 0.35]}
        labelOffset={[0, 0.95, 0]}
      >
        {/* Vertical pipe */}
        <mesh castShadow>
          <cylinderGeometry args={[0.025, 0.025, 1.55, 10]} />
          <meshStandardMaterial color="#bbbbbb" metalness={0.7} roughness={0.25} />
        </mesh>
        {/* Horizontal arm */}
        <mesh position={[0, 0.75, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.28, 8]} />
          <meshStandardMaterial color="#bbbbbb" metalness={0.7} roughness={0.25} />
        </mesh>
        {/* Shower head */}
        <mesh position={[0, 0.75, 0.28]}>
          <cylinderGeometry args={[0.09, 0.07, 0.04, 16]} />
          <meshStandardMaterial color="#999999" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Pull handle / chain */}
        <mesh position={[0, 0.45, 0.05]}>
          <cylinderGeometry args={[0.008, 0.008, 0.22, 6]} />
          <meshStandardMaterial color="#cc8800" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.33, 0.05]}>
          <boxGeometry args={[0.06, 0.02, 0.04]} />
          <meshStandardMaterial color="#cc8800" roughness={0.4} />
        </mesh>
      </InteractiveTool>

      {/* Eye wash station */}
      <InteractiveTool
        name="Eye Wash Station"
        description="Click to repair damaged containers"
        onClick={handleEyeWash}
        position={[0.85, 0, -1.0]}
        hitboxSize={[0.28, 0.55, 0.28]}
        labelOffset={[0, 0.72, 0]}
      >
        {/* Pedestal */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.35, 12]} />
          <meshStandardMaterial color="#999999" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Basin */}
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.12, 0.1, 0.06, 14]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.5} roughness={0.35} />
        </mesh>
        {/* Nozzle left */}
        <mesh position={[-0.07, 0.48, 0]} rotation={[0.4, 0, 0.2]}>
          <cylinderGeometry args={[0.008, 0.01, 0.06, 8]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Nozzle right */}
        <mesh position={[0.07, 0.48, 0]} rotation={[0.4, 0, -0.2]}>
          <cylinderGeometry args={[0.008, 0.01, 0.06, 8]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Activation lever */}
        <mesh position={[0, 0.38, 0.12]}>
          <boxGeometry args={[0.12, 0.018, 0.015]} />
          <meshStandardMaterial color="#cc4400" roughness={0.4} metalness={0.3} />
        </mesh>
      </InteractiveTool>

      {/* Fire extinguisher */}
      <InteractiveTool
        name="Fire Extinguisher"
        description="Click to clear all fire effects"
        onClick={handleFireExtinguisher}
        position={[-0.3, 0, -1.15]}
        hitboxSize={[0.18, 0.72, 0.18]}
        labelOffset={[0, 0.85, 0]}
      >
        {/* Body (red cylinder) */}
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.07, 0.5, 14]} />
          <meshStandardMaterial color="#cc1111" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Neck */}
        <mesh position={[0, 0.56, 0]}>
          <cylinderGeometry args={[0.025, 0.055, 0.07, 12]} />
          <meshStandardMaterial color="#cc1111" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Valve handle */}
        <mesh position={[0, 0.63, 0]}>
          <boxGeometry args={[0.1, 0.02, 0.025]} />
          <meshStandardMaterial color="#111111" roughness={0.5} metalness={0.5} />
        </mesh>
        {/* Hose */}
        <mesh position={[0.07, 0.5, 0.05]} rotation={[0.3, 0.5, -0.8]}>
          <cylinderGeometry args={[0.01, 0.01, 0.2, 6]} />
          <meshStandardMaterial color="#111111" roughness={0.7} />
        </mesh>
      </InteractiveTool>

      {/* Waste containers */}
      <Html position={[0.5, 0.48, 0.8]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Chemical Waste</span>
      </Html>
      {/* Red sharps bin */}
      <mesh position={[0.2, 0.18, 0.8]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.32, 14]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
      <mesh position={[0.2, 0.35, 0.8]}>
        <cylinderGeometry args={[0.105, 0.105, 0.04, 14]} />
        <meshStandardMaterial color="#aa1111" roughness={0.5} />
      </mesh>
      {/* Yellow chemical waste bin */}
      <mesh position={[0.5, 0.18, 0.8]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.32, 14]} />
        <meshStandardMaterial color="#ddbb00" roughness={0.5} />
      </mesh>
      <mesh position={[0.5, 0.35, 0.8]}>
        <cylinderGeometry args={[0.105, 0.105, 0.04, 14]} />
        <meshStandardMaterial color="#cc9900" roughness={0.5} />
      </mesh>
      {/* White general waste */}
      <mesh position={[0.8, 0.14, 0.8]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 0.24, 14]} />
        <meshStandardMaterial color="#cccccc" roughness={0.5} />
      </mesh>
      <mesh position={[0.8, 0.27, 0.8]}>
        <cylinderGeometry args={[0.085, 0.085, 0.03, 14]} />
        <meshStandardMaterial color="#aaaaaa" roughness={0.5} />
      </mesh>

      {/* SDS reference terminal */}
      <InteractiveTool
        name="SDS Terminal"
        description="Click to view safety data for selected substance"
        onClick={handleSDSTerminal}
        position={[-0.5, 0, 0.7]}
        hitboxSize={[0.38, 0.62, 0.28]}
        labelOffset={[0, 0.72, 0]}
      >
        {/* Terminal body */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.3, 0.5, 0.22]} />
          <meshStandardMaterial color="#1a1a22" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0.38, -0.11]}>
          <boxGeometry args={[0.22, 0.26, 0.01]} />
          <meshStandardMaterial
            color="#001122"
            emissive="#0077cc"
            emissiveIntensity={0.6}
            roughness={0.15}
          />
        </mesh>
        {/* SDS text lines (emissive strips) */}
        {([0.12, 0.06, 0.0, -0.06] as number[]).map((y, i) => (
          <mesh key={i} position={[0, 0.38 + y, -0.115]}>
            <boxGeometry args={[0.15, 0.012, 0.005]} />
            <meshStandardMaterial
              color="#aaccff"
              emissive="#aaccff"
              emissiveIntensity={0.4}
            />
          </mesh>
        ))}
        {/* Terminal base */}
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.35, 0.06, 0.28]} />
          <meshStandardMaterial color="#111118" roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Keyboard panel */}
        <mesh position={[0, 0.08, 0.12]}>
          <boxGeometry args={[0.28, 0.015, 0.1]} />
          <meshStandardMaterial color="#1a1a22" roughness={0.7} />
        </mesh>
      </InteractiveTool>

      {/* Spill cleanup kit (yellow bucket) */}
      <group position={[-1.55, 0.06, 0.7]}>
        {/* Kit box */}
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.14, 0.2]} />
          <meshStandardMaterial color="#ff6600" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.075, 0]}>
          <boxGeometry args={[0.28, 0.01, 0.2]} />
          <meshStandardMaterial color="#cc4400" roughness={0.5} />
        </mesh>
        {/* "SPILL KIT" stripe */}
        <mesh position={[0, 0.03, 0.101]}>
          <boxGeometry args={[0.2, 0.04, 0.003]} />
          <meshStandardMaterial color="#ffcc00" roughness={0.6} />
        </mesh>
      </group>
      <Html position={[-1.55, 0.28, 0.7]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Spill Kit</span>
      </Html>

      {/* Acid cabinet (yellow) -- now interactive */}
      <InteractiveTool
        name="Acid Cabinet"
        description="Click to access acid storage"
        onClick={handleAcidCabinet}
        position={[-0.5, 0.42, -0.9]}
        hitboxSize={[0.55, 0.85, 0.42]}
        labelOffset={[0, 0.55, 0]}
      >
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.8, 0.38]} />
          <meshStandardMaterial color="#ccbb00" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Door center line */}
        <mesh position={[0.005, 0, -0.19]}>
          <boxGeometry args={[0.01, 0.74, 0.003]} />
          <meshStandardMaterial color="#aa9900" roughness={0.6} />
        </mesh>
        {/* Warning diamond label */}
        <mesh position={[0, 0.2, -0.192]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.1, 0.1, 0.004]} />
          <meshStandardMaterial color="#ffdd00" roughness={0.5} />
        </mesh>
        {/* Handle */}
        <mesh position={[-0.06, 0, -0.192]}>
          <boxGeometry args={[0.02, 0.08, 0.012]} />
          <meshStandardMaterial color="#c0a030" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Ventilation slits */}
        {([-0.25, -0.1, 0.1] as number[]).map((y, i) => (
          <mesh key={i} position={[0, y, -0.192]}>
            <boxGeometry args={[0.3, 0.018, 0.003]} />
            <meshStandardMaterial color="#aa9900" roughness={0.7} />
          </mesh>
        ))}
      </InteractiveTool>

      {/* Flammable cabinet (red) -- now interactive */}
      <InteractiveTool
        name="Flammable Cabinet"
        description="Click to access flammable storage"
        onClick={handleFlammableCabinet}
        position={[0.3, 0.42, -0.9]}
        hitboxSize={[0.55, 0.85, 0.42]}
        labelOffset={[0, 0.55, 0]}
      >
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.8, 0.38]} />
          <meshStandardMaterial color="#cc2200" roughness={0.5} metalness={0.2} />
        </mesh>
        {/* Door center line */}
        <mesh position={[0.005, 0, -0.191]}>
          <boxGeometry args={[0.01, 0.74, 0.003]} />
          <meshStandardMaterial color="#aa1100" roughness={0.6} />
        </mesh>
        {/* Flame warning symbol area */}
        <mesh position={[0, 0.2, -0.192]}>
          <boxGeometry args={[0.12, 0.1, 0.004]} />
          <meshStandardMaterial color="#ffaa00" roughness={0.5} emissive="#ff6600" emissiveIntensity={0.1} />
        </mesh>
        {/* Handle */}
        <mesh position={[-0.06, 0, -0.192]}>
          <boxGeometry args={[0.02, 0.08, 0.012]} />
          <meshStandardMaterial color="#cc4400" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* "FLAMMABLE" stripe at bottom */}
        <mesh position={[0, -0.36, -0.192]}>
          <boxGeometry args={[0.46, 0.04, 0.003]} />
          <meshStandardMaterial color="#ffaa00" roughness={0.6} />
        </mesh>
      </InteractiveTool>

      {/* Chemical shelving (multi-tier) */}
      <group position={[1.55, 0.5, -0.85]}>
        {/* Back panel */}
        <mesh>
          <boxGeometry args={[0.45, 0.9, 0.04]} />
          <meshStandardMaterial color="#444444" roughness={0.7} metalness={0.3} />
        </mesh>
        {/* Shelves */}
        {([-0.3, -0.02, 0.26] as number[]).map((y, i) => (
          <mesh key={i} position={[0, y, 0.16]}>
            <boxGeometry args={[0.44, 0.025, 0.3]} />
            <meshStandardMaterial color="#555555" roughness={0.6} metalness={0.3} />
          </mesh>
        ))}
        {/* Chemical bottles on shelves */}
        {([
          [-0.16, -0.22, 0.16], [0.0, -0.22, 0.16], [0.16, -0.22, 0.16],
          [-0.16, 0.06, 0.16], [0.0, 0.06, 0.16],
          [0.0, 0.34, 0.16], [0.16, 0.34, 0.16],
        ] as [number, number, number][]).map((pos, i) => (
          <mesh key={i} position={pos}>
            <cylinderGeometry args={[0.028, 0.030, 0.1, 10]} />
            <meshStandardMaterial color={["#4488cc", "#cc4422", "#44aa44", "#aa8822", "#8844cc", "#cc8800", "#226688"][i % 7]} roughness={0.4} metalness={0.1} />
          </mesh>
        ))}
        {/* Bottle caps */}
        {([
          [-0.16, -0.16, 0.16], [0.0, -0.16, 0.16], [0.16, -0.16, 0.16],
          [-0.16, 0.12, 0.16], [0.0, 0.12, 0.16],
          [0.0, 0.4, 0.16], [0.16, 0.4, 0.16],
        ] as [number, number, number][]).map((pos, i) => (
          <mesh key={i} position={pos}>
            <cylinderGeometry args={[0.022, 0.026, 0.02, 10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
        ))}
      </group>
      <Html position={[1.55, 1.08, -0.85]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Chemical Shelving</span>
      </Html>

      {/* First aid kit (white box with red cross) -- now interactive */}
      <InteractiveTool
        name="First Aid Kit"
        description="Click for first aid instructions"
        onClick={handleFirstAidKit}
        position={[0.85, 0.72, -1.12]}
        hitboxSize={[0.28, 0.22, 0.14]}
        labelOffset={[0, 0.25, 0]}
      >
        {/* Box */}
        <mesh castShadow>
          <boxGeometry args={[0.24, 0.18, 0.1]} />
          <meshStandardMaterial color="#eeeeee" roughness={0.5} />
        </mesh>
        {/* Red cross -- vertical bar */}
        <mesh position={[0, 0, -0.051]}>
          <boxGeometry args={[0.04, 0.12, 0.003]} />
          <meshStandardMaterial color="#cc2200" roughness={0.4} />
        </mesh>
        {/* Red cross -- horizontal bar */}
        <mesh position={[0, 0, -0.051]}>
          <boxGeometry args={[0.12, 0.04, 0.003]} />
          <meshStandardMaterial color="#cc2200" roughness={0.4} />
        </mesh>
        {/* Latch */}
        <mesh position={[0, -0.08, -0.051]}>
          <boxGeometry args={[0.045, 0.015, 0.005]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.6} roughness={0.3} />
        </mesh>
      </InteractiveTool>

      {/* Sharps container (small red box) */}
      <group position={[-0.3, 0.06, 0.4]}>
        {/* Body */}
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.18, 0.1]} />
          <meshStandardMaterial color="#cc2200" roughness={0.5} />
        </mesh>
        {/* Lid */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.125, 0.025, 0.105]} />
          <meshStandardMaterial color="#aa1100" roughness={0.5} />
        </mesh>
        {/* Biohazard symbol circle */}
        <mesh position={[0, 0.02, 0.051]}>
          <cylinderGeometry args={[0.03, 0.03, 0.004, 16]} />
          <meshStandardMaterial color="#ffaa00" roughness={0.5} />
        </mesh>
        {/* Slot opening on top */}
        <mesh position={[0, 0.112, 0]}>
          <boxGeometry args={[0.04, 0.005, 0.025]} />
          <meshStandardMaterial color="#880000" roughness={0.6} />
        </mesh>
      </group>
      <Html position={[-0.3, 0.34, 0.4]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Sharps Container</span>
      </Html>

      {/* MSDS binder on shelf */}
      <group position={[-0.5, 0.72, -1.12]}>
        {/* Binder body */}
        <mesh castShadow>
          <boxGeometry args={[0.065, 0.22, 0.28]} />
          <meshStandardMaterial color="#2244aa" roughness={0.6} />
        </mesh>
        {/* Spine label */}
        <mesh position={[0.033, 0, 0]}>
          <boxGeometry args={[0.002, 0.18, 0.22]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} />
        </mesh>
        {/* Ring mechanism bump */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.07, 0.08, 0.035]} />
          <meshStandardMaterial color="#1a3388" roughness={0.5} metalness={0.3} />
        </mesh>
      </group>
      <Html position={[-0.5, 1.02, -1.12]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>SDS Binder</span>
      </Html>

      {/* PPE shelf (goggles, gloves on hooks) */}
      <group position={[1.55, 0.8, -0.5]}>
        {/* Shelf plank */}
        <mesh>
          <boxGeometry args={[0.45, 0.025, 0.2]} />
          <meshStandardMaterial color="#666660" roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Goggles body */}
        <mesh position={[-0.12, 0.06, -0.04]}>
          <boxGeometry args={[0.16, 0.055, 0.08]} />
          <meshStandardMaterial color="#222266" roughness={0.3} metalness={0.1} />
        </mesh>
        {/* Goggles lens left */}
        <mesh position={[-0.17, 0.06, -0.042]}>
          <boxGeometry args={[0.055, 0.042, 0.01]} />
          <meshPhysicalMaterial color="#a8d8ff" transparent opacity={0.25} roughness={0.05} transmission={0.78} />
        </mesh>
        {/* Goggles lens right */}
        <mesh position={[-0.07, 0.06, -0.042]}>
          <boxGeometry args={[0.055, 0.042, 0.01]} />
          <meshPhysicalMaterial color="#a8d8ff" transparent opacity={0.25} roughness={0.05} transmission={0.78} />
        </mesh>
        {/* Gloves hanging */}
        <mesh position={[0.14, 0.06, -0.06]}>
          <boxGeometry args={[0.055, 0.12, 0.02]} />
          <meshStandardMaterial color="#44aacc" roughness={0.6} />
        </mesh>
        {/* Hook for gloves */}
        <mesh position={[0.14, 0.022, -0.095]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.04, 6]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      <Html position={[1.55, 1.02, -0.5]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>PPE Station</span>
      </Html>

      {/* Safety poster on wall */}
      <group position={[-1.55, 0.85, -1.12]}>
        {/* Poster backing */}
        <mesh>
          <boxGeometry args={[0.3, 0.4, 0.01]} />
          <meshStandardMaterial color="#ffffff" roughness={0.7} />
        </mesh>
        {/* Header strip (red) */}
        <mesh position={[0, 0.16, 0.006]}>
          <boxGeometry args={[0.26, 0.05, 0.003]} />
          <meshStandardMaterial color="#cc2200" roughness={0.5} />
        </mesh>
        {/* Content lines */}
        {([-0.02, -0.06, -0.1, -0.14] as number[]).map((y, i) => (
          <mesh key={i} position={[0, y, 0.006]}>
            <boxGeometry args={[0.22, 0.015, 0.003]} />
            <meshStandardMaterial color="#333333" roughness={0.7} />
          </mesh>
        ))}
        {/* GHS diamond symbols (small colored squares) */}
        {([[-0.08, 0.06, "#ff6600"], [0, 0.06, "#cc2200"], [0.08, 0.06, "#0066cc"]] as [number, number, string][]).map(
          ([x, y, color], i) => (
            <mesh key={i} position={[x, y, 0.006]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.03, 0.03, 0.003]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          )
        )}
      </group>
      <Html position={[-1.55, 1.18, -1.12]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Safety Poster</span>
      </Html>

      {/* Emergency phone on wall */}
      <group position={[1.55, 0.55, -1.12]}>
        {/* Phone body */}
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.16, 0.05]} />
          <meshStandardMaterial color="#cc2200" roughness={0.5} />
        </mesh>
        {/* Handset cradle */}
        <mesh position={[0, 0.04, -0.026]}>
          <boxGeometry args={[0.07, 0.02, 0.02]} />
          <meshStandardMaterial color="#aa1100" roughness={0.5} />
        </mesh>
        {/* Handset */}
        <mesh position={[0, 0.05, -0.03]}>
          <boxGeometry args={[0.06, 0.01, 0.04]} />
          <meshStandardMaterial color="#222222" roughness={0.5} />
        </mesh>
        {/* Dial/button pad */}
        <mesh position={[0, -0.03, -0.026]}>
          <boxGeometry args={[0.06, 0.06, 0.005]} />
          <meshStandardMaterial color="#333333" roughness={0.6} />
        </mesh>
        {/* Number buttons */}
        {([[-0.015, -0.015], [0, -0.015], [0.015, -0.015], [-0.015, -0.03], [0, -0.03], [0.015, -0.03]] as [number, number][]).map(
          ([x, y], i) => (
            <mesh key={i} position={[x, y, -0.027]}>
              <boxGeometry args={[0.01, 0.01, 0.003]} />
              <meshStandardMaterial color="#555555" roughness={0.5} />
            </mesh>
          )
        )}
        {/* "EMERGENCY" label */}
        <mesh position={[0, 0.07, -0.026]}>
          <boxGeometry args={[0.08, 0.015, 0.003]} />
          <meshStandardMaterial color="#ffcc00" roughness={0.6} />
        </mesh>
      </group>
      <Html position={[1.55, 0.78, -1.12]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Emergency Phone</span>
      </Html>
    </StationShell>
  );
}
