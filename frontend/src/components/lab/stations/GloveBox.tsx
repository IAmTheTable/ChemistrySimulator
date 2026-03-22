import { Html } from "@react-three/drei";
import StationShell, { LABEL_STYLE } from "./StationShell";

export default function GloveBox() {
  return (
    <StationShell wallColor="#303035" showShelf={false}>
      {/* ── Main glove box body — frame ── */}
      <Html position={[0, 1.12, -0.4]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Inert Atmosphere Glove Box</span>
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
      <Html position={[1.52, 0.98, -0.4]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>Airlock</span>
      </Html>
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

      {/* ── Gas line connections at top ── */}
      <Html position={[0, 1.3, -0.4]} center distanceFactor={10}>
        <span style={LABEL_STYLE}>N₂/Ar Gas Lines</span>
      </Html>
      {/* Argon line pipe */}
      <mesh position={[-0.6, 1.02, -0.4]}>
        <cylinderGeometry args={[0.018, 0.018, 0.25, 8]} />
        <meshStandardMaterial color="#888890" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Nitrogen line pipe */}
      <mesh position={[0.6, 1.02, -0.4]}>
        <cylinderGeometry args={[0.018, 0.018, 0.25, 8]} />
        <meshStandardMaterial color="#888890" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Gas valve knobs */}
      <mesh position={[-0.6, 1.16, -0.4]}>
        <cylinderGeometry args={[0.032, 0.032, 0.025, 8]} />
        <meshStandardMaterial color="#cc6600" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0.6, 1.16, -0.4]}>
        <cylinderGeometry args={[0.032, 0.032, 0.025, 8]} />
        <meshStandardMaterial color="#3366cc" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Pressure gauge on top */}
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
    </StationShell>
  );
}
