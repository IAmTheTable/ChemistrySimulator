import { useMemo } from "react";
import { useLabStore } from "../../stores/labStore";
import { useCommonStructure, useOrbitals } from "../../api/structures";
import { useAnalysis } from "../../api/quantum";
import type { BondLengthInfo, BondAngleInfo } from "../../api/quantum";
import MoleculeViewer from "../viewer/MoleculeViewer";

/** Show unique bond lengths (deduplicate by atom pair type) */
function BondLengthsTable({ lengths }: { lengths: BondLengthInfo[] }) {
  const unique = useMemo(() => {
    const seen = new Set<string>();
    const result: BondLengthInfo[] = [];
    for (const bl of lengths) {
      const key = [bl.atom1_symbol, bl.atom2_symbol].sort().join("-");
      if (!seen.has(key)) {
        seen.add(key);
        result.push(bl);
      }
    }
    return result;
  }, [lengths]);

  if (unique.length === 0) return null;

  return (
    <div>
      <div className="text-[10px] font-semibold text-gray-400 mb-0.5">Bond Lengths</div>
      <div className="space-y-px">
        {unique.map((bl, i) => (
          <div key={i} className="flex justify-between text-[10px] text-gray-500 font-mono">
            <span>{bl.atom1_symbol}-{bl.atom2_symbol}</span>
            <span>{bl.length_angstrom.toFixed(3)} A</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Show unique bond angles (deduplicate by atom triple type, limited to 6) */
function BondAnglesTable({ angles }: { angles: BondAngleInfo[] }) {
  const unique = useMemo(() => {
    const seen = new Set<string>();
    const result: BondAngleInfo[] = [];
    for (const ba of angles) {
      if (ba.atoms.startsWith("H-") && ba.atoms.split("-")[1] === "H") continue;
      const key = ba.atoms;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(ba);
      }
      if (result.length >= 6) break;
    }
    return result;
  }, [angles]);

  if (unique.length === 0) return null;

  return (
    <div>
      <div className="text-[10px] font-semibold text-gray-400 mb-0.5">Bond Angles</div>
      <div className="space-y-px">
        {unique.map((ba, i) => (
          <div key={i} className="flex justify-between text-[10px] text-gray-500 font-mono">
            <span>{ba.atoms}</span>
            <span>{ba.angle_degrees.toFixed(1)} deg</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StructurePanel() {
  const { formula, atomicNumber, mode, showLabels, showCharges } = useLabStore((s) => s.structureViewer);
  const setStructureMode = useLabStore((s) => s.setStructureMode);
  const toggleStructureLabels = useLabStore((s) => s.toggleStructureLabels);
  const toggleStructureCharges = useLabStore((s) => s.toggleStructureCharges);

  const { data: molecule } = useCommonStructure(formula);
  const { data: orbitalData } = useOrbitals(atomicNumber);
  const { data: analysisData } = useAnalysis(formula);
  const chargesData = analysisData?.charges ?? null;
  const energyData = analysisData?.energy ?? null;
  const geometryData = analysisData?.geometry ?? null;

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

      {/* Options toggles */}
      <div className="flex gap-3 mb-2">
        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
          <input type="checkbox" checked={showLabels} onChange={toggleStructureLabels} className="accent-blue-500" />
          Labels
        </label>
        {formula && (
          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={showCharges} onChange={toggleStructureCharges} className="accent-blue-500" />
            Charges
          </label>
        )}
      </div>

      {/* Charge color legend */}
      {showCharges && chargesData && (
        <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-500">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#ff6666" }} />
          <span>Negative</span>
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#ffffff" }} />
          <span>Neutral</span>
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: "#6666ff" }} />
          <span>Positive</span>
        </div>
      )}

      {/* 3D Viewer */}
      <div className="flex-1 min-h-[200px] bg-gray-950 rounded overflow-hidden">
        <MoleculeViewer
          molecule={moleculeForViewer}
          orbitalData={orbitalData ?? null}
          mode={mode}
          showLabels={showLabels}
          chargeAtoms={showCharges ? chargesData?.atoms ?? null : null}
          isOrbitalView={atomicNumber !== null && !formula}
        />
      </div>

      {/* Properties & Geometry Info */}
      <div className="mt-2 text-xs text-gray-500 space-y-1.5">
        {molecule?.properties?.molecular_weight != null && (
          <div>MW: {String(molecule.properties.molecular_weight as string | number)} g/mol</div>
        )}
        {energyData && (
          <div className="font-mono text-[10px]">
            Energy: {energyData.energy.toFixed(2)} {energyData.unit} ({energyData.method})
          </div>
        )}

        {/* Geometry info */}
        {geometryData && (
          <>
            <div className="text-[10px] font-mono">
              Geometry: <span className="text-gray-300 capitalize">{geometryData.geometry}</span>
            </div>
            <BondLengthsTable lengths={geometryData.bond_lengths} />
            <BondAnglesTable angles={geometryData.bond_angles} />
          </>
        )}

        {/* Charge details when active */}
        {showCharges && chargesData && (
          <div>
            <div className="text-[10px] font-semibold text-gray-400 mb-0.5">Partial Charges</div>
            <div className="space-y-px">
              {chargesData.atoms
                .filter((a) => a.symbol !== "H")
                .map((a) => (
                  <div key={a.index} className="flex justify-between text-[10px] font-mono">
                    <span>{a.symbol}({a.index})</span>
                    <span className={a.partial_charge < 0 ? "text-red-400" : "text-blue-400"}>
                      {a.partial_charge > 0 ? "+" : ""}{a.partial_charge.toFixed(4)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
