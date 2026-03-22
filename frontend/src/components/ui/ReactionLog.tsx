import { useState } from "react";
import { useLabStore } from "../../stores/labStore";
import type { ReactionLogEntry } from "../../types/reaction";

function SourceBadge({ source }: { source: ReactionLogEntry["source"] }) {
  if (source === "curated") {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-800 text-green-200">
        Curated
      </span>
    );
  }
  if (source === "predicted") {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-800 text-purple-200">
        Predicted
      </span>
    );
  }
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-700 text-gray-400">
      No reaction
    </span>
  );
}

function DeltaH({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-500 text-[10px]">deltaH: --</span>;
  const color = value < 0 ? "text-red-400" : "text-blue-400";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`text-[10px] font-mono ${color}`}>
      deltaH: {sign}{value.toFixed(1)} kJ/mol
    </span>
  );
}

/** Describe the mechanism type in human-readable terms */
const MECHANISM_DESCRIPTIONS: Record<string, { name: string; steps: string[] }> = {
  acid_base: {
    name: "Acid-Base Neutralization",
    steps: [
      "Acid donates H+ (proton) to solution",
      "Base provides OH- (hydroxide) ions",
      "H+ and OH- combine to form H2O",
      "Remaining ions form a salt",
    ],
  },
  single_displacement: {
    name: "Single Displacement",
    steps: [
      "More reactive element approaches compound",
      "Reactive element displaces less reactive element",
      "Displaced element is released",
      "New compound is formed",
    ],
  },
  precipitation: {
    name: "Double Displacement (Precipitation)",
    steps: [
      "Two ionic compounds dissociate in solution",
      "Ions recombine with new partners",
      "One product is insoluble (precipitate)",
      "Precipitate settles out of solution",
    ],
  },
  combustion: {
    name: "Combustion",
    steps: [
      "Fuel combines with oxygen (O2)",
      "Bonds in fuel break (requires activation energy)",
      "Carbon atoms form CO2",
      "Hydrogen atoms form H2O",
      "Energy is released as heat and light",
    ],
  },
  decomposition: {
    name: "Thermal Decomposition",
    steps: [
      "Heat energy is absorbed by the compound",
      "Molecular bonds weaken and break",
      "Compound separates into simpler substances",
    ],
  },
  none: {
    name: "No Reaction",
    steps: ["No favorable reaction pathway exists under current conditions"],
  },
};

/** Simple text energy diagram */
function EnergyDiagram({ deltaH }: { deltaH: number | null }) {
  if (deltaH === null) return null;
  const isExo = deltaH < 0;
  return (
    <div className="font-mono text-[9px] text-gray-500 leading-tight mt-1">
      <div>{isExo ? "Reactants  ----" : "Products   ----"}</div>
      <div>{"               |"}</div>
      <div>{"          " + (isExo ? "deltaH < 0" : "deltaH > 0")}</div>
      <div>{"               |"}</div>
      <div>{isExo ? "Products   ----" : "Reactants  ----"}</div>
      <div className="text-[9px] mt-0.5">
        {isExo ? "Exothermic: energy released" : "Endothermic: energy absorbed"}
      </div>
    </div>
  );
}

function ReactionDetails({ entry }: { entry: ReactionLogEntry }) {
  const mechanism = MECHANISM_DESCRIPTIONS[entry.reaction_type] ?? {
    name: entry.reaction_type,
    steps: ["Reaction proceeds to form products"],
  };

  return (
    <div className="mt-1.5 pt-1.5 border-t border-gray-700 space-y-1.5">
      {/* Mechanism type */}
      <div>
        <span className="text-[10px] font-semibold text-gray-400">Mechanism: </span>
        <span className="text-[10px] text-gray-300">{mechanism.name}</span>
      </div>

      {/* Step-by-step */}
      <div>
        <div className="text-[10px] font-semibold text-gray-400 mb-0.5">Steps:</div>
        <ol className="list-decimal list-inside space-y-px">
          {mechanism.steps.map((step, i) => (
            <li key={i} className="text-[10px] text-gray-500">{step}</li>
          ))}
        </ol>
      </div>

      {/* Thermodynamic details */}
      {entry.delta_s != null && (
        <div className="text-[10px] text-gray-500 font-mono">
          deltaS: {entry.delta_s > 0 ? "+" : ""}{entry.delta_s.toFixed(1)} J/(mol*K)
        </div>
      )}
      {entry.delta_g != null && (
        <div className="text-[10px] text-gray-500 font-mono">
          deltaG: {entry.delta_g > 0 ? "+" : ""}{entry.delta_g.toFixed(1)} kJ/mol
          {entry.spontaneous ? " (spontaneous)" : " (non-spontaneous)"}
        </div>
      )}

      {/* Energy diagram */}
      <EnergyDiagram deltaH={entry.delta_h} />
    </div>
  );
}

function LogEntry({ entry }: { entry: ReactionLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const time = entry.timestamp instanceof Date
    ? entry.timestamp
    : new Date(entry.timestamp);

  return (
    <div
      className="bg-gray-800 rounded p-2 space-y-1 text-[11px] cursor-pointer hover:bg-gray-750 transition-colors"
      onClick={() => setExpanded((prev) => !prev)}
    >
      <p className="font-mono text-gray-100 break-all leading-tight">{entry.equation}</p>
      <div className="flex flex-wrap items-center gap-2">
        <DeltaH value={entry.delta_h} />
        <span className="text-gray-500 text-[10px] capitalize">{entry.reaction_type}</span>
        <SourceBadge source={entry.source} />
        <span className="text-gray-600 text-[10px] ml-auto">{expanded ? "[-]" : "[+]"}</span>
      </div>
      <p className="text-gray-600 text-[10px]">
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>

      {expanded && <ReactionDetails entry={entry} />}
    </div>
  );
}

export default function ReactionLog() {
  const reactionLog = useLabStore((s) => s.reactionLog);

  if (reactionLog.length === 0) {
    return (
      <p className="text-[11px] text-gray-600 italic mt-2">
        No reactions yet. Combine substances to see results here.
      </p>
    );
  }

  return (
    <div className="space-y-2 mt-1">
      {reactionLog.map((entry) => (
        <LogEntry key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
