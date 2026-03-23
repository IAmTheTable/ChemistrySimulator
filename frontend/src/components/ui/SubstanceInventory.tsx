import { useCommonSubstances } from "../../api/substances";
import { useLabStore } from "../../stores/labStore";

const PHASE_LABEL: Record<string, string> = {
  s: "solid",
  l: "liquid",
  g: "gas",
  aq: "aq",
};

const PHASE_COLOR: Record<string, string> = {
  s: "text-yellow-400",
  l: "text-blue-400",
  g: "text-green-400",
  aq: "text-cyan-400",
};

export default function SubstanceInventory() {
  const { data: substances, isLoading, isError } = useCommonSubstances();
  const placingEquipment = useLabStore((s) => s.placingEquipment);
  const setPlacingEquipment = useLabStore((s) => s.setPlacingEquipment);

  const handleClick = (formula: string) => {
    // Enter "placing substance" mode — mirrors equipment placement pattern.
    // Prefix with "substance:" so Task 14 can distinguish it from equipment.
    const token = `substance:${formula}`;
    setPlacingEquipment(placingEquipment === token ? null : token);
  };

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-gray-500 uppercase">Substances</h3>
      <p className="text-[10px] text-gray-600 mb-2">Click to place in container</p>

      {isLoading && (
        <p className="text-[10px] text-gray-500 italic">Loading…</p>
      )}

      {isError && (
        <p className="text-[10px] text-red-500 italic">Failed to load substances</p>
      )}

      {substances && substances.map((sub) => {
        const token = `substance:${sub.formula}`;
        const isActive = placingEquipment === token;
        return (
          <button
            key={sub.formula}
            onClick={() => handleClick(sub.formula)}
            className={`w-full text-left px-2 py-1.5 rounded transition-colors ${
              isActive
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {sub.color && (
              <span
                className="inline-block w-2 h-2 rounded-full mr-1 flex-shrink-0"
                style={{ backgroundColor: sub.color }}
              />
            )}
            <span className="font-mono text-xs">{sub.formula}</span>
            <span className={`ml-1 text-[10px] ${isActive ? "text-blue-200" : "text-gray-400"}`}>{sub.name}</span>
            <span
              className={`ml-1.5 text-[10px] ${
                isActive ? "text-blue-200" : (PHASE_COLOR[sub.phase] ?? "text-gray-500")
              }`}
            >
              ({PHASE_LABEL[sub.phase] ?? sub.phase})
            </span>
          </button>
        );
      })}
    </div>
  );
}
