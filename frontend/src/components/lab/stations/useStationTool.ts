import { useLabStore } from "../../../stores/labStore";

export function useStationTool() {
  const selectedBenchItem = useLabStore((s) => s.selectedBenchItem);
  const benchItems = useLabStore((s) => s.benchItems);
  const updateBenchItemContents = useLabStore((s) => s.updateBenchItemContents);
  const setActiveBottomTab = useLabStore((s) => s.setActiveBottomTab);
  const setActiveRightTab = useLabStore((s) => s.setActiveRightTab);
  const openStructureViewer = useLabStore((s) => s.openStructureViewer);
  const showNotification = useLabStore((s) => s.showNotification);
  const setBenchItemEffects = useLabStore((s) => s.setBenchItemEffects);
  const resetAllDamage = useLabStore((s) => s.resetAllDamage);
  const clearAllEffects = useLabStore((s) => s.clearAllEffects);

  const selectedItem = selectedBenchItem
    ? benchItems.find((b) => b.id === selectedBenchItem) ?? null
    : null;

  return {
    selectedItem,
    selectedBenchItem,
    benchItems,
    updateBenchItemContents,
    setActiveBottomTab,
    setActiveRightTab,
    openStructureViewer,
    showNotification,
    setBenchItemEffects,
    resetAllDamage,
    clearAllEffects,
  };
}
