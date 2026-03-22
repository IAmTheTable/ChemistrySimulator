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
  const [bottomHeight, setBottomHeight] = useState(180);

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth((w) => Math.max(200, Math.min(window.innerWidth - 300, w + delta)));
  }, []);

  const handleBottomResize = useCallback((delta: number) => {
    setBottomHeight((h) => Math.max(100, Math.min(window.innerHeight - 200, h - delta)));
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      <StationTabs />

      {/* Main area: sidebar + lab */}
      <div className="flex-1 flex min-h-0">
        {/* Left sidebar */}
        <div style={{ width: sidebarWidth }} className="bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 overflow-hidden">
          <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <Tabs.List className="flex border-b border-gray-800 shrink-0">
              <Tabs.Trigger value="lab" className={TAB_CLASS}>Lab</Tabs.Trigger>
              <Tabs.Trigger value="reactions" className={TAB_CLASS}>Reactions</Tabs.Trigger>
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

            <Tabs.Content value="spectra" className="flex-1 p-3 overflow-y-auto">
              <SpectraPanel />
            </Tabs.Content>
          </Tabs.Root>
        </div>

        <ResizeHandle direction="vertical" onResize={handleSidebarResize} />

        {/* Center: lab scene */}
        <div className="flex-1 bg-gray-950">
          <LabScene />
        </div>
      </div>

      {/* Horizontal resize handle */}
      <ResizeHandle direction="horizontal" onResize={handleBottomResize} />

      {/* Bottom: Inspector + Structure (left) | Periodic Table (right) */}
      <div style={{ height: bottomHeight }} className="bg-gray-900 flex min-h-0 flex-shrink-0 overflow-hidden">
        <div className="w-72 border-r border-gray-800 flex flex-col flex-shrink-0 overflow-hidden">
          <Tabs.Root defaultValue="inspector" className="flex flex-col h-full">
            <Tabs.List className="flex border-b border-gray-800 shrink-0">
              <Tabs.Trigger value="inspector" className={TAB_CLASS}>Inspector</Tabs.Trigger>
              <Tabs.Trigger value="structure" className={TAB_CLASS}>Structure</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="inspector" className="flex-1 px-3 py-2 overflow-y-auto">
              <ElementInspector />
            </Tabs.Content>
            <Tabs.Content value="structure" className="flex-1 px-3 py-2 flex flex-col min-h-0">
              <StructurePanel />
            </Tabs.Content>
          </Tabs.Root>
        </div>
        <div className="flex-1 px-4 py-2 overflow-y-auto flex justify-center">
          <div className="max-w-3xl w-full">
            <PeriodicTable />
          </div>
        </div>
      </div>

      <EnvironmentBar />
      <ContainerContextMenu />
    </div>
  );
}
