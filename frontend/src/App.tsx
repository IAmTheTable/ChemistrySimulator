import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import * as Tabs from "@radix-ui/react-tabs";
import StationTabs from "./components/ui/StationTabs";
import EnvironmentBar from "./components/ui/EnvironmentBar";
import PeriodicTable from "./components/ui/PeriodicTable";
import ElementInspector from "./components/ui/ElementInspector";
import LabScene from "./components/lab/LabScene";
import EquipmentPalette from "./components/ui/EquipmentPalette";
import SubstanceInventory from "./components/ui/SubstanceInventory";
import CustomSubstanceInput from "./components/ui/CustomSubstanceInput";
import SimulationToggle from "./components/ui/SimulationToggle";
import ReactionLog from "./components/ui/ReactionLog";
import ContainerContextMenu from "./components/ui/ContainerContextMenu";
import NotificationToast from "./components/ui/NotificationToast";
import StructurePanel from "./components/ui/StructurePanel";
import SpectraPanel from "./components/ui/SpectraPanel";
import ResizeHandle from "./components/ui/ResizeHandle";
import { useLabStore } from "./stores/labStore";
import { usePhysicsSimulation } from "./hooks/usePhysicsSimulation";

const LAYOUT = {
  SIDEBAR_DEFAULT: 280,
  SIDEBAR_MIN: 200,
  BOTTOM_DEFAULT: 160,
  BOTTOM_MIN: 80,
  MIN_LAB_WIDTH: 300,
  MIN_TOP_HEIGHT: 150,
} as const;

const TAB_CLASS =
  "flex-1 px-2 py-1.5 text-[10px] font-medium text-gray-400 hover:text-gray-200 data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 transition-colors";

export default function App() {
  usePhysicsSimulation();

  const activeTab = useLabStore((s) => s.activeRightTab);
  const setActiveTab = useLabStore((s) => s.setActiveRightTab);
  const activeBottomTab = useLabStore((s) => s.activeBottomTab);
  const setActiveBottomTab = useLabStore((s) => s.setActiveBottomTab);

  const [sidebarWidth, setSidebarWidth] = useState<number>(LAYOUT.SIDEBAR_DEFAULT);
  const [bottomHeight, setBottomHeight] = useState<number>(LAYOUT.BOTTOM_DEFAULT);

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth((w) => Math.max(LAYOUT.SIDEBAR_MIN, Math.min(window.innerWidth - LAYOUT.MIN_LAB_WIDTH, w + delta)));
  }, []);

  const handleBottomResize = useCallback((delta: number) => {
    setBottomHeight((h) => Math.max(LAYOUT.BOTTOM_MIN, Math.min(window.innerHeight - LAYOUT.MIN_TOP_HEIGHT, h - delta)));
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      <StationTabs />

      <div className="flex-1 flex min-h-0">

        <div style={{ width: sidebarWidth }} className="bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0 overflow-hidden">
          <div className="flex-1 flex flex-col min-h-0 border-b border-gray-800">
            <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <Tabs.List className="flex border-b border-gray-800 shrink-0">
                <Tabs.Trigger value="lab" className={TAB_CLASS}>Lab</Tabs.Trigger>
                <Tabs.Trigger value="reactions" className={TAB_CLASS}>Reactions</Tabs.Trigger>
                <Tabs.Trigger value="spectra" className={TAB_CLASS}>Spectra</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="lab" className="flex-1 p-3 overflow-y-auto space-y-4">
                <EquipmentPalette />
                <div className="border-t border-gray-800 pt-3"><SubstanceInventory /></div>
                <div className="border-t border-gray-800 pt-3"><CustomSubstanceInput /></div>
                <div className="border-t border-gray-800 pt-3"><SimulationToggle /></div>
              </Tabs.Content>
              <Tabs.Content value="reactions" className="flex-1 p-3 overflow-y-auto">
                <ReactionLog />
              </Tabs.Content>
              <Tabs.Content value="spectra" className="flex-1 p-3 overflow-y-auto">
                <SpectraPanel />
              </Tabs.Content>
            </Tabs.Root>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <Tabs.Root value={activeBottomTab} onValueChange={setActiveBottomTab} className="flex flex-col h-full">
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
        </div>

        <ResizeHandle direction="vertical" onResize={handleSidebarResize} />

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 bg-gray-950 min-h-0 overflow-hidden">
            <LabScene />
          </div>

          <ResizeHandle direction="horizontal" onResize={handleBottomResize} />

          <div style={{ height: bottomHeight }} className="bg-gray-900 border-t border-gray-800 px-4 py-2 overflow-y-auto flex justify-center flex-shrink-0">
            <div className="max-w-4xl w-full">
              <PeriodicTable />
            </div>
          </div>
        </div>
      </div>

      <EnvironmentBar />
      <ContainerContextMenu />
      <NotificationToast />
      <HoverTooltip />
    </div>
  );
}

function HoverTooltip() {
  const hoveredItem = useLabStore((s) => s.hoveredItem);
  const benchItems = useLabStore((s) => s.benchItems);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    if (hoveredItem) window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [hoveredItem]);

  if (!hoveredItem) return null;
  const item = benchItems.find((b) => b.id === hoveredItem);
  if (!item) return null;

  return createPortal(
    <div
      style={{ position: "fixed", left: pos.x + 12, top: pos.y - 10, zIndex: 9999, pointerEvents: "none" }}
      className="bg-gray-800 border border-gray-600 text-gray-200 text-[10px] px-2 py-1 rounded shadow-lg max-w-48"
    >
      <div className="font-semibold capitalize">{item.type}</div>
      <div className="text-gray-400">{item.temperature}°C</div>
      {item.contents.length > 0 ? (
        <div className="text-gray-400">{item.contents.map((s) => s.formula).join(", ")}</div>
      ) : (
        <div className="text-gray-500 italic">Empty</div>
      )}
      {item.damaged && <div className="text-red-400">Damaged</div>}
    </div>,
    document.body
  );
}
