import type { AtomData } from "../../types/structure";

interface AtomSphereProps {
  atom: AtomData;
  mode: string;
  onClick?: () => void;
}

const RADIUS_SCALE: Record<string, number> = {
  "ball-and-stick": 0.4,
  "space-filling": 2.0,
  "wireframe": 0.15,
  "orbital": 0.3,
};

export default function AtomSphere({ atom, mode, onClick }: AtomSphereProps) {
  const scale = RADIUS_SCALE[mode] ?? 0.4;
  const radius = atom.radius * scale;

  return (
    <mesh
      position={[atom.x, atom.y, atom.z]}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color={atom.color} metalness={0.1} roughness={0.6} />
    </mesh>
  );
}
