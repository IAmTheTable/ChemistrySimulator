import { useLabStore } from "../../stores/labStore";

const EQUIPMENT = [
  { type: "beaker", label: "Beaker" },
  { type: "erlenmeyer", label: "Erlenmeyer Flask" },
  { type: "test-tube", label: "Test Tube" },
];

export default function EquipmentPalette() {
  const placingEquipment = useLabStore((s) => s.placingEquipment);
  const setPlacingEquipment = useLabStore((s) => s.setPlacingEquipment);

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-gray-500 uppercase">Equipment</h3>
      <p className="text-[10px] text-gray-600 mb-2">Click to place on bench</p>
      {EQUIPMENT.map((eq) => (
        <button
          key={eq.type}
          onClick={() =>
            setPlacingEquipment(placingEquipment === eq.type ? null : eq.type)
          }
          className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
            placingEquipment === eq.type
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          {eq.label}
        </button>
      ))}
    </div>
  );
}
