import { Html } from "@react-three/drei";
import type { AtomData } from "../../types/structure";

interface MoleculeLabelsProps {
  atoms: AtomData[];
  visible: boolean;
}

export default function MoleculeLabels({ atoms, visible }: MoleculeLabelsProps) {
  if (!visible) return null;
  return (
    <group>
      {atoms.map((atom) => (
        <Html key={atom.index} position={[atom.x, atom.y + 0.3, atom.z]} center>
          <span
            style={{
              color: atom.color,
              fontSize: "10px",
              fontWeight: "bold",
              textShadow: "0 0 3px #000",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {atom.symbol}
          </span>
        </Html>
      ))}
    </group>
  );
}
