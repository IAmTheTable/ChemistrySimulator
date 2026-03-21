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

const STRUCTURE_VIEWER_DEFAULTS = { formula: null, atomicNumber: null, mode: "ball-and-stick" as const, showLabels: false };

const STARTER_ITEMS: BenchItem[] = [
  { id: "beaker-1", type: "beaker", position: [-0.6, 0.20, 0.3], contents: [], temperature: 25, activeEffects: [] },
  { id: "beaker-2", type: "beaker", position: [0.2, 0.20, -0.2], contents: [], temperature: 25, activeEffects: [] },
  { id: "flask-1", type: "erlenmeyer", position: [0.8, 0.14, 0.4], contents: [], temperature: 25, activeEffects: [] },
  { id: "tube-1", type: "test-tube", position: [-1.35, 0.495, -1.05], contents: [], temperature: 25, activeEffects: [] },
  { id: "tube-2", type: "test-tube", position: [-1.25, 0.495, -1.05], contents: [], temperature: 25, activeEffects: [] },
  { id: "tube-3", type: "test-tube", position: [-1.15, 0.495, -1.05], contents: [], temperature: 25, activeEffects: [] },
];

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
  benchItems: [...STARTER_ITEMS],
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
  structureViewer: { ...STRUCTURE_VIEWER_DEFAULTS },

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
  openStructureViewer: (formula) => set({ structureViewer: { ...STRUCTURE_VIEWER_DEFAULTS, formula } }),
  openOrbitalViewer: (atomicNumber) => set({ structureViewer: { ...STRUCTURE_VIEWER_DEFAULTS, atomicNumber, mode: "orbital" } }),
  setStructureMode: (mode) => set((state) => ({ structureViewer: { ...state.structureViewer, mode } })),
  toggleStructureLabels: () => set((state) => ({ structureViewer: { ...state.structureViewer, showLabels: !state.structureViewer.showLabels } })),
  closeStructureViewer: () => set({ structureViewer: { ...STRUCTURE_VIEWER_DEFAULTS } }),
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

      // Build effects list
      const effectNames: string[] = [];
      if (result.effects.gas) effectNames.push("bubbles");
      if (result.effects.heat === "exothermic") effectNames.push("steam");
      if (result.effects.precipitate) effectNames.push("precipitate");

      // Merge contents, temperature, and effects into a single set() call
      set((state) => ({
        benchItems: state.benchItems.map((item) => {
          if (item.id === targetId) {
            return { ...item, contents: newContents, temperature: item.temperature + result.temp_change, activeEffects: effectNames };
          }
          if (item.id === sourceId) {
            return { ...item, contents: [] };
          }
          return item;
        }),
        reactionLog: [
          { ...result, id: `rxn-${Date.now()}`, timestamp: new Date() },
          ...state.reactionLog,
        ].slice(0, 100),
      }));

      // Clear effects after timeout using the existing action
      if (effectNames.length > 0) {
        setTimeout(() => {
          useLabStore.getState().setBenchItemEffects(targetId, []);
        }, 5000);
      }
    } catch (e) {
      console.error("Reaction failed:", e);
    }
  },
}));
