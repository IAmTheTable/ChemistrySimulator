import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitalData } from "../../types/structure";

interface BohrModelProps {
  orbitalData: OrbitalData;
  position: [number, number, number];
}

const SHELL_COLORS = ["#f472b6", "#a78bfa", "#60a5fa", "#34d399", "#f59e0b", "#ef4444", "#06b6d4"];
const ELECTRON_COLOR = "#22d3ee";
const NUCLEUS_COLOR = "#f472b6";

function Electron({ shellRadius, index, total, speed }: { shellRadius: number; index: number; total: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  const startAngle = (index / total) * Math.PI * 2;

  useFrame(() => {
    if (!ref.current) return;
    const t = startAngle + performance.now() * 0.001 * speed;
    ref.current.position.x = Math.cos(t) * shellRadius;
    ref.current.position.z = Math.sin(t) * shellRadius;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.08, 12, 12]} />
      <meshStandardMaterial color={ELECTRON_COLOR} emissive={ELECTRON_COLOR} emissiveIntensity={0.5} />
    </mesh>
  );
}

function ShellRing({ radius, color }: { radius: number; color: string }) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
    }
    return pts;
  }, [radius]);

  return <Line points={points} color={color} transparent opacity={0.4} lineWidth={1} />;
}

export default function BohrModel({ orbitalData, position }: BohrModelProps) {
  const shells = new Map<number, number>();
  for (const orbital of orbitalData.orbitals) {
    shells.set(orbital.n, (shells.get(orbital.n) ?? 0) + orbital.electrons);
  }

  const shellEntries = Array.from(shells.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <group position={position}>
      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color={NUCLEUS_COLOR} emissive={NUCLEUS_COLOR} emissiveIntensity={0.3} roughness={0.3} />
      </mesh>

      {/* Element symbol */}
      <Html center distanceFactor={8}>
        <span style={{ color: "white", fontWeight: "bold", fontSize: "14px", textShadow: "0 0 4px #000" }}>
          {orbitalData.element.substring(0, 2)}
        </span>
      </Html>

      {/* Shell rings + orbiting electrons */}
      {shellEntries.map(([n, electronCount], shellIndex) => {
        const shellRadius = n * 0.8 + 0.3;
        const color = SHELL_COLORS[shellIndex % SHELL_COLORS.length];
        const speed = 0.5 / n;

        return (
          <group key={n}>
            <ShellRing radius={shellRadius} color={color} />
            <group rotation={[Math.PI / 3, 0, 0]}>
              <ShellRing radius={shellRadius} color={color} />
            </group>

            {Array.from({ length: electronCount }, (_, i) => (
              <Electron key={i} shellRadius={shellRadius} index={i} total={electronCount} speed={speed} />
            ))}

            <Html position={[shellRadius + 0.2, 0.3, 0]} center distanceFactor={10}>
              <span style={{ color: color, fontSize: "10px", whiteSpace: "nowrap" }}>
                n={n} ({electronCount}e⁻)
              </span>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
