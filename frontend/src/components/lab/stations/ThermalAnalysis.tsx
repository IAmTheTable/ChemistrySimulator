import StationShell from "./StationShell";

export default function ThermalAnalysis() {
  return (
    <StationShell wallColor="#2e2820">
      {/* ── Calorimeter ── */}
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

      {/* ── Ice bath (shallow box) ── */}
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

      {/* ── Bunsen burner / hot plate ── */}
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

      {/* ── Thermometer standing in holder ── */}
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

      {/* ── Sample holder cups (small cylinders) ── */}
      {([[-1.5, 0.42, -1.06], [-1.2, 0.42, -1.06], [-0.9, 0.42, -1.06]] as [number, number, number][]).map(
        (pos, i) => (
          <mesh key={i} position={pos}>
            <cylinderGeometry args={[0.03, 0.03, 0.055, 10]} />
            <meshStandardMaterial color="#c0b090" roughness={0.5} metalness={0.2} />
          </mesh>
        )
      )}

      {/* DSC/TGA instrument on shelf */}
      <mesh position={[1.0, 0.42, -1.05]} castShadow>
        <boxGeometry args={[0.55, 0.15, 0.2]} />
        <meshStandardMaterial color="#2a2a35" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[1.0, 0.52, -1.06]}>
        <boxGeometry args={[0.28, 0.08, 0.01]} />
        <meshStandardMaterial
          color="#000811"
          emissive="#ffaa00"
          emissiveIntensity={0.45}
          roughness={0.2}
        />
      </mesh>
    </StationShell>
  );
}
