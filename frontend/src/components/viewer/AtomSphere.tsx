import { useMemo } from "react";
import * as THREE from "three";
import type { AtomData } from "../../types/structure";

interface AtomSphereProps {
  atom: AtomData;
  mode: string;
  charge?: number | null;
  onClick?: () => void;
}

// Van der Waals radii (Å) — much larger than covalent radii, used for space-filling
const VDW_RADII: Record<string, number> = {
  H: 1.20, He: 1.40, C: 1.70, N: 1.55, O: 1.52, F: 1.47, Ne: 1.54,
  Na: 2.27, Mg: 1.73, Al: 1.84, Si: 2.10, P: 1.80, S: 1.80, Cl: 1.75,
  Ar: 1.88, K: 2.75, Ca: 2.31, Fe: 2.04, Cu: 1.40, Zn: 2.10, Br: 1.85,
  Ag: 1.72, I: 1.98, Au: 1.66, Pb: 2.02,
};

function chargeToColor(charge: number): string {
  const clamped = Math.max(-1, Math.min(1, charge * 3));
  if (clamped < 0) {
    const t = Math.abs(clamped);
    return `rgb(255,${Math.round(255 * (1 - t))},${Math.round(255 * (1 - t))})`;
  }
  const t = clamped;
  return `rgb(${Math.round(255 * (1 - t))},${Math.round(255 * (1 - t))},255)`;
}

export default function AtomSphere({ atom, mode, charge, onClick }: AtomSphereProps) {
  const radius = useMemo(() => {
    switch (mode) {
      case "ball-and-stick":
        return atom.radius * 0.25; // Small spheres, bonds are the focus
      case "space-filling":
        return (VDW_RADII[atom.symbol] ?? atom.radius * 2.0) * 0.5; // Large VdW radii
      case "wireframe":
        return 0.08; // Tiny fixed-size dots
      case "orbital":
        return atom.radius * 0.2;
      default:
        return atom.radius * 0.25;
    }
  }, [atom.radius, atom.symbol, mode]);

  const color = useMemo(() => {
    if (charge != null) return chargeToColor(charge);
    return atom.color;
  }, [atom.color, charge]);

  const materialProps = useMemo(() => {
    switch (mode) {
      case "space-filling":
        return { metalness: 0.05, roughness: 0.4, side: THREE.FrontSide };
      case "wireframe":
        return { metalness: 0, roughness: 1, side: THREE.FrontSide };
      default:
        return { metalness: 0.15, roughness: 0.5, side: THREE.FrontSide };
    }
  }, [mode]);

  return (
    <mesh
      position={[atom.x, atom.y, atom.z]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      <sphereGeometry args={[radius, mode === "wireframe" ? 8 : 24, mode === "wireframe" ? 8 : 24]} />
      <meshStandardMaterial color={color} {...materialProps} />
    </mesh>
  );
}
