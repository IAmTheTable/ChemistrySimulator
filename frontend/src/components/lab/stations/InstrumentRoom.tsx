export default function InstrumentRoom() {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 0.6, -1.25]} castShadow>
        <boxGeometry args={[4, 1.1, 0.05]} />
        <meshStandardMaterial color="#2d3142" roughness={0.9} />
      </mesh>

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

      {/* ── Instrument 1: Mass spectrometer (large box, left) ── */}
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

      {/* ── Instrument 2: HPLC / chromatograph (medium, center-left) ── */}
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

      {/* ── Instrument 3: UV/Vis spectrophotometer (medium, center-right) ── */}
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

      {/* ── Instrument 4: NMR / large analyzer (right, tall) ── */}
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

      {/* ── Computer workstation ── */}
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
    </group>
  );
}
