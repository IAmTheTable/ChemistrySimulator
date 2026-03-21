import { create } from "zustand";
import type { ReactionLogEntry } from "../types/reaction";

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

interface LabState {
  selectedElement: number | null;
  activeStation: StationId;
  benchItems: BenchItem[];
  selectedBenchItem: string | null;
  placingEquipment: string | null;
  simulationMode: "instant" | "realistic";
  reactionLog: ReactionLogEntry[];
  environment: {
    temperature: number;
    pressure: number;
    atmosphere: string;
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
}

export const useLabStore = create<LabState>()((set) => ({
  selectedElement: null,
  activeStation: "main-bench",
  benchItems: [],
  selectedBenchItem: null,
  placingEquipment: null,
  simulationMode: "instant",
  reactionLog: [],
  environment: {
    temperature: 25,
    pressure: 1,
    atmosphere: "air",
  },

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
}));
