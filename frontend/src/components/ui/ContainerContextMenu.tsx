import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLabStore } from "../../stores/labStore";
import type { BenchItem } from "../../stores/labStore";

/**
 * DOM-level context menu overlay for lab containers.
 *
 * Because equipment renders inside a Three.js <Canvas> (WebGL), Radix
 * ContextMenu.Trigger cannot wrap those elements directly. Instead:
 *   - Equipment calls openContextMenu({ itemId, x, y }) on right-click.
 *   - This component renders a positioned menu in a portal at (x, y).
 */
export default function ContainerContextMenu() {
  const contextMenu = useLabStore((s) => s.contextMenu);
  const closeContextMenu = useLabStore((s) => s.closeContextMenu);
  const removeBenchItem = useLabStore((s) => s.removeBenchItem);
  const updateBenchItemContents = useLabStore((s) => s.updateBenchItemContents);
  const selectBenchItem = useLabStore((s) => s.selectBenchItem);
  const setActiveRightTab = useLabStore((s) => s.setActiveRightTab);
  const startPouring = useLabStore((s) => s.startPouring);
  const combineContainers = useLabStore((s) => s.combineContainers);
  const benchItems = useLabStore((s) => s.benchItems);
  const connections = useLabStore((s) => s.connections);
  const addBenchItem = useLabStore((s) => s.addBenchItem);
  const showNotification = useLabStore((s) => s.showNotification);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!contextMenu) return;
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeContextMenu();
    };
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [contextMenu, closeContextMenu]);

  if (!contextMenu) return null;

  const { itemId, x, y } = contextMenu;

  const handleInspect = () => {
    selectBenchItem(itemId);
    setActiveRightTab("inspector");
    closeContextMenu();
  };

  const handleEmpty = () => {
    updateBenchItemContents(itemId, []);
    closeContextMenu();
  };

  const handleRemove = () => {
    removeBenchItem(itemId);
    closeContextMenu();
  };

  const handlePourInto = () => {
    startPouring(itemId);
    closeContextMenu();
  };

  const item = benchItems.find((b) => b.id === itemId);

  // Vacuum filtration — separate solid from liquid
  const isVacuumFilterConnected =
    item?.type === "vacuum-filter" &&
    connections.some((c) => c.targetId === itemId && c.type === "vacuum");

  const handleVacuumFilter = () => {
    if (!item) { closeContextMenu(); return; }
    const solids = item.contents.filter((s) => s.phase === "s");
    const liquids = item.contents.filter((s) => s.phase === "l" || s.phase === "aq");
    const gases = item.contents.filter((s) => s.phase === "g");

    if (item.contents.length === 0) {
      showNotification("Vacuum filter is empty");
      closeContextMenu();
      return;
    }

    if (solids.length === 0 && liquids.length === 0) {
      showNotification("Nothing to separate by filtration");
      closeContextMenu();
      return;
    }

    // Keep only solids in the funnel
    updateBenchItemContents(itemId, solids);

    // Place filtrate into a new collection flask nearby
    if (liquids.length > 0 || gases.length > 0) {
      const filtrate = [...liquids, ...gases];
      const [px, _py, pz] = item.position;
      addBenchItem({
        id: `erlenmeyer-filtrate-${Date.now()}`,
        type: "erlenmeyer",
        position: [px + 0.35, 0.14, pz],
        contents: filtrate,
        temperature: item.temperature,
        activeEffects: [],
        damaged: false,
      } as BenchItem);
      const solidNames = solids.map((s) => s.formula).join(", ") || "nothing";
      const filtrateNames = filtrate.map((s) => s.formula).join(", ");
      showNotification(
        `Vacuum filtration complete — solid retained: ${solidNames} | filtrate collected: ${filtrateNames}`
      );
    } else {
      const solidNames = solids.map((s) => s.formula).join(", ");
      showNotification(`Vacuum filtration complete — solid retained on filter paper: ${solidNames}`);
    }
    closeContextMenu();
  };

  const handleHeat = () => {
    if (item) {
      updateBenchItemContents(itemId, item.contents, item.temperature + 25);
    }
    closeContextMenu();
  };

  const handleCool = () => {
    if (item) {
      updateBenchItemContents(itemId, item.contents, Math.max(-273, item.temperature - 25));
    }
    closeContextMenu();
  };

  const handleStir = () => {
    if (item && item.contents.length > 1) {
      // Re-run reaction check by combining container with itself
      combineContainers(itemId, itemId);
    }
    closeContextMenu();
  };

  const FUTURE_ACTIONS = ["Weigh", "Measure Temp"];

  return createPortal(
    <div
      ref={menuRef}
      style={{ position: "fixed", left: x, top: y, zIndex: 9999 }}
      className="min-w-[160px] rounded-md bg-gray-800 border border-gray-700 p-1 shadow-xl text-sm"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Container summary header */}
      {item && (
        <div className="px-2 py-1 text-[10px] text-gray-500 border-b border-gray-700 mb-1">
          <div>{item.type.replace("-", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}{item.damaged ? " (damaged)" : ""}</div>
          <div>
            Temp: {item.temperature}&deg;C
            {item.contents.length > 0 && (
              <> &middot; {item.contents.map((s) => s.formula).join(", ")}</>
            )}
            {item.contents.length === 0 && <> &middot; empty</>}
          </div>
        </div>
      )}

      <button
        onClick={handleInspect}
        className="w-full text-left flex items-center px-2 py-1.5 rounded text-gray-200 hover:bg-gray-700 transition-colors"
      >
        Inspect
      </button>
      <button
        onClick={handlePourInto}
        className="w-full text-left flex items-center px-2 py-1.5 rounded text-gray-200 hover:bg-gray-700 transition-colors"
      >
        Pour into...
      </button>
      <button
        onClick={handleHeat}
        className="w-full text-left flex items-center px-2 py-1.5 rounded text-orange-400 hover:bg-gray-700 transition-colors"
      >
        Heat (+25&deg;C)
      </button>
      <button
        onClick={handleCool}
        className="w-full text-left flex items-center px-2 py-1.5 rounded text-blue-400 hover:bg-gray-700 transition-colors"
      >
        Cool (-25&deg;C)
      </button>
      <button
        onClick={handleStir}
        className="w-full text-left flex items-center px-2 py-1.5 rounded text-gray-200 hover:bg-gray-700 transition-colors"
      >
        Stir
      </button>
      <button
        onClick={handleEmpty}
        className="w-full text-left flex items-center px-2 py-1.5 rounded text-gray-200 hover:bg-gray-700 transition-colors"
      >
        Empty
      </button>
      <button
        onClick={handleRemove}
        className="w-full text-left flex items-center px-2 py-1.5 rounded text-red-400 hover:bg-gray-700 transition-colors"
      >
        Remove
      </button>

      {isVacuumFilterConnected && (
        <>
          <div className="my-1 h-px bg-gray-700" />
          <button
            onClick={handleVacuumFilter}
            className="w-full text-left flex items-center px-2 py-1.5 rounded text-cyan-400 hover:bg-gray-700 transition-colors"
          >
            Run Vacuum Filtration
          </button>
        </>
      )}

      <div className="my-1 h-px bg-gray-700" />

      {FUTURE_ACTIONS.map((label) => (
        <button
          key={label}
          disabled
          className="w-full text-left flex items-center px-2 py-1.5 rounded text-gray-600 cursor-not-allowed"
        >
          {label}
        </button>
      ))}
    </div>,
    document.body
  );
}
