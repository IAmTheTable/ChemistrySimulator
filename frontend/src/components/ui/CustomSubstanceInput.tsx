import { useState } from "react";
import { useLabStore } from "../../stores/labStore";

export default function CustomSubstanceInput() {
  const [formula, setFormula] = useState("");
  const [loading, setLoading] = useState(false);
  const setPlacingEquipment = useLabStore((s) => s.setPlacingEquipment);
  const substanceAmount = useLabStore((s) => s.substanceAmount);
  const setSubstanceAmount = useLabStore((s) => s.setSubstanceAmount);

  const handleAdd = async () => {
    if (!formula.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/substances/lookup?formula=${encodeURIComponent(formula.trim())}`,
        { method: "POST" },
      );
      if (response.ok) {
        setPlacingEquipment(`substance:${formula.trim()}`);
      }
    } finally {
      setLoading(false);
    }
    setFormula("");
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase">Custom Substance</h3>
      <div className="flex gap-1">
        <input
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="e.g. CuSO4, C6H12O6"
          className="flex-1 bg-gray-800 text-xs text-gray-200 px-2 py-1 rounded border border-gray-700 focus:border-blue-500 outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={loading}
          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>Amount:</span>
        <input
          type="number"
          value={substanceAmount}
          onChange={(e) => setSubstanceAmount(Number(e.target.value) || 50)}
          min={1}
          max={1000}
          className="w-16 bg-gray-800 text-gray-200 px-1 py-0.5 rounded border border-gray-700 text-xs"
        />
        <span>mL</span>
      </div>
    </div>
  );
}
