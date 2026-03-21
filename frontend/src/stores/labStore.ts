import { create } from "zustand";
import type { ReactionLogEntry } from "../types/reaction";
import { runReaction } from "../api/reactions";

export type StationId =
  | "main-bench"
  | "fume-hood"
  | "instrument-room"
  | "electrochemistry"
  | "glove-box"
  | "thermal-analysis"
  | "storage-safety";

export interface ContainerSubstance {
  formula: string;
  amount_ml: number;
  phase: string;
  color: string;
}

export interface BenchItem {
  id: string;
  type: string;
  position: [number, number, number];
  contents: ContainerSubstance[];
  temperature: number;
  activeEffects: string[];
}

export interface ContextMenuState {
  itemId: string;
  x: number;
  y: number;
}

interface LabState {
  selectedElement: number | null;
  activeStation: StationId;
  benchItems: BenchItem[];
  selectedBenchItem: string | null;
  placingEquipment: string | null;
  pouringFrom: string | null;
  simulationMode: "instant" | "realistic";
  reactionLog: ReactionLogEntry[];
  contextMenu: ContextMenuState | null;
  environment: {
    temperature: number;
    pressure: number;
    atmosphere: string;
  };
  structureViewer: {
    formula: string | null;
    atomicNumber: number | null;
    mode: "ball-and-stick" | "space-filling" | "wireframe" | "orbital";
    showLabels: boolean;
  };

  selectElement: (atomicNumber: number | null) => void;
  setStation: (station: StationId) => void;
  addBenchItem: (item: BenchItem) => void;
  removeBenchItem: (id: string) => void;
  moveBenchItem: (id: string, position: [number, number, number]) => void;
  selectBenchItem: (id: string | null) => void;
  setPlacingEquipment: (type: string | null) => void;
  setSimulationMode: (mode: "instant" | "realistic") => void;
  addReactionLogEntry: (entry: ReactionLogEntry) => void;
  updateBenchItemContents: (id: string, contents: ContainerSubstance[], temperature?: number) => void;
  setBenchItemEffects: (id: string, effects: string[]) => void;
  addSubstanceToContainer: (containerId: string, substance: ContainerSubstance) => void;
  startPouring: (containerId: string) => void;
  cancelPouring: () => void;
  openContextMenu: (state: ContextMenuState) => void;
  closeContextMenu: () => void;
  combineContainers: (sourceId: string, targetId: string) => Promise<void>;
  openStructureViewer: (formula: string) => void;
  openOrbitalViewer: (atomicNumber: number) => void;
  setStructureMode: (mode: "ball-and-stick" | "space-filling" | "wireframe" | "orbital") => void;
  toggleStructureLabels: () => void;
  closeStructureViewer: () => void;
}

export const useLabStore = create<LabState>()((set) => ({
  selectedElement: null,
  activeStation: "main-bench",
  benchItems: [],
  selectedBenchItem: null,
  placingEquipment: null,
  pouringFrom: null,
  simulationMode: "instant",
  reactionLog: [],
  contextMenu: null,
  environment: {
    temperature: 25,
    pressure: 1,
    atmosphere: "air",
  },
  structureViewer: { formula: null, atomicNumber: null, mode: "ball-and-stick", showLabels: false },

  selectElement: (atomicNumber) => set({ selectedElement: atomicNumber }),
  setStation: (station) => set({ activeStation: station }),
  addBenchItem: (item) =>
    set((state) => ({
      benchItems: [
        ...state.benchItems,
        {
          ...item,
          temperature: item.temperature ?? 25,
          activeEffects: item.activeEffects ?? [],
        },
      ],
      placingEquipment: null,
    })),
  removeBenchItem: (id) =>
    set((state) => ({
      benchItems: state.benchItems.filter((item) => item.id !== id),
      selectedBenchItem:
        state.selectedBenchItem === id ? null : state.selectedBenchItem,
    })),
  moveBenchItem: (id, position) =>
    set((state) => ({
      benchItems: state.benchItems.map((item) =>
        item.id === id ? { ...item, position } : item
      ),
    })),
  selectBenchItem: (id) => set({ selectedBenchItem: id }),
  setPlacingEquipment: (type) => set({ placingEquipment: type }),
  setSimulationMode: (mode) => set({ simulationMode: mode }),
  addReactionLogEntry: (entry) =>
    set((state) => ({ reactionLog: [entry, ...state.reactionLog] })),
  updateBenchItemContents: (id, contents, temperature) =>
    set((state) => ({
      benchItems: state.benchItems.map((item) =>
        item.id === id
          ? { ...item, contents, ...(temperature !== undefined ? { temperature } : {}) }
          : item
      ),
    })),
  setBenchItemEffects: (id, effects) =>
    set((state) => ({
      benchItems: state.benchItems.map((item) =>
        item.id === id ? { ...item, activeEffects: effects } : item
      ),
    })),
  addSubstanceToContainer: (containerId, substance) =>
    set((state) => ({
      benchItems: state.benchItems.map((item) =>
        item.id === containerId
          ? { ...item, contents: [...item.contents, substance] }
          : item
      ),
      placingEquipment: null,
    })),
  startPouring: (containerId) => set({ pouringFrom: containerId }),
  cancelPouring: () => set({ pouringFrom: null }),
  openContextMenu: (state) => set({ contextMenu: state }),
  closeContextMenu: () => set({ contextMenu: null }),
  openStructureViewer: (formula) => set({ structureViewer: { formula, atomicNumber: null, mode: "ball-and-stick", showLabels: false } }),
  openOrbitalViewer: (atomicNumber) => set({ structureViewer: { formula: null, atomicNumber, mode: "orbital", showLabels: false } }),
  setStructureMode: (mode) => set((state) => ({ structureViewer: { ...state.structureViewer, mode } })),
  toggleStructureLabels: () => set((state) => ({ structureViewer: { ...state.structureViewer, showLabels: !state.structureViewer.showLabels } })),
  closeStructureViewer: () => set({ structureViewer: { formula: null, atomicNumber: null, mode: "ball-and-stick", showLabels: false } }),
  combineContainers: async (sourceId: string, targetId: string) => {
    const state = useLabStore.getState();
    const source = state.benchItems.find((i) => i.id === sourceId);
    const target = state.benchItems.find((i) => i.id === targetId);
    if (!source || !target || source.contents.length === 0) return;

    const reactants = [...source.contents, ...target.contents].map((s) => ({
      formula: s.formula,
      amount_ml: s.amount_ml,
      phase: s.phase,
    }));

    try {
      const result = await runReaction(reactants, {
        temperature: target.temperature,
        pressure: 1,
        catalyst: null,
      });

      // Update target with products
      const newContents = result.products.map((p) => ({
        formula: p.formula,
        amount_ml: p.amount || 50,
        phase: p.phase,
        color: p.color || "#cccccc",
      }));

      set((state) => ({
        benchItems: state.benchItems.map((item) => {
          if (item.id === targetId) {
            return { ...item, contents: newContents, temperature: item.temperature + result.temp_change };
          }
          if (item.id === sourceId) {
            return { ...item, contents: [] };
          }
          return item;
        }),
        reactionLog: [
          { ...result, id: `rxn-${Date.now()}`, timestamp: new Date() },
          ...state.reactionLog,
        ],
      }));

      // Set effects, then clear after 5 seconds
      const effectNames: string[] = [];
      if (result.effects.gas) effectNames.push("bubbles");
      if (result.effects.heat === "exothermic") effectNames.push("steam");
      if (result.effects.precipitate) effectNames.push("precipitate");

      if (effectNames.length > 0) {
        set((state) => ({
          benchItems: state.benchItems.map((item) =>
            item.id === targetId ? { ...item, activeEffects: effectNames } : item
          ),
        }));
        setTimeout(() => {
          set((state) => ({
            benchItems: state.benchItems.map((item) =>
              item.id === targetId ? { ...item, activeEffects: [] } : item
            ),
          }));
        }, 5000);
      }
    } catch (e) {
      console.error("Reaction failed:", e);
    }
  },
}));
