import StationTabs from "./components/ui/StationTabs";
import EnvironmentBar from "./components/ui/EnvironmentBar";
import PeriodicTable from "./components/ui/PeriodicTable";
import ElementInspector from "./components/ui/ElementInspector";
import LabScene from "./components/lab/LabScene";
import EquipmentPalette from "./components/ui/EquipmentPalette";

export default function App() {
  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Station tabs */}
      <StationTabs />

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel: equipment palette */}
        <div className="w-48 bg-gray-900 border-r border-gray-800 p-3 overflow-y-auto">
          <EquipmentPalette />
        </div>

        {/* Center: 3D lab scene */}
        <div className="flex-1 bg-gray-950">
          <LabScene />
        </div>

        {/* Right panel: element inspector */}
        <div className="w-72 bg-gray-900 border-l border-gray-800 p-3 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">Inspector</h2>
          <ElementInspector />
        </div>
      </div>

      {/* Bottom: periodic table + environment bar */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 flex justify-center">
        <div className="max-w-3xl w-full">
          <PeriodicTable />
        </div>
      </div>
      <EnvironmentBar />
    </div>
  );
}
