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

  it("tracks bench items", () => {
    useLabStore.getState().addBenchItem({
      id: "beaker-1",
      type: "beaker",
      position: [0, 0, 0],
      contents: [],
    });
    expect(useLabStore.getState().benchItems).toHaveLength(1);
    expect(useLabStore.getState().benchItems[0].id).toBe("beaker-1");
  });

  it("moves a bench item", () => {
    useLabStore.getState().addBenchItem({
      id: "beaker-1",
      type: "beaker",
      position: [0, 0, 0],
      contents: [],
    });
    useLabStore.getState().moveBenchItem("beaker-1", [1, 0, 2]);
    expect(useLabStore.getState().benchItems[0].position).toEqual([1, 0, 2]);
  });

  it("removes a bench item", () => {
    useLabStore.getState().addBenchItem({
      id: "beaker-1",
      type: "beaker",
      position: [0, 0, 0],
      contents: [],
    });
    useLabStore.getState().removeBenchItem("beaker-1");
    expect(useLabStore.getState().benchItems).toHaveLength(0);
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
    });
    expect(useLabStore.getState().placingEquipment).toBeNull();
  });
});
