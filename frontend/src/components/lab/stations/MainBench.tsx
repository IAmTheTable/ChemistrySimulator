import { useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useLabStore } from "../../../stores/labStore";
import StationShell, { LABEL_STYLE } from "./StationShell";
import { useStationTool } from "./useStationTool";

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

  return (
    <StationShell>
      {/* Test tube rack on shelf */}
      <mesh position={[-1.2, 0.42, -1.05]}>
        <boxGeometry args={[0.4, 0.1, 0.15]} />
        <meshStandardMaterial color="#78716c" />
      </mesh>
      <Html position={[-1.2, 0.58, -1.05]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Test Tube Rack</span>
      </Html>

      {/* Bunsen burner spot (placeholder cylinder) */}
      <group onClick={handleBunsenBurner}>
        <mesh position={[1.5, 0.12, 0.5]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.15, 16]} />
          <meshStandardMaterial color="#52525b" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Flame effect when active */}
        {burnerActive && (
          <>
            <mesh position={[1.5, 0.28, 0.5]}>
              <coneGeometry args={[0.03, 0.12, 8]} />
              <meshStandardMaterial color="#3388ff" emissive="#3388ff" emissiveIntensity={2} transparent opacity={0.7} />
            </mesh>
            <mesh position={[1.5, 0.35, 0.5]}>
              <coneGeometry args={[0.02, 0.08, 8]} />
              <meshStandardMaterial color="#ffaa22" emissive="#ffaa22" emissiveIntensity={2} transparent opacity={0.6} />
            </mesh>
            <pointLight position={[1.5, 0.35, 0.5]} color="#ffaa22" intensity={0.5} distance={1.5} />
          </>
        )}
      </group>
      <Html position={[1.5, 0.35, 0.5]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Bunsen Burner</span>
      </Html>

      {/* Analytics balance area marker */}
      <mesh position={[-1.5, 0.06, 0.8]} receiveShadow onClick={handleBalance}>
        <boxGeometry args={[0.5, 0.02, 0.4]} />
        <meshStandardMaterial color="#1c1917" roughness={0.5} />
      </mesh>
      <Html position={[-1.5, 0.22, 0.8]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Analytical Balance</span>
      </Html>

    </StationShell>
  );
}

