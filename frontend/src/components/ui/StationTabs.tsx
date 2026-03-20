import * as Tabs from "@radix-ui/react-tabs";
import { useLabStore, type StationId } from "../../stores/labStore";

const STATIONS: { id: StationId; label: string }[] = [
  { id: "main-bench", label: "Main Bench" },
  { id: "fume-hood", label: "Fume Hood" },
  { id: "instrument-room", label: "Instruments" },
  { id: "electrochemistry", label: "Electrochemistry" },
  { id: "glove-box", label: "Glove Box" },
  { id: "thermal-analysis", label: "Thermal Analysis" },
  { id: "storage-safety", label: "Storage & Safety" },
];

export default function StationTabs() {
  const activeStation = useLabStore((s) => s.activeStation);
  const setStation = useLabStore((s) => s.setStation);

  return (
    <Tabs.Root value={activeStation} onValueChange={(v) => setStation(v as StationId)}>
      <Tabs.List className="flex gap-1 bg-gray-900 px-2 pt-2">
        {STATIONS.map((station) => (
          <Tabs.Trigger
            key={station.id}
            value={station.id}
            className="px-3 py-1.5 text-sm rounded-t-md transition-colors
              data-[state=active]:bg-gray-800 data-[state=active]:text-white
              data-[state=inactive]:bg-gray-900 data-[state=inactive]:text-gray-500
              hover:text-gray-300"
          >
            {station.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
