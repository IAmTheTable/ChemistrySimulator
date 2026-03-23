import { useLabStore } from "../../stores/labStore";
import { soundManager } from "../../audio/SoundManager";

const ATMOSPHERE_COMPOSITIONS: Record<string, string> = {
  air: "N\u2082 78.09%, O\u2082 20.95%, Ar 0.93%, CO\u2082 0.04%",
  nitrogen: "N\u2082 100%",
  argon: "Ar 100%",
  oxygen: "O\u2082 100%",
  vacuum: "No gas molecules",
  hydrogen: "H\u2082 100%",
  co2: "CO\u2082 100%",
  custom: "User-defined mix",
};

export default function EnvironmentBar() {
  const env = useLabStore((s) => s.environment);
  const setEnvironment = useLabStore((s) => s.setEnvironment);

  return (
    <div className="flex items-center gap-4 bg-gray-900 px-4 py-1.5 text-xs border-t border-gray-800">
      {/* Temperature */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Temp:</span>
        <input
          type="number"
          value={env.temperature}
          onChange={(e) => setEnvironment({ temperature: Number(e.target.value) })}
          className="w-14 bg-gray-800 text-emerald-400 px-1 py-0.5 rounded text-xs text-center border border-gray-700"
          min={-273}
          max={3000}
        />
        <span className="text-gray-500">&deg;C</span>
      </div>

      {/* Pressure */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Pressure:</span>
        <input
          type="number"
          value={env.pressure}
          onChange={(e) => setEnvironment({ pressure: Number(e.target.value) })}
          className="w-14 bg-gray-800 text-emerald-400 px-1 py-0.5 rounded text-xs text-center border border-gray-700"
          min={0}
          max={1000}
          step={0.1}
        />
        <span className="text-gray-500">atm</span>
      </div>

      {/* Atmosphere */}
      <div className="flex items-center gap-1.5 group relative">
        <span className="text-gray-500">Atmosphere:</span>
        <select
          value={env.atmosphere}
          onChange={(e) => setEnvironment({ atmosphere: e.target.value })}
          className="bg-gray-800 text-blue-400 px-1 py-0.5 rounded text-xs border border-gray-700"
        >
          <option value="air">Air (N&#x2082; 78%, O&#x2082; 21%)</option>
          <option value="nitrogen">Pure N&#x2082;</option>
          <option value="argon">Pure Ar</option>
          <option value="oxygen">Pure O&#x2082;</option>
          <option value="vacuum">Vacuum</option>
          <option value="hydrogen">Pure H&#x2082;</option>
          <option value="co2">Pure CO&#x2082;</option>
          <option value="custom">Custom Mix</option>
        </select>
        {/* Gas composition tooltip */}
        <div className="hidden group-hover:block absolute bottom-full left-0 mb-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-gray-300 whitespace-nowrap z-50">
          {ATMOSPHERE_COMPOSITIONS[env.atmosphere] || env.atmosphere}
        </div>
      </div>

      {/* Custom gas mix (shown when atmosphere is "custom") */}
      {env.atmosphere === "custom" && (
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">Mix:</span>
          <input
            type="text"
            value={env.customMix || ""}
            onChange={(e) => setEnvironment({ customMix: e.target.value })}
            placeholder="N2:78,O2:21,Ar:1"
            className="w-36 bg-gray-800 text-gray-300 px-1 py-0.5 rounded text-xs border border-gray-700"
          />
        </div>
      )}

      {/* Humidity */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Humidity:</span>
        <input
          type="number"
          value={env.humidity ?? 50}
          onChange={(e) => setEnvironment({ humidity: Number(e.target.value) })}
          className="w-12 bg-gray-800 text-cyan-400 px-1 py-0.5 rounded text-xs text-center border border-gray-700"
          min={0}
          max={100}
        />
        <span className="text-gray-500">%</span>
      </div>

      {/* Volume slider */}
      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-gray-500">Vol:</span>
        <input
          type="range"
          min="0"
          max="100"
          defaultValue="50"
          className="w-12 h-1 accent-blue-500"
          onChange={(e) => soundManager.setVolume(Number(e.target.value) / 100)}
        />
      </div>

      {/* Quick presets */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setEnvironment({ temperature: 25, pressure: 1, atmosphere: "air", humidity: 50 })}
          className="px-1.5 py-0.5 text-[10px] bg-gray-800 text-gray-400 rounded hover:bg-gray-700"
          title="Standard conditions (25&deg;C, 1 atm, air)"
        >
          STP
        </button>
        <button
          onClick={() => setEnvironment({ temperature: 0, pressure: 1, atmosphere: "air", humidity: 0 })}
          className="px-1.5 py-0.5 text-[10px] bg-gray-800 text-gray-400 rounded hover:bg-gray-700"
          title="Standard Temperature (0&deg;C, 1 atm)"
        >
          0&deg;C
        </button>
        <button
          onClick={() => setEnvironment({ temperature: 100, pressure: 1, atmosphere: "air", humidity: 100 })}
          className="px-1.5 py-0.5 text-[10px] bg-gray-800 text-gray-400 rounded hover:bg-gray-700"
          title="Boiling point of water"
        >
          100&deg;C
        </button>
        <button
          onClick={() => setEnvironment({ temperature: 25, pressure: 1, atmosphere: "nitrogen", humidity: 0 })}
          className="px-1.5 py-0.5 text-[10px] bg-gray-800 text-gray-400 rounded hover:bg-gray-700"
          title="Inert atmosphere"
        >
          Inert
        </button>
      </div>

      {/* Safety status */}
      <div className="flex items-center gap-1.5">
        <span className="text-gray-500">Safety:</span>
        <span className={env.temperature > 200 ? "text-red-400" : env.temperature > 100 ? "text-yellow-400" : "text-green-400"}>
          {env.temperature > 200 ? "DANGER" : env.temperature > 100 ? "Caution" : "Normal"}
        </span>
      </div>
    </div>
  );
}
