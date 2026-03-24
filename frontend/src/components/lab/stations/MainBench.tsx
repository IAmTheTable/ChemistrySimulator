import { useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useLabStore } from "../../../stores/labStore";
import StationShell, { LABEL_STYLE } from "./StationShell";
import { useStationTool } from "./useStationTool";
import InteractiveTool from "./InteractiveTool";

export default function MainBench() {
  const { selectedItem, selectedBenchItem, updateBenchItemContents, showNotification, setBenchItemEffects } = useStationTool();
  const [burnerActive, setBurnerActive] = useState(false);

  const handleBunsenBurner = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    const newTemp = selectedItem.temperature + 50;
    updateBenchItemContents(selectedBenchItem, selectedItem.contents, newTemp);
    setBenchItemEffects(selectedBenchItem, [...selectedItem.activeEffects.filter(e => e !== "heating"), "heating"]);
    setBurnerActive(true);
    showNotification(`Heating ${selectedItem.type} to ${newTemp}\u00B0C`);
    setTimeout(() => {
      setBurnerActive(false);
      const current = useLabStore.getState().benchItems.find(b => b.id === selectedBenchItem);
      if (current) {
        useLabStore.getState().setBenchItemEffects(selectedBenchItem, current.activeEffects.filter(e => e !== "heating"));
      }
    }, 3000);
  };

  const handleBalance = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    if (selectedItem.contents.length === 0) {
      showNotification(`${selectedItem.type} is empty -- mass: 0.00 g`);
      return;
    }
    const totalMass = selectedItem.contents.reduce((sum, s) => sum + s.amount_ml * 1.0, 0);
    showNotification(`Analytical Balance -- Mass: ${totalMass.toFixed(2)} g`);
  };

  const handleSink = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    updateBenchItemContents(selectedBenchItem, selectedItem.contents, 25);
    showNotification(`Rinsed ${selectedItem.type} -- cooled to 25\u00B0C`);
  };

  const handleWashBottle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!selectedItem || !selectedBenchItem) {
      showNotification("Select a container first");
      return;
    }
    const newContents = [...selectedItem.contents, { formula: "H2O", amount_ml: 10, phase: "l", color: "#e8f4f8" }];
    updateBenchItemContents(selectedBenchItem, newContents);
    showNotification("Added 10mL distilled water");
  };

  return (
    <StationShell>
      {/* Test tube rack -- detailed with tube slots */}
      <group position={[-1.2, 0.42, -1.05]}>
        {/* Rack body */}
        <mesh>
          <boxGeometry args={[0.42, 0.08, 0.15]} />
          <meshStandardMaterial color="#78716c" roughness={0.6} />
        </mesh>
        {/* Individual tube holes -- 5 cylinders */}
        {([-0.16, -0.08, 0, 0.08, 0.16] as number[]).map((x, i) => (
          <mesh key={i} position={[x, 0.06, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.06, 10]} />
            <meshStandardMaterial color="#58534e" roughness={0.7} />
          </mesh>
        ))}
        {/* Test tubes in rack */}
        {([-0.16, -0.08, 0, 0.08] as number[]).map((x, i) => (
          <mesh key={i} position={[x, 0.14, 0]}>
            <cylinderGeometry args={[0.012, 0.01, 0.12, 10]} />
            <meshPhysicalMaterial color="#c8e8ff" transparent opacity={0.3} roughness={0.05} transmission={0.78} />
          </mesh>
        ))}
      </group>
      <Html position={[-1.2, 0.6, -1.05]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Test Tube Rack</span>
      </Html>

      {/* Ring stand with adjustable ring and wire gauze */}
      <group position={[0.5, 0.0, -0.8]}>
        {/* Vertical rod */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 1.0, 8]} />
          <meshStandardMaterial color="#888890" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Heavy base */}
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[0.22, 0.05, 0.15]} />
          <meshStandardMaterial color="#606068" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Adjustable ring clamp arm */}
        <mesh position={[0.06, 0.38, 0]}>
          <boxGeometry args={[0.14, 0.018, 0.018]} />
          <meshStandardMaterial color="#707078" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Ring (torus) */}
        <mesh position={[0.18, 0.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.065, 0.008, 8, 24]} />
          <meshStandardMaterial color="#888890" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Wire gauze (flat square on ring) */}
        <mesh position={[0.18, 0.4, 0]}>
          <boxGeometry args={[0.13, 0.006, 0.13]} />
          <meshStandardMaterial color="#999980" roughness={0.8} metalness={0.3} />
        </mesh>
        {/* Gauze grid lines */}
        {([-0.04, 0, 0.04] as number[]).map((v, i) => (
          <mesh key={`gx${i}`} position={[0.18 + v, 0.407, 0]}>
            <boxGeometry args={[0.005, 0.004, 0.13]} />
            <meshStandardMaterial color="#777760" roughness={0.9} />
          </mesh>
        ))}
        {([-0.04, 0, 0.04] as number[]).map((v, i) => (
          <mesh key={`gz${i}`} position={[0.18, 0.407, v]}>
            <boxGeometry args={[0.13, 0.004, 0.005]} />
            <meshStandardMaterial color="#777760" roughness={0.9} />
          </mesh>
        ))}
      </group>
      <Html position={[0.5, 0.72, -0.8]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Ring Stand</span>
      </Html>

      {/* Sink with faucet -- interactive */}
      <InteractiveTool
        name="Sink"
        description="Click to rinse selected container to room temp"
        onClick={handleSink}
        position={[1.55, 0.06, -0.6]}
        hitboxSize={[0.5, 0.35, 0.42]}
        labelOffset={[0, 0.35, 0]}
      >
        {/* Sink basin */}
        <mesh castShadow>
          <boxGeometry args={[0.45, 0.12, 0.38]} />
          <meshStandardMaterial color="#c0c8cc" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Basin interior (hollow appearance) */}
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.38, 0.08, 0.3]} />
          <meshStandardMaterial color="#a8b4b8" metalness={0.4} roughness={0.4} />
        </mesh>
        {/* Drain circle */}
        <mesh position={[0, 0.065, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.01, 12]} />
          <meshStandardMaterial color="#707878" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Faucet base */}
        <mesh position={[0, 0.12, -0.16]}>
          <cylinderGeometry args={[0.018, 0.022, 0.06, 10]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Curved faucet pipe */}
        <mesh position={[0, 0.2, -0.12]} rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.14, 8]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Faucet spout (horizontal) */}
        <mesh position={[0, 0.24, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.012, 0.1, 8]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Hot/cold knobs */}
        <mesh position={[-0.06, 0.14, -0.165]}>
          <cylinderGeometry args={[0.014, 0.014, 0.02, 8]} />
          <meshStandardMaterial color="#cc3333" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0.06, 0.14, -0.165]}>
          <cylinderGeometry args={[0.014, 0.014, 0.02, 8]} />
          <meshStandardMaterial color="#3366cc" metalness={0.5} roughness={0.3} />
        </mesh>
      </InteractiveTool>

      {/* Wash bottle -- interactive */}
      <InteractiveTool
        name="Wash Bottle"
        description="Click to add 10mL distilled water"
        onClick={handleWashBottle}
        position={[1.1, 0.06, 0.2]}
        hitboxSize={[0.12, 0.35, 0.12]}
        labelOffset={[0, 0.35, 0]}
      >
        {/* Body */}
        <mesh castShadow>
          <cylinderGeometry args={[0.038, 0.042, 0.22, 12]} />
          <meshStandardMaterial color="#ddee88" roughness={0.5} transparent opacity={0.85} />
        </mesh>
        {/* Cap */}
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.03, 0.038, 0.04, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        {/* Nozzle tube */}
        <mesh position={[0, 0.2, 0]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.005, 0.007, 0.1, 8]} />
          <meshStandardMaterial color="#cccccc" roughness={0.4} />
        </mesh>
        {/* "DI Water" label strip */}
        <mesh position={[0, 0.0, 0.043]}>
          <boxGeometry args={[0.05, 0.04, 0.002]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      </InteractiveTool>

      {/* Spatula rack -- horizontal bars */}
      <group position={[-0.3, 0.38, -1.1]}>
        {/* Rack back plate */}
        <mesh>
          <boxGeometry args={[0.22, 0.12, 0.02]} />
          <meshStandardMaterial color="#5a5a60" roughness={0.5} metalness={0.4} />
        </mesh>
        {/* Horizontal bars */}
        {([0.02, -0.02] as number[]).map((y, i) => (
          <mesh key={i} position={[0, y, 0.02]}>
            <boxGeometry args={[0.2, 0.012, 0.015]} />
            <meshStandardMaterial color="#888890" metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
        {/* Spatulas hanging on rack */}
        {([-0.07, -0.02, 0.06] as number[]).map((x, i) => (
          <mesh key={i} position={[x, -0.04, 0.015]}>
            <boxGeometry args={[0.008, 0.14, 0.004]} />
            <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {/* Lab notebook / clipboard on bench */}
      <group position={[0.0, 0.075, 0.6]}>
        {/* Clipboard backing */}
        <mesh rotation={[-Math.PI / 2, 0, 0.15]}>
          <boxGeometry args={[0.22, 0.28, 0.008]} />
          <meshStandardMaterial color="#8b6914" roughness={0.7} />
        </mesh>
        {/* Paper */}
        <mesh position={[0.005, 0.004, -0.005]} rotation={[-Math.PI / 2, 0, 0.15]}>
          <boxGeometry args={[0.18, 0.24, 0.003]} />
          <meshStandardMaterial color="#f5f0e8" roughness={0.9} />
        </mesh>
        {/* Clip at top */}
        <mesh position={[0, 0.006, -0.11]} rotation={[-Math.PI / 2, 0, 0.15]}>
          <boxGeometry args={[0.07, 0.025, 0.006]} />
          <meshStandardMaterial color="#888888" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Pen resting on notebook */}
        <mesh position={[0.08, 0.007, 0.05]} rotation={[-Math.PI / 2, 0, 0.6]}>
          <cylinderGeometry args={[0.005, 0.005, 0.18, 6]} />
          <meshStandardMaterial color="#2244aa" roughness={0.4} />
        </mesh>
      </group>
      <Html position={[0.0, 0.2, 0.6]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Lab Notebook</span>
      </Html>

      {/* Paper towel dispenser on back wall */}
      <group position={[-0.7, 0.85, -1.22]}>
        {/* Box body */}
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.28, 0.1]} />
          <meshStandardMaterial color="#e8e8e0" roughness={0.6} />
        </mesh>
        {/* Front panel detail */}
        <mesh position={[0, 0, 0.051]}>
          <boxGeometry args={[0.18, 0.1, 0.005]} />
          <meshStandardMaterial color="#d0d0c8" roughness={0.7} />
        </mesh>
        {/* Dispenser slot */}
        <mesh position={[0, -0.1, 0.051]}>
          <boxGeometry args={[0.14, 0.015, 0.003]} />
          <meshStandardMaterial color="#aaaaaa" roughness={0.5} />
        </mesh>
      </group>
      <Html position={[-0.7, 1.08, -1.22]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Paper Towels</span>
      </Html>

      {/* Lab timer / stopwatch on wall */}
      <group position={[0.4, 0.88, -1.22]}>
        {/* Timer body */}
        <mesh castShadow>
          <boxGeometry args={[0.12, 0.08, 0.03]} />
          <meshStandardMaterial color="#1a1a22" roughness={0.4} metalness={0.3} />
        </mesh>
        {/* Digital display */}
        <mesh position={[0, 0.01, 0.016]}>
          <boxGeometry args={[0.08, 0.035, 0.005]} />
          <meshStandardMaterial color="#001100" emissive="#00ff66" emissiveIntensity={0.9} roughness={0.2} />
        </mesh>
        {/* Buttons */}
        {([-0.03, 0, 0.03] as number[]).map((x, i) => (
          <mesh key={i} position={[x, -0.025, 0.016]}>
            <boxGeometry args={[0.018, 0.012, 0.005]} />
            <meshStandardMaterial color="#334455" roughness={0.5} />
          </mesh>
        ))}
      </group>
      <Html position={[0.4, 1.02, -1.22]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Lab Timer</span>
      </Html>

      {/* Utility outlets on back wall */}
      {([0.9, 1.1] as number[]).map((x, i) => (
        <group key={i} position={[x, 0.7, -1.22]}>
          {/* Outlet plate */}
          <mesh>
            <boxGeometry args={[0.06, 0.09, 0.01]} />
            <meshStandardMaterial color="#e8e4dc" roughness={0.6} />
          </mesh>
          {/* Socket holes */}
          <mesh position={[0, 0.015, 0.006]}>
            <boxGeometry args={[0.012, 0.025, 0.003]} />
            <meshStandardMaterial color="#333333" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.015, 0.006]}>
            <boxGeometry args={[0.012, 0.025, 0.003]} />
            <meshStandardMaterial color="#333333" roughness={0.7} />
          </mesh>
          {/* Screw heads */}
          <mesh position={[0, 0.038, 0.006]}>
            <cylinderGeometry args={[0.004, 0.004, 0.003, 6]} />
            <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.038, 0.006]}>
            <cylinderGeometry args={[0.004, 0.004, 0.003, 6]} />
            <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Bunsen burner -- detailed */}
      <InteractiveTool
        name="Bunsen Burner"
        description="Click to heat selected container +50\u00B0C"
        onClick={handleBunsenBurner}
        position={[1.5, 0, 0.5]}
        hitboxSize={[0.18, 0.45, 0.16]}
        labelOffset={[0, 0.5, 0]}
      >
        {/* Base */}
        <mesh position={[0, 0.03, 0]} castShadow>
          <boxGeometry args={[0.14, 0.05, 0.12]} />
          <meshStandardMaterial color="#3a3a40" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Barrel */}
        <mesh position={[0, 0.14, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.03, 0.18, 14]} />
          <meshStandardMaterial color="#52525b" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Air collar ring */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.032, 0.032, 0.025, 14]} />
          <meshStandardMaterial color="#444450" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Gas inlet tube (side) */}
        <mesh position={[-0.06, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.007, 0.007, 0.1, 8]} />
          <meshStandardMaterial color="#666670" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Flame effect when active */}
        {burnerActive && (
          <>
            <mesh position={[0, 0.28, 0]}>
              <coneGeometry args={[0.03, 0.12, 8]} />
              <meshStandardMaterial color="#3388ff" emissive="#3388ff" emissiveIntensity={2} transparent opacity={0.7} />
            </mesh>
            <mesh position={[0, 0.35, 0]}>
              <coneGeometry args={[0.02, 0.08, 8]} />
              <meshStandardMaterial color="#ffaa22" emissive="#ffaa22" emissiveIntensity={2} transparent opacity={0.6} />
            </mesh>
            <pointLight position={[0, 0.35, 0]} color="#ffaa22" intensity={0.5} distance={1.5} />
          </>
        )}
      </InteractiveTool>

      {/* Analytical balance -- enclosed glass housing */}
      <InteractiveTool
        name="Analytical Balance"
        description="Click to weigh selected container"
        onClick={handleBalance}
        position={[-1.5, 0, 0.8]}
        hitboxSize={[0.52, 0.28, 0.42]}
        labelOffset={[0, 0.4, 0]}
      >
        {/* Base platform */}
        <mesh position={[0, 0.035, 0]} receiveShadow>
          <boxGeometry args={[0.48, 0.06, 0.38]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* Housing frame */}
        <mesh position={[0, 0.13, 0]}>
          <boxGeometry args={[0.44, 0.12, 0.34]} />
          <meshStandardMaterial color="#1c1917" roughness={0.5} />
        </mesh>
        {/* Glass front panel */}
        <mesh position={[0, 0.13, -0.17]}>
          <boxGeometry args={[0.42, 0.1, 0.01]} />
          <meshPhysicalMaterial color="#c8e4ff" transparent opacity={0.18} roughness={0.05} transmission={0.82} />
        </mesh>
        {/* Glass side panels */}
        <mesh position={[0.22, 0.13, 0]}>
          <boxGeometry args={[0.01, 0.1, 0.32]} />
          <meshPhysicalMaterial color="#c8e4ff" transparent opacity={0.18} roughness={0.05} transmission={0.82} />
        </mesh>
        <mesh position={[-0.22, 0.13, 0]}>
          <boxGeometry args={[0.01, 0.1, 0.32]} />
          <meshPhysicalMaterial color="#c8e4ff" transparent opacity={0.18} roughness={0.05} transmission={0.82} />
        </mesh>
        {/* Weighing pan inside */}
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.01, 16]} />
          <meshStandardMaterial color="#cccccc" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* Pan support column */}
        <mesh position={[0, 0.075, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.025, 8]} />
          <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Digital display */}
        <mesh position={[0, 0.18, -0.172]}>
          <boxGeometry args={[0.18, 0.04, 0.005]} />
          <meshStandardMaterial color="#001100" emissive="#00ff66" emissiveIntensity={0.7} roughness={0.2} />
        </mesh>
        {/* Level bubble indicator */}
        <mesh position={[0.2, 0.065, 0.02]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshStandardMaterial color="#aaffaa" transparent opacity={0.6} roughness={0.1} />
        </mesh>
      </InteractiveTool>

    </StationShell>
  );
}
