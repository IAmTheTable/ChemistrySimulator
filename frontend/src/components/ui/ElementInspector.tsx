import { useLabStore } from "../../stores/labStore";
import { useElement } from "../../api/elements";
import { useChemicalName } from "../../api/nomenclature";
import { CATEGORY_COLORS } from "../../types/element";
import type { ContainerSubstance } from "../../stores/labStore";

const CONTAINER_LABELS: Record<string, string> = {
  beaker: "Beaker",
  erlenmeyer: "Erlenmeyer Flask",
  "test-tube": "Test Tube",
};

const PHASE_LABEL: Record<string, string> = {
  s: "solid",
  l: "liquid",
  g: "gas",
  aq: "aqueous",
};

export default function ElementInspector() {
  const selectedBenchItem = useLabStore((s) => s.selectedBenchItem);
  const benchItems = useLabStore((s) => s.benchItems);

  const benchItem = selectedBenchItem
    ? benchItems.find((b) => b.id === selectedBenchItem)
    : null;

  // If a bench item is selected, show container info
  if (benchItem) {
    return <ContainerInspector />;
  }

  // Otherwise show element info
  return <ElementInfo />;
}

/* ------------------------------------------------------------------ */
/*  Container Inspector                                                */
/* ------------------------------------------------------------------ */

function ContainerInspector() {
  const selectedBenchItem = useLabStore((s) => s.selectedBenchItem);
  const benchItems = useLabStore((s) => s.benchItems);
  const selectBenchItem = useLabStore((s) => s.selectBenchItem);
  const updateBenchItemContents = useLabStore((s) => s.updateBenchItemContents);
  const openStructureViewer = useLabStore((s) => s.openStructureViewer);

  const item = benchItems.find((b) => b.id === selectedBenchItem);
  if (!item) return null;

  const label = CONTAINER_LABELS[item.type] ?? item.type;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">{label}</h3>
        <button
          onClick={() => selectBenchItem(null)}
          className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          Deselect
        </button>
      </div>

      <div className="text-xs text-gray-400">
        Temperature: <span className="text-gray-200">{item.temperature}&deg;C</span>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Contents</h4>
        {item.contents.length === 0 ? (
          <p className="text-xs text-gray-600 italic">Empty</p>
        ) : (
          <div className="space-y-2">
            {item.contents.map((sub, idx) => (
              <SubstanceRow
                key={`${sub.formula}-${idx}`}
                substance={sub}
                onViewStructure={() => openStructureViewer(sub.formula)}
              />
            ))}
          </div>
        )}
      </div>

      {item.contents.length > 0 && (
        <button
          onClick={() => updateBenchItemContents(item.id, [])}
          className="w-full px-2 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
        >
          Empty Container
        </button>
      )}
    </div>
  );
}

function SubstanceRow({
  substance,
  onViewStructure,
}: {
  substance: ContainerSubstance;
  onViewStructure: () => void;
}) {
  const { data: chemName } = useChemicalName(substance.formula);

  return (
    <div className="bg-gray-800 rounded p-2">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-gray-200">{substance.formula}</span>
          {chemName && (
            <span className="ml-1.5 text-[10px] text-gray-400">{chemName}</span>
          )}
        </div>
        <button
          onClick={onViewStructure}
          className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Structure
        </button>
      </div>
      <div className="flex gap-3 mt-1 text-[10px] text-gray-500">
        <span>{substance.amount_ml} mL</span>
        <span>{PHASE_LABEL[substance.phase] ?? substance.phase}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Element Info (original behavior)                                   */
/* ------------------------------------------------------------------ */

function ElementInfo() {
  const selectedElement = useLabStore((s) => s.selectedElement);
  const openOrbitalViewer = useLabStore((s) => s.openOrbitalViewer);
  const { data: element, isLoading } = useElement(selectedElement);

  if (!selectedElement) {
    return <p className="text-xs text-gray-600">Select an element from the periodic table</p>;
  }

  if (isLoading || !element) {
    return <p className="text-xs text-gray-500">Loading...</p>;
  }

  const color = CATEGORY_COLORS[element.category] || CATEGORY_COLORS.unknown;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-5xl font-bold" style={{ color }}>{element.symbol}</div>
        <div className="text-lg font-semibold">{element.name}</div>
        <div className="text-xs text-gray-400">
          #{element.atomic_number} &middot; {element.category}
        </div>
        <button
          onClick={() => openOrbitalViewer(element.atomic_number)}
          className="mt-2 w-full px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          View Orbitals
        </button>
      </div>

      <Section title="Properties">
        <Row label="Atomic Mass" value={`${element.atomic_mass} u`} />
        <Row label="Phase (STP)" value={element.phase_at_stp} />
        <Row label="Block" value={element.block.toUpperCase()} />
        <Row label="Group" value={element.group ?? "N/A"} />
        <Row label="Period" value={element.period} />
        {element.density && <Row label="Density" value={`${element.density} g/cm³`} />}
      </Section>

      <Section title="Electron Configuration">
        <p className="text-xs text-gray-300 font-mono">{element.electron_configuration}</p>
        {element.shells.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">Shells: {element.shells.join(", ")}</p>
        )}
      </Section>

      <Section title="Atomic Properties">
        {element.electronegativity_pauling && (
          <Row label="Electronegativity" value={element.electronegativity_pauling} />
        )}
        {element.first_ionization_energy && (
          <Row label="1st Ionization" value={`${element.first_ionization_energy} kJ/mol`} />
        )}
        {element.atomic_radius && <Row label="Atomic Radius" value={`${element.atomic_radius} pm`} />}
        {element.covalent_radius && <Row label="Covalent Radius" value={`${element.covalent_radius} pm`} />}
        {element.van_der_waals_radius && (
          <Row label="Van der Waals" value={`${element.van_der_waals_radius} pm`} />
        )}
      </Section>

      <Section title="Thermal Properties">
        {element.melting_point != null && <Row label="Melting Point" value={`${element.melting_point}°C`} />}
        {element.boiling_point != null && <Row label="Boiling Point" value={`${element.boiling_point}°C`} />}
      </Section>

      {element.oxidation_states.length > 0 && (
        <Section title="Oxidation States">
          <div className="flex flex-wrap gap-1">
            {element.oxidation_states.map((os) => (
              <span key={os} className="px-1.5 py-0.5 text-xs rounded bg-gray-800 text-gray-300">
                {os > 0 ? `+${os}` : os}
              </span>
            ))}
          </div>
        </Section>
      )}

      {element.isotopes.length > 0 && (
        <Section title={`Isotopes (${element.isotopes.length})`}>
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {element.isotopes
              .filter((iso) => iso.stable || (iso.abundance && iso.abundance > 0.001))
              .map((iso) => (
                <div key={iso.mass_number} className="flex justify-between text-xs">
                  <span className="text-gray-400">
                    <sup>{iso.mass_number}</sup>{element.symbol}
                    {iso.stable && <span className="text-green-500 ml-1">stable</span>}
                  </span>
                  {iso.abundance && (
                    <span className="text-gray-500">{(iso.abundance * 100).toFixed(2)}%</span>
                  )}
                </div>
              ))}
          </div>
        </Section>
      )}

      <Section title="About">
        <p className="text-xs text-gray-400 leading-relaxed">{element.summary}</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300">{value}</span>
    </div>
  );
}
