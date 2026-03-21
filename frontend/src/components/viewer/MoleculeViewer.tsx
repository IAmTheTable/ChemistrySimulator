import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { MoleculeData, OrbitalData } from "../../types/structure";
import AtomSphere from "./AtomSphere";
import BondCylinder from "./BondCylinder";
import MoleculeLabels from "./MoleculeLabels";
import OrbitalMesh from "./OrbitalMesh";

interface MoleculeViewerProps {
  molecule: MoleculeData | null;
  orbitalData?: OrbitalData | null;
  mode: string;
  showLabels: boolean;
}

export default function MoleculeViewer({
  molecule,
  orbitalData,
  mode,
  showLabels,
}: MoleculeViewerProps) {
  if (!molecule) return null;

  // Center the molecule at the origin
  const cx = molecule.atoms.reduce((s, a) => s + a.x, 0) / molecule.atoms.length;
  const cy = molecule.atoms.reduce((s, a) => s + a.y, 0) / molecule.atoms.length;
  const cz = molecule.atoms.reduce((s, a) => s + a.z, 0) / molecule.atoms.length;

  const centeredAtoms = molecule.atoms.map((a) => ({
    ...a,
    x: a.x - cx,
    y: a.y - cy,
    z: a.z - cz,
  }));

  // Determine camera distance from molecule bounds
  const maxDist = Math.max(
    ...centeredAtoms.map((a) => Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2)),
    0.01, // guard against single-atom molecules collapsing to 0
  );
  const cameraZ = Math.max(maxDist * 2.5, 5);

  return (
    <Canvas camera={{ position: [0, 0, cameraZ], fov: 50 }} style={{ width: "100%", height: "100%" }}>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} />

      {/* Camera controls */}
      <OrbitControls enablePan enableZoom />

      {/* Atoms */}
      {centeredAtoms.map((atom) => (
        <AtomSphere key={atom.index} atom={atom} mode={mode} />
      ))}

      {/* Bonds — hidden in space-filling mode */}
      {mode !== "space-filling" &&
        molecule.bonds.map((bond, i) => (
          <BondCylinder
            key={i}
            atom1={centeredAtoms[bond.atom1]}
            atom2={centeredAtoms[bond.atom2]}
            order={bond.order}
            mode={mode}
          />
        ))}

      {/* Atom symbol labels */}
      <MoleculeLabels atoms={centeredAtoms} visible={showLabels} />

      {/* Orbitals — rendered when mode is "orbital" and orbitalData is available */}
      {mode === "orbital" && orbitalData && (
        <group>
          {orbitalData.orbitals.map((orbital, i) => (
            <OrbitalMesh key={i} orbital={orbital} position={[0, 0, 0]} />
          ))}
        </group>
      )}
    </Canvas>
  );
}
