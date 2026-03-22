import { useMemo } from "react";
import type { AtomData } from "../../types/structure";

interface AtomSphereProps {
  atom: AtomData;
  mode: string;
  charge?: number | null;
  onClick?: () => void;
}

const RADIUS_SCALE: Record<string, number> = {
  "ball-and-stick": 0.4,
  "space-filling": 2.0,
  "wireframe": 0.15,
  "orbital": 0.3,
};

/**
 * Map a partial charge to a color.
 * Negative charges -> red, positive -> blue, neutral -> white.
 */
function chargeToColor(charge: number): string {
  const clamped = Math.max(-1, Math.min(1, charge * 3));
  if (clamped < 0) {
    // Negative: white to red
    const t = Math.abs(clamped);
    const r = 255;
    const g = Math.round(255 * (1 - t));
    const b = Math.round(255 * (1 - t));
    return `rgb(${r},${g},${b})`;
  }
  // Positive: white to blue
  const t = clamped;
  const r = Math.round(255 * (1 - t));
  const g = Math.round(255 * (1 - t));
  const b = 255;
  return `rgb(${r},${g},${b})`;
}

export default function AtomSphere({ atom, mode, charge, onClick }: AtomSphereProps) {
  const scale = RADIUS_SCALE[mode] ?? 0.4;
  const radius = atom.radius * scale;

  const color = useMemo(() => {
    if (charge != null) {
      return chargeToColor(charge);
    }
    return atom.color;
  }, [atom.color, charge]);

  return (
    <mesh
      position={[atom.x, atom.y, atom.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color={color} metalness={0.1} roughness={0.6} />
    </mesh>
  );
}
