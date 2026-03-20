import StationTabs from "./components/ui/StationTabs";
import EnvironmentBar from "./components/ui/EnvironmentBar";
import PeriodicTable from "./components/ui/PeriodicTable";
import ElementInspector from "./components/ui/ElementInspector";
import LabScene from "./components/lab/LabScene";

export default function App() {
  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Station tabs */}
      <StationTabs />

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel: will hold periodic table / inventory */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 p-3 overflow-y-auto">
          <h2 className="text-sm font-semibold text-gray-400 mb-2">Periodic Table</h2>
          <PeriodicTable />
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

      {/* Bottom: environment bar */}
      <EnvironmentBar />
    </div>
  );
}
