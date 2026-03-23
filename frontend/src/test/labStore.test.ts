import { describe, it, expect, beforeEach } from "vitest";
import { useLabStore } from "../stores/labStore";

describe("labStore", () => {
  beforeEach(() => {
    useLabStore.setState(useLabStore.getInitialState());
  });

  it("starts with no selected element", () => {
    expect(useLabStore.getState().selectedElement).toBeNull();
  });

  it("selects an element", () => {
    useLabStore.getState().selectElement(6);
    expect(useLabStore.getState().selectedElement).toBe(6);
  });

  it("clears selected element", () => {
    useLabStore.getState().selectElement(6);
    useLabStore.getState().selectElement(null);
    expect(useLabStore.getState().selectedElement).toBeNull();
  });

  it("starts on main-bench station", () => {
    expect(useLabStore.getState().activeStation).toBe("main-bench");
  });

  it("switches stations", () => {
    useLabStore.getState().setStation("fume-hood");
    expect(useLabStore.getState().activeStation).toBe("fume-hood");
  });

  it("starts with starter items", () => {
    expect(useLabStore.getState().benchItems.length).toBeGreaterThanOrEqual(6);
  });

  it("tracks bench items", () => {
    const initialCount = useLabStore.getState().benchItems.length;
    useLabStore.getState().addBenchItem({
      id: "test-beaker-new",
      type: "beaker",
      position: [0, 0, 0],
      contents: [],
      temperature: 25,
      activeEffects: [],
      damaged: false,
    });
    expect(useLabStore.getState().benchItems).toHaveLength(initialCount + 1);
    const added = useLabStore.getState().benchItems.find((b) => b.id === "test-beaker-new");
    expect(added).toBeDefined();
  });

  it("moves a bench item", () => {
    useLabStore.getState().addBenchItem({
      id: "test-beaker-move",
      type: "beaker",
      position: [0, 0, 0],
      contents: [],
      temperature: 25,
      activeEffects: [],
      damaged: false,
    });
    useLabStore.getState().moveBenchItem("test-beaker-move", [1, 0, 2]);
    const item = useLabStore.getState().benchItems.find((b) => b.id === "test-beaker-move")!;
    expect(item.position).toEqual([1, 0, 2]);
  });

  it("removes a bench item", () => {
    const initialCount = useLabStore.getState().benchItems.length;
    useLabStore.getState().addBenchItem({
      id: "test-beaker-remove",
      type: "beaker",
      position: [0, 0, 0],
      contents: [],
      temperature: 25,
      activeEffects: [],
      damaged: false,
    });
    expect(useLabStore.getState().benchItems).toHaveLength(initialCount + 1);
    useLabStore.getState().removeBenchItem("test-beaker-remove");
    expect(useLabStore.getState().benchItems).toHaveLength(initialCount);
  });

  it("selects a bench item", () => {
    useLabStore.getState().selectBenchItem("beaker-1");
    expect(useLabStore.getState().selectedBenchItem).toBe("beaker-1");
  });

  it("sets placing equipment mode", () => {
    useLabStore.getState().setPlacingEquipment("beaker");
    expect(useLabStore.getState().placingEquipment).toBe("beaker");
  });

  it("clears placing mode when item is added", () => {
    useLabStore.getState().setPlacingEquipment("beaker");
    useLabStore.getState().addBenchItem({
      id: "b-1",
      type: "beaker",
      position: [0, 0, 0],
      contents: [],
      temperature: 25,
      activeEffects: [],
      damaged: false,
    });
    expect(useLabStore.getState().placingEquipment).toBeNull();
  });

  it("defaults to instant simulation mode", () => {
    expect(useLabStore.getState().simulationMode).toBe("instant");
  });

  it("switches simulation mode", () => {
    useLabStore.getState().setSimulationMode("realistic");
    expect(useLabStore.getState().simulationMode).toBe("realistic");
  });

  it("adds reaction log entry", () => {
    useLabStore.getState().addReactionLogEntry({
      id: "r1",
      timestamp: new Date(),
      equation: "Na + H2O -> NaOH + H2",
      reaction_type: "single_displacement",
      source: "curated",
      reactants: [],
      products: [],
      limiting_reagent: null,
      yield_percent: 100,
      delta_h: -184,
      delta_s: null,
      delta_g: null,
      spontaneous: true,
      temp_change: 45,
      effects: {
        color: null,
        gas: null,
        heat: null,
        precipitate: null,
        special: [],
        sounds: [],
        safety: [],
      },
      description: "",
      observations: [],
      safety_notes: [],
      balanced_with_states: "",
    });
    expect(useLabStore.getState().reactionLog).toHaveLength(1);
  });

  it("updates bench item contents", () => {
    useLabStore.getState().addBenchItem({
      id: "test-b-1",
      type: "beaker",
      position: [0, 0, 0],
      contents: [],
      temperature: 25,
      activeEffects: [],
      damaged: false,
    });
    useLabStore.getState().updateBenchItemContents(
      "test-b-1",
      [{ formula: "NaCl", amount_ml: 50, phase: "aq", color: "#f8f8f8" }],
      38
    );
    const item = useLabStore.getState().benchItems.find((b) => b.id === "test-b-1")!;
    expect(item.contents).toHaveLength(1);
    expect(item.contents[0].formula).toBe("NaCl");
    expect(item.temperature).toBe(38);
  });
});
