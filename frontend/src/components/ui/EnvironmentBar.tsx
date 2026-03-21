import { useLabStore } from "../../stores/labStore";
import { soundManager } from "../../audio/SoundManager";

export default function EnvironmentBar() {
  const env = useLabStore((s) => s.environment);

  return (
    <div className="flex items-center gap-4 bg-gray-900 px-4 py-2 text-xs border-t border-gray-800">
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Temp:</span>
        <span className="text-emerald-400">{env.temperature}°C</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Pressure:</span>
        <span className="text-emerald-400">{env.pressure} atm</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Atmosphere:</span>
        <span className="text-blue-400">{env.atmosphere}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Vol:</span>
        <input
          type="range"
          min="0"
          max="100"
          defaultValue="50"
          className="w-16 h-1 accent-blue-500"
          onChange={(e) => soundManager.setVolume(Number(e.target.value) / 100)}
        />
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <span className="text-gray-500">Safety:</span>
        <span className="text-green-400">All Clear</span>
      </div>
    </div>
  );
}
