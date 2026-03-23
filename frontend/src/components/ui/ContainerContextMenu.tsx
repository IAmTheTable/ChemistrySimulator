import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLabStore } from "../../stores/labStore";

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
      {/* Temperature header */}
      {item && (
        <div className="px-2 py-1 text-[10px] text-gray-500 border-b border-gray-700 mb-1">
          Temp: {item.temperature}&deg;C &middot; {item.contents.length} substance{item.contents.length !== 1 ? "s" : ""}
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
