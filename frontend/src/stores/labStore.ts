import { create } from "zustand";

export type StationId =
  | "main-bench"
  | "fume-hood"
  | "instrument-room"
  | "electrochemistry"
  | "glove-box"
  | "thermal-analysis"
  | "storage-safety";

export interface BenchItem {
  id: string;
  type: string;
  position: [number, number, number];
  contents: string[];
}

interface LabState {
  selectedElement: number | null;
  activeStation: StationId;
  benchItems: BenchItem[];
  selectedBenchItem: string | null;
  placingEquipment: string | null;
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
}

export const useLabStore = create<LabState>()((set) => ({
  selectedElement: null,
  activeStation: "main-bench",
  benchItems: [],
  selectedBenchItem: null,
  placingEquipment: null,
  environment: {
    temperature: 25,
    pressure: 1,
    atmosphere: "air",
  },

  selectElement: (atomicNumber) => set({ selectedElement: atomicNumber }),
  setStation: (station) => set({ activeStation: station }),
  addBenchItem: (item) =>
    set((state) => ({
      benchItems: [...state.benchItems, item],
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
}));
