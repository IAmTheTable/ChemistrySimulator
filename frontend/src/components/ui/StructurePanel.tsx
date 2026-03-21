import { useLabStore } from "../../stores/labStore";
import { useCommonStructure, useOrbitals } from "../../api/structures";
import MoleculeViewer from "../viewer/MoleculeViewer";

export default function StructurePanel() {
  const { formula, atomicNumber, mode, showLabels } = useLabStore((s) => s.structureViewer);
  const setStructureMode = useLabStore((s) => s.setStructureMode);
  const toggleStructureLabels = useLabStore((s) => s.toggleStructureLabels);

  const { data: molecule } = useCommonStructure(formula);
  const { data: orbitalData } = useOrbitals(atomicNumber);

  const modes = [
    { id: "ball-and-stick", label: "Ball & Stick" },
    { id: "space-filling", label: "CPK" },
    { id: "wireframe", label: "Wireframe" },
    { id: "orbital", label: "Orbital" },
  ] as const;

  if (!formula && !atomicNumber) {
    return <p className="text-xs text-gray-600">Select a substance or element to view its structure</p>;
  }

  // When viewing orbitals only (no molecule), provide a minimal stub so MoleculeViewer
  // can render the orbital meshes (it needs a molecule with at least one atom for centering).
  const moleculeForViewer =
    molecule ??
    (orbitalData
      ? {
          formula: orbitalData.element,
          name: orbitalData.element,
          atoms: [{ index: 0, symbol: orbitalData.element, x: 0, y: 0, z: 0, color: "#aaaaff", radius: 1.0 }],
          bonds: [],
          properties: {},
        }
      : null);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-2">
        {molecule && <div className="text-sm font-semibold">{molecule.name}</div>}
        {molecule && <div className="text-xs text-gray-400">{molecule.formula}</div>}
        {orbitalData && !molecule && (
          <>
            <div className="text-sm font-semibold">{orbitalData.element} Orbitals</div>
            <div className="text-xs text-gray-400">{orbitalData.electron_configuration}</div>
          </>
        )}
      </div>

      {/* Mode toggles */}
      <div className="flex gap-1 mb-2">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setStructureMode(m.id)}
            className={`flex-1 text-[10px] py-1 rounded transition-colors ${
              mode === m.id ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Labels toggle */}
      <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-2 cursor-pointer">
        <input type="checkbox" checked={showLabels} onChange={toggleStructureLabels} className="accent-blue-500" />
        Show labels
      </label>

      {/* 3D Viewer */}
      <div className="flex-1 min-h-[200px] bg-gray-950 rounded overflow-hidden">
        <MoleculeViewer
          molecule={moleculeForViewer}
          orbitalData={orbitalData ?? null}
          mode={mode}
          showLabels={showLabels}
        />
      </div>

      {/* Properties */}
      {molecule?.properties && (
        <div className="mt-2 text-xs text-gray-500 space-y-0.5">
          {molecule.properties.molecular_weight != null && (
            <div>MW: {String(molecule.properties.molecular_weight as string | number)} g/mol</div>
          )}
        </div>
      )}
    </div>
  );
}
