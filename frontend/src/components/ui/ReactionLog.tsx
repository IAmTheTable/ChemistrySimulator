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
  if (value === null) return <span className="text-gray-500 text-[10px]">ΔH: —</span>;
  const color = value < 0 ? "text-red-400" : "text-blue-400";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`text-[10px] font-mono ${color}`}>
      ΔH: {sign}{value.toFixed(1)} kJ/mol
    </span>
  );
}

function LogEntry({ entry }: { entry: ReactionLogEntry }) {
  const time = entry.timestamp instanceof Date
    ? entry.timestamp
    : new Date(entry.timestamp);

  return (
    <div className="bg-gray-800 rounded p-2 space-y-1 text-[11px]">
      <p className="font-mono text-gray-100 break-all leading-tight">{entry.equation}</p>
      <div className="flex flex-wrap items-center gap-2">
        <DeltaH value={entry.delta_h} />
        <span className="text-gray-500 text-[10px] capitalize">{entry.reaction_type}</span>
        <SourceBadge source={entry.source} />
      </div>
      <p className="text-gray-600 text-[10px]">
        {time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
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
