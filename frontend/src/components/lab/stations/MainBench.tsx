export default function MainBench() {
  return (
    <group>
      {/* Bench back wall / shelf */}
      <mesh position={[0, 0.6, -1.25]} castShadow>
        <boxGeometry args={[4, 1.1, 0.05]} />
        <meshStandardMaterial color="#3f3f46" roughness={0.9} />
      </mesh>

      {/* Shelf */}
      <mesh position={[0, 0.35, -1.1]} castShadow>
        <boxGeometry args={[3.8, 0.04, 0.3]} />
        <meshStandardMaterial color="#44403c" roughness={0.8} />
      </mesh>

      {/* Test tube rack on shelf */}
      <mesh position={[-1.2, 0.42, -1.05]}>
        <boxGeometry args={[0.4, 0.1, 0.15]} />
        <meshStandardMaterial color="#78716c" />
      </mesh>

      {/* Bunsen burner spot (placeholder cylinder) */}
      <mesh position={[1.5, 0.12, 0.5]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.15, 16]} />
        <meshStandardMaterial color="#52525b" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Analytics balance area marker */}
      <mesh position={[-1.5, 0.06, 0.8]} receiveShadow>
        <boxGeometry args={[0.5, 0.02, 0.4]} />
        <meshStandardMaterial color="#1c1917" roughness={0.5} />
      </mesh>
    </group>
  );
}
