import { useLabStore } from "../../stores/labStore";
import { useElement } from "../../api/elements";
import { CATEGORY_COLORS } from "../../types/element";

export default function ElementInspector() {
  const selectedElement = useLabStore((s) => s.selectedElement);
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
