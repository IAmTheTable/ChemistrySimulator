import { useState, useCallback } from "react";
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
import SpectraPanel from "./components/ui/SpectraPanel";
import ResizeHandle from "./components/ui/ResizeHandle";
import { useLabStore } from "./stores/labStore";

const TAB_CLASS =
  "flex-1 px-2 py-1.5 text-[10px] font-medium text-gray-400 hover:text-gray-200 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-colors";

export default function App() {
  const activeTab = useLabStore((s) => s.activeRightTab);
  const setActiveTab = useLabStore((s) => s.setActiveRightTab);

  const [sidebarWidth, setSidebarWidth] = useState(280);

  const handleResize = useCallback((delta: number) => {
    setSidebarWidth((w) => Math.max(200, Math.min(window.innerWidth - 300, w + delta)));
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      <StationTabs />

      <div className="flex-1 flex min-h-0">
        {/* Left sidebar — all panels in tabs */}
        <div style={{ width: sidebarWidth }} className="bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 overflow-hidden">
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <Tabs.List className="flex border-b border-gray-800 shrink-0">
              <Tabs.Trigger value="lab" className={TAB_CLASS}>Lab</Tabs.Trigger>
              <Tabs.Trigger value="reactions" className={TAB_CLASS}>Reactions</Tabs.Trigger>
              <Tabs.Trigger value="structure" className={TAB_CLASS}>Structure</Tabs.Trigger>
              <Tabs.Trigger value="spectra" className={TAB_CLASS}>Spectra</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="lab" className="flex-1 p-3 overflow-y-auto space-y-4">
              <EquipmentPalette />
              <div className="border-t border-gray-800 pt-3">
                <SubstanceInventory />
              </div>
              <div className="border-t border-gray-800 pt-3">
                <SimulationToggle />
              </div>
            </Tabs.Content>

            <Tabs.Content value="reactions" className="flex-1 p-3 overflow-y-auto">
              <ReactionLog />
            </Tabs.Content>

            <Tabs.Content value="structure" className="flex-1 p-3 flex flex-col min-h-0">
              <StructurePanel />
            </Tabs.Content>

            <Tabs.Content value="spectra" className="flex-1 p-3 overflow-y-auto">
              <SpectraPanel />
            </Tabs.Content>
          </Tabs.Root>
        </div>

        <ResizeHandle side="left" onResize={handleResize} />

        {/* Center: 3D lab scene */}
        <div className="flex-1 bg-gray-950">
          <LabScene />
        </div>
      </div>

      {/* Element/Container Inspector — horizontal strip between lab and periodic table */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 max-h-48 overflow-y-auto">
        <ElementInspector />
      </div>

      {/* Periodic table */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 flex justify-center">
        <div className="max-w-3xl w-full">
          <PeriodicTable />
        </div>
      </div>
      <EnvironmentBar />

      <ContainerContextMenu />
    </div>
  );
}
