import * as Tabs from "@radix-ui/react-tabs";
import StationTabs from "./components/ui/StationTabs";
import EnvironmentBar from "./components/ui/EnvironmentBar";
import PeriodicTable from "./components/ui/PeriodicTable";
import ElementInspector from "./components/ui/ElementInspector";
import LabScene from "./components/lab/LabScene";
import EquipmentPalette from "./components/ui/EquipmentPalette";
import SubstanceInventory from "./components/ui/SubstanceInventory";
import SimulationToggle from "./components/ui/SimulationToggle";
import ReactionLog from "./components/ui/ReactionLog";
import ContainerContextMenu from "./components/ui/ContainerContextMenu";
import StructurePanel from "./components/ui/StructurePanel";
import { useLabStore } from "./stores/labStore";

export default function App() {
  const activeRightTab = useLabStore((s) => s.activeRightTab);
  const setActiveRightTab = useLabStore((s) => s.setActiveRightTab);
  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Station tabs */}
      <StationTabs />

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel: equipment palette + substance inventory + simulation toggle */}
        <div className="w-48 bg-gray-900 border-r border-gray-800 p-3 overflow-y-auto space-y-4">
          <EquipmentPalette />
          <div className="border-t border-gray-800 pt-3">
            <SubstanceInventory />
          </div>
          <div className="border-t border-gray-800 pt-3">
            <SimulationToggle />
          </div>
        </div>

        {/* Center: 3D lab scene */}
        <div className="flex-1 bg-gray-950">
          <LabScene />
        </div>

        {/* Right panel: tabbed Inspector | Reactions */}
        <div className="w-72 bg-gray-900 border-l border-gray-800 overflow-y-auto">
          <Tabs.Root value={activeRightTab} onValueChange={setActiveRightTab} className="flex flex-col h-full">
            <Tabs.List className="flex border-b border-gray-800 shrink-0">
              <Tabs.Trigger
                value="inspector"
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-200 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-colors"
              >
                Inspector
              </Tabs.Trigger>
              <Tabs.Trigger
                value="reactions"
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-200 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-colors"
              >
                Reactions
              </Tabs.Trigger>
              <Tabs.Trigger
                value="structure"
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-200 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-colors"
              >
                Structure
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="inspector" className="flex-1 p-3 overflow-y-auto">
              <ElementInspector />
            </Tabs.Content>

            <Tabs.Content value="reactions" className="flex-1 p-3 overflow-y-auto">
              <h2 className="text-sm font-semibold text-gray-400 mb-1">Reaction Log</h2>
              <ReactionLog />
            </Tabs.Content>

            <Tabs.Content value="structure" className="flex-1 p-3 overflow-y-auto">
              <StructurePanel />
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </div>

      {/* Bottom: periodic table + environment bar */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 flex justify-center">
        <div className="max-w-3xl w-full">
          <PeriodicTable />
        </div>
      </div>
      <EnvironmentBar />

      {/* DOM-level context menu overlay for 3D lab containers */}
      <ContainerContextMenu />
    </div>
  );
}
