import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import StationShell, { LABEL_STYLE } from "./StationShell";
import { useStationTool } from "./useStationTool";

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

  return (
    <StationShell wallColor="#2a2820" showShelf={false}>
      {/* ── Chemical storage cabinet ── */}
      <Html position={[-1.55, 1.02, -0.85]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Chemical Storage Cabinet</span>
      </Html>
      <group onClick={handleChemicalCabinet}>
        {/* Cabinet body */}
        <mesh position={[-1.55, 0.5, -0.85]} castShadow>
          <boxGeometry args={[0.55, 0.9, 0.4]} />
          <meshStandardMaterial color="#8a6a30" roughness={0.6} metalness={0.2} />
        </mesh>
        {/* Cabinet door lines (decorative) */}
        <mesh position={[-1.4, 0.5, -0.64]}>
          <boxGeometry args={[0.01, 0.82, 0.005]} />
          <meshStandardMaterial color="#6a5020" roughness={0.7} />
        </mesh>
        <mesh position={[-1.68, 0.5, -0.64]}>
          <boxGeometry args={[0.01, 0.82, 0.005]} />
          <meshStandardMaterial color="#6a5020" roughness={0.7} />
        </mesh>
        <mesh position={[-1.54, 0.5, -0.64]}>
          <boxGeometry args={[0.28, 0.005, 0.005]} />
          <meshStandardMaterial color="#6a5020" roughness={0.7} />
        </mesh>
        {/* Cabinet handle */}
        <mesh position={[-1.45, 0.5, -0.638]}>
          <boxGeometry args={[0.025, 0.09, 0.012]} />
          <meshStandardMaterial color="#c0a040" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Hazard label (yellow rectangle) */}
        <mesh position={[-1.54, 0.68, -0.638]}>
          <boxGeometry args={[0.18, 0.1, 0.005]} />
          <meshStandardMaterial
            color="#ffcc00"
            emissive="#ffcc00"
            emissiveIntensity={0.08}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* ── Safety shower ── */}
      <Html position={[1.5, 1.72, -1.0]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Emergency Shower</span>
      </Html>
      <group onClick={handleSafetyShower}>
        {/* Vertical pipe */}
        <mesh position={[1.5, 0.85, -1.0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 1.55, 10]} />
          <meshStandardMaterial color="#bbbbbb" metalness={0.7} roughness={0.25} />
        </mesh>
        {/* Horizontal arm */}
        <mesh position={[1.5, 1.6, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.28, 8]} />
          <meshStandardMaterial color="#bbbbbb" metalness={0.7} roughness={0.25} />
        </mesh>
        {/* Shower head */}
        <mesh position={[1.5, 1.6, -0.72]}>
          <cylinderGeometry args={[0.09, 0.07, 0.04, 16]} />
          <meshStandardMaterial color="#999999" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Pull handle / chain */}
        <mesh position={[1.5, 1.3, -0.95]}>
          <cylinderGeometry args={[0.008, 0.008, 0.22, 6]} />
          <meshStandardMaterial color="#cc8800" roughness={0.5} />
        </mesh>
        <mesh position={[1.5, 1.18, -0.95]}>
          <boxGeometry args={[0.06, 0.02, 0.04]} />
          <meshStandardMaterial color="#cc8800" roughness={0.4} />
        </mesh>
      </group>

      {/* ── Eye wash station ── */}
      <Html position={[0.85, 0.62, -1.0]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Eye Wash Station</span>
      </Html>
      <group onClick={handleEyeWash}>
        {/* Pedestal */}
        <mesh position={[0.85, 0.2, -1.0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.35, 12]} />
          <meshStandardMaterial color="#999999" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Basin */}
        <mesh position={[0.85, 0.42, -1.0]}>
          <cylinderGeometry args={[0.12, 0.1, 0.06, 14]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.5} roughness={0.35} />
        </mesh>
        {/* Nozzle left */}
        <mesh position={[0.78, 0.48, -1.0]} rotation={[0.4, 0, 0.2]}>
          <cylinderGeometry args={[0.008, 0.01, 0.06, 8]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Nozzle right */}
        <mesh position={[0.92, 0.48, -1.0]} rotation={[0.4, 0, -0.2]}>
          <cylinderGeometry args={[0.008, 0.01, 0.06, 8]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Activation lever */}
        <mesh position={[0.85, 0.38, -0.88]}>
          <boxGeometry args={[0.12, 0.018, 0.015]} />
          <meshStandardMaterial color="#cc4400" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>

      {/* ── Fire extinguisher ── */}
      <Html position={[-0.3, 0.78, -1.15]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Fire Extinguisher</span>
      </Html>
      <group onClick={handleFireExtinguisher}>
        {/* Body (red cylinder) */}
        <mesh position={[-0.3, 0.28, -1.15]} castShadow>
          <cylinderGeometry args={[0.065, 0.07, 0.5, 14]} />
          <meshStandardMaterial color="#cc1111" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Neck */}
        <mesh position={[-0.3, 0.56, -1.15]}>
          <cylinderGeometry args={[0.025, 0.055, 0.07, 12]} />
          <meshStandardMaterial color="#cc1111" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Valve handle */}
        <mesh position={[-0.3, 0.63, -1.15]}>
          <boxGeometry args={[0.1, 0.02, 0.025]} />
          <meshStandardMaterial color="#111111" roughness={0.5} metalness={0.5} />
        </mesh>
        {/* Hose */}
        <mesh position={[-0.23, 0.5, -1.1]} rotation={[0.3, 0.5, -0.8]}>
          <cylinderGeometry args={[0.01, 0.01, 0.2, 6]} />
          <meshStandardMaterial color="#111111" roughness={0.7} />
        </mesh>
      </group>

      {/* ── Waste containers ── */}
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

      {/* ── SDS reference terminal ── */}
      <Html position={[-0.5, 0.68, 0.7]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>SDS Reference Terminal</span>
      </Html>
      <group onClick={handleSDSTerminal}>
        {/* Terminal body */}
        <mesh position={[-0.5, 0.3, 0.7]} castShadow>
          <boxGeometry args={[0.3, 0.5, 0.22]} />
          <meshStandardMaterial color="#1a1a22" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Screen */}
        <mesh position={[-0.5, 0.38, 0.59]}>
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
          <mesh key={i} position={[-0.5, 0.38 + y, 0.585]}>
            <boxGeometry args={[0.15, 0.012, 0.005]} />
            <meshStandardMaterial
              color="#aaccff"
              emissive="#aaccff"
              emissiveIntensity={0.4}
            />
          </mesh>
        ))}
        {/* Terminal base */}
        <mesh position={[-0.5, 0.04, 0.7]}>
          <boxGeometry args={[0.35, 0.06, 0.28]} />
          <meshStandardMaterial color="#111118" roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Keyboard panel */}
        <mesh position={[-0.5, 0.08, 0.82]}>
          <boxGeometry args={[0.28, 0.015, 0.1]} />
          <meshStandardMaterial color="#1a1a22" roughness={0.7} />
        </mesh>
      </group>

      {/* Spill kit box on floor */}
      <mesh position={[-1.55, 0.08, 0.7]} castShadow>
        <boxGeometry args={[0.28, 0.14, 0.2]} />
        <meshStandardMaterial color="#ff6600" roughness={0.5} />
      </mesh>
      <mesh position={[-1.55, 0.16, 0.7]}>
        <boxGeometry args={[0.28, 0.01, 0.2]} />
        <meshStandardMaterial color="#cc4400" roughness={0.5} />
      </mesh>
    </StationShell>
  );
}
