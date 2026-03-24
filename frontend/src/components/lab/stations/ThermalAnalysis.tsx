import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import StationShell, { LABEL_STYLE } from "./StationShell";
import { useStationTool } from "./useStationTool";

// Approximate specific heat capacities (J/g-C)
const HEAT_CAPACITY_MAP: Record<string, number> = {
  H2O: 4.18, NaCl: 0.88, HCl: 1.97, NaOH: 1.49, "H2SO4": 1.38,
  "CuSO4": 0.74, KCl: 0.69, "CH3COOH": 2.04, "C2H5OH": 2.44,
  "C6H12O6": 1.20, Fe: 0.45, Cu: 0.39, Al: 0.90, Zn: 0.39,
};

export default function ThermalAnalysis() {
  const { selectedItem, selectedBenchItem, updateBenchItemContents, showNotification } = useStationTool();

  const handleCalorimeter = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    if (selectedItem.contents.length === 0) {
      showNotification("Container is empty -- nothing to measure");
      return;
    }
    const substance = selectedItem.contents[0];
    const cp = HEAT_CAPACITY_MAP[substance.formula] ?? 2.0;
    showNotification(`Bomb Calorimeter -- ${substance.formula}: Cp = ${cp.toFixed(2)} J/g\u00B0C`);
  };

  const handleIceBath = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    updateBenchItemContents(selectedBenchItem, selectedItem.contents, 0);
    showNotification(`Ice bath -- ${selectedItem.type} cooled to 0\u00B0C`);
  };

  const handleHotPlate = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    const newTemp = selectedItem.temperature + 100;
    updateBenchItemContents(selectedBenchItem, selectedItem.contents, newTemp);
    showNotification(`Hot plate -- ${selectedItem.type} heated to ${newTemp}\u00B0C`);
  };

  const handleThermometer = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    showNotification(`Digital Thermometer -- ${selectedItem.type}: ${selectedItem.temperature.toFixed(1)}\u00B0C`);
  };

  return (
    <StationShell wallColor="#2e2820">
      {/* ── Calorimeter ── */}
      <Html position={[-0.8, 0.7, 0.2]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Bomb Calorimeter</span>
      </Html>
      <group onClick={handleCalorimeter}>
        {/* Outer cylinder */}
        <mesh position={[-0.8, 0.25, 0.2]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.42, 20]} />
          <meshStandardMaterial color="#8a8070" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Inner cylinder (insulated wall hint) */}
        <mesh position={[-0.8, 0.27, 0.2]}>
          <cylinderGeometry args={[0.16, 0.16, 0.38, 20]} />
          <meshStandardMaterial color="#e8e0d4" roughness={0.6} />
        </mesh>
        {/* Calorimeter lid */}
        <mesh position={[-0.8, 0.48, 0.2]} castShadow>
          <cylinderGeometry args={[0.21, 0.21, 0.05, 20]} />
          <meshStandardMaterial color="#706858" roughness={0.5} metalness={0.3} />
        </mesh>
        {/* Thermometer through lid */}
        <mesh position={[-0.72, 0.62, 0.2]} castShadow>
          <cylinderGeometry args={[0.007, 0.007, 0.3, 8]} />
          <meshStandardMaterial color="#cc3333" roughness={0.3} />
        </mesh>
        {/* Thermometer bulb */}
        <mesh position={[-0.72, 0.46, 0.2]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="#cc3333" roughness={0.3} />
        </mesh>
        {/* Stirrer rod through lid */}
        <mesh position={[-0.88, 0.58, 0.2]}>
          <cylinderGeometry args={[0.005, 0.005, 0.22, 6]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* ── Ice bath (shallow box) ── */}
      <Html position={[0.5, 0.32, 0.3]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Ice Bath</span>
      </Html>
      <group onClick={handleIceBath}>
        {/* Outer container */}
        <mesh position={[0.5, 0.1, 0.3]} castShadow>
          <boxGeometry args={[0.65, 0.18, 0.55]} />
          <meshStandardMaterial color="#99bbcc" roughness={0.4} metalness={0.2} />
        </mesh>
        {/* Ice/water interior */}
        <mesh position={[0.5, 0.14, 0.3]}>
          <boxGeometry args={[0.58, 0.12, 0.48]} />
          <meshStandardMaterial
            color="#c8e8ff"
            transparent
            opacity={0.75}
            roughness={0.05}
          />
        </mesh>
        {/* Ice chunks */}
        {([
          [0.3, 0.18, 0.2],
          [0.55, 0.18, 0.4],
          [0.7, 0.18, 0.25],
          [0.4, 0.18, 0.42],
        ] as [number, number, number][]).map((pos, i) => (
          <mesh key={i} position={pos}>
            <boxGeometry args={[0.06, 0.04, 0.06]} />
            <meshStandardMaterial color="#ddf0ff" transparent opacity={0.8} roughness={0.05} />
          </mesh>
        ))}
        {/* Sample flask in ice bath */}
        <mesh position={[0.5, 0.22, 0.3]}>
          <cylinderGeometry args={[0.065, 0.07, 0.18, 14]} />
          <meshPhysicalMaterial
            color="#c8e8ff"
            transparent
            opacity={0.28}
            roughness={0.05}
            transmission={0.78}
          />
        </mesh>
      </group>

      {/* ── Bunsen burner / hot plate ── */}
      <Html position={[1.3, 0.38, 0.0]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Hot Plate</span>
      </Html>
      <group onClick={handleHotPlate}>
        {/* Hot plate body */}
        <mesh position={[1.3, 0.1, 0.0]} castShadow>
          <boxGeometry args={[0.35, 0.14, 0.32]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Hot plate surface (ceramic) */}
        <mesh position={[1.3, 0.18, 0.0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.015, 20]} />
          <meshStandardMaterial color="#cc4400" roughness={0.6} emissive="#cc2200" emissiveIntensity={0.3} />
        </mesh>
        {/* Control knob */}
        <mesh position={[1.13, 0.1, 0.1]}>
          <cylinderGeometry args={[0.022, 0.022, 0.025, 10]} />
          <meshStandardMaterial color="#444" roughness={0.5} metalness={0.5} />
        </mesh>
        {/* Flask on hot plate */}
        <mesh position={[1.3, 0.3, 0.0]} castShadow>
          <sphereGeometry args={[0.1, 14, 14]} />
          <meshPhysicalMaterial
            color="#c8e8ff"
            transparent
            opacity={0.28}
            roughness={0.05}
            transmission={0.78}
          />
        </mesh>
        {/* Flask neck */}
        <mesh position={[1.3, 0.46, 0.0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.2, 10]} />
          <meshPhysicalMaterial
            color="#c8e8ff"
            transparent
            opacity={0.28}
            roughness={0.05}
            transmission={0.78}
          />
        </mesh>
      </group>

      {/* ── Thermometer standing in holder ── */}
      <Html position={[0.0, 0.82, -0.5]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Digital Thermometer</span>
      </Html>
      <group onClick={handleThermometer}>
        {/* Stand */}
        <mesh position={[0.0, 0.35, -0.5]}>
          <cylinderGeometry args={[0.01, 0.01, 0.6, 8]} />
          <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.0, 0.07, -0.5]}>
          <boxGeometry args={[0.18, 0.035, 0.12]} />
          <meshStandardMaterial color="#666666" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Digital thermometer body */}
        <mesh position={[0.0, 0.58, -0.5]}>
          <boxGeometry args={[0.1, 0.16, 0.06]} />
          <meshStandardMaterial color="#ddd8cc" roughness={0.5} />
        </mesh>
        {/* Thermometer screen */}
        <mesh position={[0.0, 0.62, -0.47]}>
          <boxGeometry args={[0.065, 0.06, 0.01]} />
          <meshStandardMaterial
            color="#001100"
            emissive="#cc4400"
            emissiveIntensity={0.7}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* ── Sample holder cups (small cylinders) ── */}
      {([[-1.5, 0.42, -1.06], [-1.2, 0.42, -1.06], [-0.9, 0.42, -1.06]] as [number, number, number][]).map(
        (pos, i) => (
          <mesh key={i} position={pos}>
            <cylinderGeometry args={[0.03, 0.03, 0.055, 10]} />
            <meshStandardMaterial color="#c0b090" roughness={0.5} metalness={0.2} />
          </mesh>
        )
      )}

      {/* ── DSC/TGA instrument on shelf — detailed ── */}
      <group position={[1.0, 0.42, -1.05]}>
        {/* Main body */}
        <mesh castShadow>
          <boxGeometry args={[0.55, 0.15, 0.2]} />
          <meshStandardMaterial color="#2a2a35" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* Display */}
        <mesh position={[0, 0.085, -0.1]}>
          <boxGeometry args={[0.28, 0.08, 0.01]} />
          <meshStandardMaterial color="#000811" emissive="#ffaa00" emissiveIntensity={0.45} roughness={0.2} />
        </mesh>
        {/* Sample port holes (2 circles) */}
        <mesh position={[-0.1, 0.08, 0.101]}>
          <cylinderGeometry args={[0.018, 0.018, 0.01, 12]} />
          <meshStandardMaterial color="#111118" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0.1, 0.08, 0.101]}>
          <cylinderGeometry args={[0.018, 0.018, 0.01, 12]} />
          <meshStandardMaterial color="#111118" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Sample lids */}
        <mesh position={[-0.1, 0.09, 0.101]}>
          <cylinderGeometry args={[0.016, 0.016, 0.005, 12]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0.1, 0.09, 0.101]}>
          <cylinderGeometry args={[0.016, 0.016, 0.005, 12]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
      <Html position={[1.0, 0.66, -1.05]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>DSC / TGA</span>
      </Html>

      {/* ── Crucible furnace ── */}
      <group position={[-1.5, 0.06, 0.6]}>
        {/* Furnace body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.14, 0.16, 0.32, 18]} />
          <meshStandardMaterial color="#555550" roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Open top rim */}
        <mesh position={[0, 0.175, 0]}>
          <cylinderGeometry args={[0.135, 0.14, 0.025, 18]} />
          <meshStandardMaterial color="#666660" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Glowing interior */}
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.18, 16]} />
          <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={1.5} roughness={0.8} />
        </mesh>
        <pointLight position={[0, 0.3, 0]} color="#ff6600" intensity={0.8} distance={1.0} />
        {/* Ceramic crucible inside */}
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.042, 0.05, 0.07, 12]} />
          <meshStandardMaterial color="#e8e0d8" roughness={0.8} />
        </mesh>
        {/* Thermocouple wire */}
        <mesh position={[0.08, 0.22, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.18, 6]} />
          <meshStandardMaterial color="#cc4400" roughness={0.5} />
        </mesh>
      </group>
      <Html position={[-1.5, 0.5, 0.6]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Crucible Furnace</span>
      </Html>

      {/* ── Cooling rack (wire grid) ── */}
      <group position={[0.3, 0.075, 0.7]}>
        {/* Rack frame */}
        <mesh>
          <boxGeometry args={[0.38, 0.015, 0.28]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Legs */}
        {([[-0.17, -0.13], [-0.17, 0.13], [0.17, -0.13], [0.17, 0.13]] as [number, number][]).map(([x, z], i) => (
          <mesh key={i} position={[x, -0.035, z]}>
            <cylinderGeometry args={[0.008, 0.008, 0.055, 6]} />
            <meshStandardMaterial color="#777777" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        {/* Wire cross members */}
        {([-0.12, -0.04, 0.04, 0.12] as number[]).map((z, i) => (
          <mesh key={`z${i}`} position={[0, 0.008, z]}>
            <boxGeometry args={[0.36, 0.004, 0.003]} />
            <meshStandardMaterial color="#999999" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        {([-0.14, -0.06, 0.02, 0.1, 0.18] as number[]).map((x, i) => (
          <mesh key={`x${i}`} position={[x - 0.04, 0.008, 0]}>
            <boxGeometry args={[0.003, 0.004, 0.26]} />
            <meshStandardMaterial color="#999999" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>
      <Html position={[0.3, 0.2, 0.7]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Cooling Rack</span>
      </Html>

      {/* ── Heat gun ── */}
      <group position={[-0.1, 0.06, 0.45]}>
        {/* Handle */}
        <mesh rotation={[0.4, 0, 0]}>
          <boxGeometry args={[0.06, 0.18, 0.06]} />
          <meshStandardMaterial color="#222222" roughness={0.5} />
        </mesh>
        {/* Barrel */}
        <mesh position={[0, 0.1, -0.08]}>
          <cylinderGeometry args={[0.028, 0.032, 0.2, 12]} />
          <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Nozzle */}
        <mesh position={[0, 0.1, -0.18]}>
          <cylinderGeometry args={[0.022, 0.028, 0.05, 10]} />
          <meshStandardMaterial color="#444444" roughness={0.5} />
        </mesh>
        {/* Air vents on barrel */}
        {([0, Math.PI * 0.5, Math.PI, Math.PI * 1.5] as number[]).map((angle, i) => (
          <mesh key={i} position={[0.03 * Math.cos(angle), 0.12, -0.08 + 0.03 * Math.sin(angle)]}>
            <boxGeometry args={[0.005, 0.04, 0.005]} />
            <meshStandardMaterial color="#111111" roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* ── Infrared thermometer (gun-shaped) ── */}
      <group position={[0.75, 0.06, 0.55]}>
        {/* Grip handle */}
        <mesh rotation={[0.2, 0, 0]}>
          <boxGeometry args={[0.055, 0.14, 0.055]} />
          <meshStandardMaterial color="#cc4400" roughness={0.5} />
        </mesh>
        {/* Body barrel */}
        <mesh position={[0, 0.08, -0.07]}>
          <boxGeometry args={[0.05, 0.06, 0.14]} />
          <meshStandardMaterial color="#cc4400" roughness={0.5} />
        </mesh>
        {/* Sensor lens */}
        <mesh position={[0, 0.08, -0.14]}>
          <cylinderGeometry args={[0.014, 0.014, 0.012, 10]} />
          <meshStandardMaterial color="#111122" roughness={0.1} metalness={0.3} />
        </mesh>
        {/* Digital screen */}
        <mesh position={[0, 0.1, -0.05]}>
          <boxGeometry args={[0.04, 0.028, 0.005]} />
          <meshStandardMaterial color="#001100" emissive="#cc4400" emissiveIntensity={0.6} roughness={0.2} />
        </mesh>
        {/* Trigger */}
        <mesh position={[0, -0.02, -0.04]}>
          <boxGeometry args={[0.02, 0.04, 0.025]} />
          <meshStandardMaterial color="#aa3300" roughness={0.5} />
        </mesh>
      </group>
      <Html position={[0.75, 0.3, 0.55]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>IR Thermometer</span>
      </Html>

      {/* ── Tongs — long metal grabbing tool ── */}
      <group position={[-1.2, 0.42, -1.06]} rotation={[0, 0.3, 0]}>
        {/* Left arm */}
        <mesh position={[-0.012, 0, 0]} rotation={[0, 0, 0.05]}>
          <boxGeometry args={[0.008, 0.26, 0.008]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.75} roughness={0.2} />
        </mesh>
        {/* Right arm */}
        <mesh position={[0.012, 0, 0]} rotation={[0, 0, -0.05]}>
          <boxGeometry args={[0.008, 0.26, 0.008]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.75} roughness={0.2} />
        </mesh>
        {/* Spring hinge ring at top */}
        <mesh position={[0, 0.13, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.018, 0.004, 6, 16]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Gripping tips */}
        <mesh position={[-0.008, -0.14, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.02, 0.025, 0.012]} />
          <meshStandardMaterial color="#999999" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0.008, -0.14, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.02, 0.025, 0.012]} />
          <meshStandardMaterial color="#999999" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      <Html position={[-1.2, 0.62, -1.06]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Tongs</span>
      </Html>

      {/* ── Insulation blocks (white/ceramic) ── */}
      <mesh position={[-1.5, 0.42, -1.06]} castShadow>
        <boxGeometry args={[0.12, 0.06, 0.1]} />
        <meshStandardMaterial color="#f0ede8" roughness={0.8} />
      </mesh>
      <mesh position={[-1.35, 0.42, -1.06]} castShadow>
        <boxGeometry args={[0.1, 0.04, 0.08]} />
        <meshStandardMaterial color="#e8e5e0" roughness={0.9} />
      </mesh>
    </StationShell>
  );
}
