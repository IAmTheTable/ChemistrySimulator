import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { MoleculeData, OrbitalData } from "../../types/structure";
import type { ChargeAtom } from "../../api/quantum";
import AtomSphere from "./AtomSphere";
import BondCylinder from "./BondCylinder";
import MoleculeLabels from "./MoleculeLabels";
import BohrModel from "./OrbitalMesh";

interface MoleculeViewerProps {
  molecule: MoleculeData | null;
  orbitalData?: OrbitalData | null;
  mode: string;
  showLabels: boolean;
  chargeAtoms?: ChargeAtom[] | null;
  isOrbitalView?: boolean;
}

export default function MoleculeViewer({
  molecule,
  orbitalData,
  mode,
  showLabels,
  chargeAtoms,
  isOrbitalView = false,
}: MoleculeViewerProps) {
  const { centeredAtoms, cameraZ } = useMemo(() => {
    if (!molecule) return { centeredAtoms: [], cameraZ: 5 };
    const cx = molecule.atoms.reduce((s, a) => s + a.x, 0) / molecule.atoms.length;
    const cy = molecule.atoms.reduce((s, a) => s + a.y, 0) / molecule.atoms.length;
    const cz = molecule.atoms.reduce((s, a) => s + a.z, 0) / molecule.atoms.length;
    const centered = molecule.atoms.map((a) => ({ ...a, x: a.x - cx, y: a.y - cy, z: a.z - cz }));
    const maxDist = Math.max(...centered.map((a) => Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2)), 0.01);
    return { centeredAtoms: centered, cameraZ: Math.max(maxDist * 2.5, 5) };
  }, [molecule]);

  // Build a charge map by atom index
  const chargeMap = useMemo(() => {
    if (!chargeAtoms) return null;
    const map = new Map<number, number>();
    chargeAtoms.forEach((ca) => map.set(ca.index, ca.partial_charge));
    return map;
  }, [chargeAtoms]);

  if (!molecule) return null;

  return (
    <Canvas camera={{ position: [0, 0, cameraZ], fov: 50 }} style={{ width: "100%", height: "100%" }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} />

      <OrbitControls enablePan enableZoom />

      {/* Atoms */}
      {centeredAtoms.map((atom) => (
        <AtomSphere
          key={atom.index}
          atom={atom}
          mode={mode}
          charge={chargeMap?.get(atom.index) ?? null}
        />
      ))}

      {/* Bonds -- hidden in space-filling mode */}
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

      {/* Bohr model -- nucleus + shell rings + orbiting electrons */}
      {isOrbitalView && mode === "orbital" && orbitalData && (
        <BohrModel orbitalData={orbitalData} position={[0, 0, 0]} />
      )}
    </Canvas>
  );
}
