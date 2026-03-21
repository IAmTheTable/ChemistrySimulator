import { useLabStore } from "../../stores/labStore";

export default function SimulationToggle() {
  const simulationMode = useLabStore((s) => s.simulationMode);
  const setSimulationMode = useLabStore((s) => s.setSimulationMode);

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-gray-500 uppercase">Simulation Mode</h3>
      <div className="flex gap-1 mt-1">
        <button
          onClick={() => setSimulationMode("instant")}
          className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
            simulationMode === "instant"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Instant
        </button>
        <button
          onClick={() => setSimulationMode("realistic")}
          className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
            simulationMode === "realistic"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Realistic
        </button>
      </div>
    </div>
  );
}
