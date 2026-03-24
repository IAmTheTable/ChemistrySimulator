import { useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import StationShell, { LABEL_STYLE } from "./StationShell";
import { useStationTool } from "./useStationTool";
import InteractiveTool from "./InteractiveTool";

export default function GloveBox() {
  const { selectedItem, showNotification } = useStationTool();
  const [atmosphere, setAtmosphere] = useState<"Air" | "N2" | "Ar">("Air");

  const handleAirlock = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem) {
      showNotification("Select a container first to transfer through airlock");
      return;
    }
    showNotification(
      `Container transferred through airlock into ${atmosphere === "Air" ? "glove box" : atmosphere + " atmosphere"}`
    );
  };

  const handleGasLine = (gas: "N2" | "Ar") => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setAtmosphere(gas);
    showNotification(`Glove box purged -- atmosphere set to ${gas}`);
  };

  return (
    <StationShell wallColor="#303035" showShelf={false}>
      {/* ── Main glove box body — frame ── */}
      <Html position={[0, 1.12, -0.4]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Inert Atmosphere Glove Box ({atmosphere})</span>
      </Html>
      {/* Bottom panel */}
      <mesh position={[0, 0.06, -0.4]} castShadow>
        <boxGeometry args={[2.2, 0.06, 1.1]} />
        <meshStandardMaterial color="#3a3a42" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Top panel */}
      <mesh position={[0, 0.96, -0.4]} castShadow>
        <boxGeometry args={[2.2, 0.06, 1.1]} />
        <meshStandardMaterial color="#3a3a42" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Left side panel */}
      <mesh position={[-1.1, 0.51, -0.4]} castShadow>
        <boxGeometry args={[0.06, 0.84, 1.1]} />
        <meshStandardMaterial color="#3a3a42" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Right side panel */}
      <mesh position={[1.1, 0.51, -0.4]} castShadow>
        <boxGeometry args={[0.06, 0.84, 1.1]} />
        <meshStandardMaterial color="#3a3a42" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Back panel */}
      <mesh position={[0, 0.51, -0.95]} castShadow>
        <boxGeometry args={[2.2, 0.84, 0.06]} />
        <meshStandardMaterial color="#38383f" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Front glass panel */}
      <mesh position={[0, 0.51, 0.12]}>
        <boxGeometry args={[2.18, 0.82, 0.03]} />
        <meshPhysicalMaterial
          color="#b8d8ff"
          transparent
          opacity={0.18}
          roughness={0.04}
          metalness={0.0}
          transmission={0.82}
        />
      </mesh>

      {/* ── Glove ports (torus shapes) ── */}
      <Html position={[0, 0.7, 0.14]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Glove Ports</span>
      </Html>
      <mesh position={[-0.42, 0.48, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.025, 12, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>
      <mesh position={[0.42, 0.48, 0.14]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.13, 0.025, 12, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
      </mesh>
      {/* Glove material (dark rubber appearance) */}
      <mesh position={[-0.42, 0.48, 0.14]}>
        <cylinderGeometry args={[0.11, 0.13, 0.06, 20]} />
        <meshStandardMaterial color="#222" roughness={0.9} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.42, 0.48, 0.14]}>
        <cylinderGeometry args={[0.11, 0.13, 0.06, 20]} />
        <meshStandardMaterial color="#222" roughness={0.9} transparent opacity={0.7} />
      </mesh>

      {/* ── Interior workspace ── */}
      <mesh position={[0, 0.12, -0.45]} receiveShadow>
        <boxGeometry args={[2.0, 0.04, 0.9]} />
        <meshStandardMaterial color="#e0ddd8" roughness={0.7} />
      </mesh>

      {/* Interior sample vials */}
      {([-0.4, 0, 0.4] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.22, -0.5]}>
          <cylinderGeometry args={[0.025, 0.025, 0.14, 10]} />
          <meshPhysicalMaterial
            color="#c8e8ff"
            transparent
            opacity={0.32}
            roughness={0.05}
            transmission={0.75}
          />
        </mesh>
      ))}
      {/* Vial caps */}
      {([-0.4, 0, 0.4] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.305, -0.5]}>
          <cylinderGeometry args={[0.027, 0.027, 0.022, 10]} />
          <meshStandardMaterial color="#3a6644" roughness={0.5} />
        </mesh>
      ))}

      {/* ── Airlock chamber — smaller box on right side ── */}
      <InteractiveTool
        name="Airlock"
        description="Click to transfer container into inert atmosphere"
        onClick={handleAirlock}
        labelOffset={[0, 0.6, 0]}
      >
        {/* Airlock body */}
        <mesh position={[1.52, 0.51, -0.4]} castShadow>
          <boxGeometry args={[0.45, 0.7, 0.7]} />
          <meshStandardMaterial color="#343438" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Airlock inner door (left face) */}
        <mesh position={[1.3, 0.51, -0.4]}>
          <boxGeometry args={[0.03, 0.5, 0.5]} />
          <meshStandardMaterial color="#505058" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Airlock outer door (right face) */}
        <mesh position={[1.75, 0.51, -0.4]}>
          <boxGeometry args={[0.03, 0.5, 0.5]} />
          <meshStandardMaterial color="#505058" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Airlock handle */}
        <mesh position={[1.77, 0.51, -0.55]}>
          <boxGeometry args={[0.02, 0.06, 0.02]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
        </mesh>
      </InteractiveTool>

      {/* ── Gas line connections at top ── */}
      {/* Argon line pipe (non-interactive) */}
      <mesh position={[-0.6, 1.02, -0.4]}>
        <cylinderGeometry args={[0.018, 0.018, 0.25, 8]} />
        <meshStandardMaterial color="#888890" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Nitrogen line pipe (non-interactive) */}
      <mesh position={[0.6, 1.02, -0.4]}>
        <cylinderGeometry args={[0.018, 0.018, 0.25, 8]} />
        <meshStandardMaterial color="#888890" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Gas valve knob — Ar (orange, left) */}
      <InteractiveTool
        name="Gas Lines (Ar)"
        description="Click to purge with Ar"
        onClick={handleGasLine("Ar")}
        position={[-0.6, 1.16, -0.4]}
        labelOffset={[0, 0.2, 0]}
      >
        <mesh>
          <cylinderGeometry args={[0.032, 0.032, 0.025, 8]} />
          <meshStandardMaterial
            color={atmosphere === "Ar" ? "#ff8800" : "#cc6600"}
            emissive={atmosphere === "Ar" ? "#ff6600" : "#000000"}
            emissiveIntensity={atmosphere === "Ar" ? 0.5 : 0}
            roughness={0.4}
            metalness={0.3}
          />
        </mesh>
      </InteractiveTool>
      {/* Gas valve knob — N2 (blue, right) */}
      <InteractiveTool
        name="Gas Lines (N\u2082)"
        description="Click to purge with N\u2082"
        onClick={handleGasLine("N2")}
        position={[0.6, 1.16, -0.4]}
        labelOffset={[0, 0.2, 0]}
      >
        <mesh>
          <cylinderGeometry args={[0.032, 0.032, 0.025, 8]} />
          <meshStandardMaterial
            color={atmosphere === "N2" ? "#4488ff" : "#3366cc"}
            emissive={atmosphere === "N2" ? "#2266ff" : "#000000"}
            emissiveIntensity={atmosphere === "N2" ? 0.5 : 0}
            roughness={0.4}
            metalness={0.3}
          />
        </mesh>
      </InteractiveTool>

      {/* ── Vacuum gauge (circular dial) on front face ── */}
      <group position={[-0.7, 0.06, 0.15]}>
        {/* Gauge body */}
        <mesh>
          <cylinderGeometry args={[0.042, 0.042, 0.04, 16]} />
          <meshStandardMaterial color="#222225" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Gauge face */}
        <mesh position={[0, 0.021, 0]}>
          <cylinderGeometry args={[0.036, 0.036, 0.005, 16]} />
          <meshStandardMaterial color="#f0f0e8" roughness={0.7} />
        </mesh>
        {/* Needle */}
        <mesh position={[0.012, 0.025, 0]} rotation={[0, 0, -0.8]}>
          <boxGeometry args={[0.028, 0.003, 0.002]} />
          <meshStandardMaterial color="#cc2200" roughness={0.4} />
        </mesh>
      </group>
      <Html position={[-0.7, 0.2, 0.15]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Vacuum Gauge</span>
      </Html>

      {/* ── Pressure digital display on front ── */}
      <group position={[0.7, 0.06, 0.15]}>
        <mesh castShadow>
          <boxGeometry args={[0.18, 0.1, 0.06]} />
          <meshStandardMaterial color="#1a1a22" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Digital readout */}
        <mesh position={[0, 0.01, 0.031]}>
          <boxGeometry args={[0.12, 0.05, 0.005]} />
          <meshStandardMaterial color="#001100" emissive="#00ff88" emissiveIntensity={0.8} roughness={0.2} />
        </mesh>
        {/* Unit label area */}
        <mesh position={[0, -0.03, 0.031]}>
          <boxGeometry args={[0.1, 0.015, 0.003]} />
          <meshStandardMaterial color="#333344" roughness={0.7} />
        </mesh>
      </group>
      <Html position={[0.7, 0.22, 0.15]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Pressure Display</span>
      </Html>

      {/* ── Pressure gauge on top (existing) ── */}
      <mesh position={[0, 1.06, -0.55]}>
        <cylinderGeometry args={[0.045, 0.045, 0.05, 16]} />
        <meshStandardMaterial color="#222225" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.08, -0.55]}>
        <cylinderGeometry args={[0.038, 0.038, 0.01, 16]} />
        <meshStandardMaterial
          color="#001100"
          emissive="#00ff44"
          emissiveIntensity={0.5}
          roughness={0.2}
        />
      </mesh>

      {/* ── Gas purification cartridge on top ── */}
      <group position={[-0.3, 1.06, -0.4]}>
        {/* Cylinder body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.28, 14]} />
          <meshStandardMaterial color="#c8c8c0" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Top cap */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.058, 0.058, 0.025, 14]} />
          <meshStandardMaterial color="#aaaaaa" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Bottom cap */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.058, 0.058, 0.025, 14]} />
          <meshStandardMaterial color="#aaaaaa" roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Inlet/outlet nozzles */}
        <mesh position={[0, 0.16, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.04, 8]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.16, -0.04]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.04, 8]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      <Html position={[-0.3, 1.38, -0.4]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Gas Purification Cartridge</span>
      </Html>

      {/* ── Internal shelving ── */}
      {/* Shelf plank */}
      <mesh position={[0.5, 0.38, -0.6]}>
        <boxGeometry args={[0.8, 0.025, 0.3]} />
        <meshStandardMaterial color="#555558" roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Shelf brackets */}
      <mesh position={[0.18, 0.32, -0.6]}>
        <boxGeometry args={[0.015, 0.1, 0.015]} />
        <meshStandardMaterial color="#444448" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.82, 0.32, -0.6]}>
        <boxGeometry args={[0.015, 0.1, 0.015]} />
        <meshStandardMaterial color="#444448" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Items on shelf */}
      <mesh position={[0.35, 0.44, -0.6]}>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 10]} />
        <meshPhysicalMaterial color="#c8e8ff" transparent opacity={0.3} roughness={0.05} transmission={0.75} />
      </mesh>
      <mesh position={[0.55, 0.44, -0.6]}>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 10]} />
        <meshPhysicalMaterial color="#c8e8ff" transparent opacity={0.3} roughness={0.05} transmission={0.75} />
      </mesh>

      {/* ── Tool holder strip on interior back wall ── */}
      <mesh position={[-0.4, 0.7, -0.92]}>
        <boxGeometry args={[0.5, 0.04, 0.025]} />
        <meshStandardMaterial color="#444448" roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Hanging tools — small spatulas */}
      {([-0.55, -0.42, -0.28] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.62, -0.91]}>
          <boxGeometry args={[0.007, 0.12, 0.005]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      {/* Tool holder hooks */}
      {([-0.55, -0.42, -0.28] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.71, -0.91]}>
          <boxGeometry args={[0.018, 0.012, 0.02]} />
          <meshStandardMaterial color="#666668" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* ── Enhanced glove ports — thicker rubber torus ── */}
      {/* Left glove — inner rubber disc */}
      <mesh position={[-0.42, 0.48, 0.13]}>
        <cylinderGeometry args={[0.11, 0.13, 0.04, 20]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
      </mesh>
      {/* Right glove — inner rubber disc */}
      <mesh position={[0.42, 0.48, 0.13]}>
        <cylinderGeometry args={[0.11, 0.13, 0.04, 20]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
      </mesh>

      {/* ── Antechamber door details ── */}
      {/* Inner door porthole window */}
      <mesh position={[1.3, 0.51, -0.4]}>
        <cylinderGeometry args={[0.08, 0.08, 0.005, 16]} />
        <meshPhysicalMaterial color="#b8d8ff" transparent opacity={0.3} roughness={0.04} transmission={0.78} />
      </mesh>
      {/* Outer door handle */}
      <mesh position={[1.77, 0.55, -0.38]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 8]} />
        <meshStandardMaterial color="#cccccc" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Outer door latch lever */}
      <mesh position={[1.77, 0.46, -0.55]}>
        <boxGeometry args={[0.015, 0.07, 0.015]} />
        <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.2} />
      </mesh>
    </StationShell>
  );
}
