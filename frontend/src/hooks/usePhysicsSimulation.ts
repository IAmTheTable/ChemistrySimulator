import { useEffect } from "react";
import { useLabStore } from "../stores/labStore";
import type { ReactionLogEntry } from "../types/reaction";

const TICK_INTERVAL = 1000;
const AMBIENT_THRESHOLD = 0.5; // °C — close enough to ambient to snap

const OPEN_CONTAINERS = new Set(["beaker", "watch-glass", "graduated-cylinder", "petri-dish", "crucible", "funnel"]);

const COOLING_RATES: Record<string, number> = {
  beaker: 0.05, erlenmeyer: 0.04, "test-tube": 0.06,
  "round-bottom": 0.03, "watch-glass": 0.08, "graduated-cylinder": 0.04,
  "petri-dish": 0.09, crucible: 0.03,
  funnel: 0.09, pipette: 0.07, "clamp-stand": 0.01,
};

const BOILING_POINTS: Record<string, number> = {
  // Gases at room temp (boil below 25°C — evaporate in open containers)
  HCl: -85, NH3: -33, C2H4: -104, H2S: -60, SO2: -10, NO2: 21, HF: 19.5,
  Cl2: -34, HBr: -67, HI: -35, CO2: -78.5, N2O: -88,
  // Low boiling liquids
  CH2Cl2: 39.6, C3H6O: 56.1, CHCl3: 61.2, CS2: 46.2,
  // Medium boiling liquids
  CH3OH: 64.7, C2H5OH: 78.4, C6H6: 80.1, CCl4: 76.7,
  C3H7OH: 97, H2O: 100, HCOOH: 101, C4H9OH: 117,
  // High boiling liquids (won't evaporate easily)
  CH3COOH: 118, C3H8O3: 290, H2SO4: 337, H3PO4: 407,
  HNO3: 83, C6H5OH: 182,
  // Very high — essentially non-volatile
  NaOH: 1388, KOH: 1327, NaCl: 1413,
};

const FREEZING_POINTS: Record<string, number> = {
  H2O: 0, C2H5OH: -114, CH3OH: -97.6, C6H6: 5.5, Hg: -38.8,
  CH3COOH: 16.6, C6H12: 6.5, CCl4: -23, CHCl3: -63.5,
  HNO3: -42, H2SO4: 10.4, C3H6O: -95, CS2: -111.6,
  NaCl: 801, KCl: 770, NaOH: 318, KOH: 360,
  CaCO3: 825, Na2CO3: 851, NaHCO3: 50,
  C6H5OH: 41, C3H8O3: 18, HCOOH: 8.3,
  Br2: -7.2, I2: 113.7, S: 115.2, P: 44.2,
  Fe: 1538, Cu: 1085, Al: 660, Zn: 419.5, Ag: 961.8, Au: 1064,
  Na: 97.8, K: 63.4, Mg: 650, Ca: 842, Li: 180.5,
  Sn: 231.9, Pb: 327.5, Ni: 1455, Co: 1495,
};

const DENSITIES: Record<string, number> = { // g/mL
  H2O: 1.0, C2H5OH: 0.789, CH3OH: 0.792, C3H6O: 0.784,
  H2SO4: 1.84, HNO3: 1.51, HCl: 1.19, H3PO4: 1.88,
  NaOH: 2.13, KOH: 2.12, CH3COOH: 1.049,
  C6H6: 0.879, CCl4: 1.594, CHCl3: 1.489, CS2: 1.266,
  Hg: 13.534, Br2: 3.1, C3H8O3: 1.261,
  NaCl: 2.165, CaCO3: 2.711, Na2CO3: 2.54,
  Fe: 7.874, Cu: 8.96, Al: 2.70, Zn: 7.13, Ag: 10.49, Au: 19.3,
  Na: 0.968, K: 0.862, Mg: 1.738, Ca: 1.55, Li: 0.534,
  KCl: 1.984, NaHCO3: 2.20, CuSO4: 3.60, AgNO3: 4.35,
  FeCl3: 2.90, BaCl2: 3.856, NH4Cl: 1.527, KMnO4: 2.703,
};

// Solubility data: g per 100 mL of solvent
const SOLUBILITY: Record<string, Record<string, number>> = {
  NaCl: { H2O: 36 },
  KCl: { H2O: 34 },
  NaOH: { H2O: 111 },
  KOH: { H2O: 121 },
  AgNO3: { H2O: 256 },
  CuSO4: { H2O: 32 },
  Na2CO3: { H2O: 30 },
  NaHCO3: { H2O: 9.6 },
  CaCO3: { H2O: 0.0013 },
  BaSO4: { H2O: 0.00024 },
  AgCl: { H2O: 0.00019 },
  Fe: { H2O: 0 },
  Cu: { H2O: 0 },
  KI: { H2O: 150 },
  NH4Cl: { H2O: 37.2 },
  NH4NO3: { H2O: 190 },
  CaCl2: { H2O: 74.5 },
  FeCl3: { H2O: 91.8 },
  BaCl2: { H2O: 37.5 },
  KMnO4: { H2O: 6.4 },
  C6H12O6: { H2O: 91 },
  C12H22O11: { H2O: 200 },
  CH4N2O: { H2O: 108 },
  Na2S2O3: { H2O: 79.4 },
};

const LIQUID_COOLING_FACTOR = 0.6;

// Thermal decomposition: formula -> { minTemp, products, description }
const THERMAL_DECOMPOSITIONS: Record<string, {
  minTemp: number;
  products: { formula: string; phase: string; color: string }[];
  description: string;
}> = {
  // Sugar caramelization then charring
  "C6H12O6": { minTemp: 170, products: [
    { formula: "C", phase: "s", color: "#333333" },
    { formula: "H2O", phase: "g", color: "#e8f4f8" },
  ], description: "Glucose decomposes — caramelization then charring" },
  "C12H22O11": { minTemp: 186, products: [
    { formula: "C", phase: "s", color: "#1a1a1a" },
    { formula: "H2O", phase: "g", color: "#e8f4f8" },
  ], description: "Sucrose decomposes — caramelization then charring to carbon and water" },

  // Carbonates
  "CaCO3": { minTemp: 840, products: [
    { formula: "CaO", phase: "s", color: "#f0f0f0" },
    { formula: "CO2", phase: "g", color: "#d0d0d0" },
  ], description: "Calcium carbonate thermally decomposes to quicklime and CO2" },
  "NaHCO3": { minTemp: 270, products: [
    { formula: "Na2CO3", phase: "s", color: "#f0f0f0" },
    { formula: "H2O", phase: "g", color: "#e8f4f8" },
    { formula: "CO2", phase: "g", color: "#d0d0d0" },
  ], description: "Baking soda decomposes on heating" },
  "MgCO3": { minTemp: 540, products: [
    { formula: "MgO", phase: "s", color: "#f0f0f0" },
    { formula: "CO2", phase: "g", color: "#d0d0d0" },
  ], description: "Magnesium carbonate thermally decomposes" },

  // Hydroxides
  "Cu(OH)2": { minTemp: 185, products: [
    { formula: "CuO", phase: "s", color: "#1a1a1a" },
    { formula: "H2O", phase: "g", color: "#e8f4f8" },
  ], description: "Copper hydroxide decomposes to black copper oxide" },
  "Ca(OH)2": { minTemp: 580, products: [
    { formula: "CaO", phase: "s", color: "#f0f0f0" },
    { formula: "H2O", phase: "g", color: "#e8f4f8" },
  ], description: "Calcium hydroxide decomposes" },

  // Nitrates
  "KNO3": { minTemp: 400, products: [
    { formula: "KNO2", phase: "s", color: "#f0f0f0" },
    { formula: "O2", phase: "g", color: "#e0e0e0" },
  ], description: "Potassium nitrate decomposes releasing oxygen" },
  "NH4NO3": { minTemp: 250, products: [
    { formula: "N2O", phase: "g", color: "#e0e0e0" },
    { formula: "H2O", phase: "g", color: "#e8f4f8" },
  ], description: "Ammonium nitrate decomposes — can be explosive at high temperature!" },

  // Chlorates
  "KClO3": { minTemp: 400, products: [
    { formula: "KCl", phase: "s", color: "#f0f0f0" },
    { formula: "O2", phase: "g", color: "#e0e0e0" },
  ], description: "Potassium chlorate decomposes releasing oxygen gas" },

  // Peroxides
  "H2O2": { minTemp: 60, products: [
    { formula: "H2O", phase: "l", color: "#e8f4f8" },
    { formula: "O2", phase: "g", color: "#e0e0e0" },
  ], description: "Hydrogen peroxide decomposes to water and oxygen" },

  // Metal hydrides and others
  "NH4Cl": { minTemp: 338, products: [
    { formula: "NH3", phase: "g", color: "#e8e8ff" },
    { formula: "HCl", phase: "g", color: "#e0e0e0" },
  ], description: "Ammonium chloride sublimes, dissociating into ammonia and HCl gas" },

  // Organic decomposition
  "CH3COOH": { minTemp: 440, products: [
    { formula: "CH4", phase: "g", color: "#e0e0e0" },
    { formula: "CO2", phase: "g", color: "#d0d0d0" },
  ], description: "Acetic acid thermally decomposes" },

  // Urea
  "CH4N2O": { minTemp: 133, products: [
    { formula: "NH3", phase: "g", color: "#e8e8ff" },
    { formula: "CO2", phase: "g", color: "#d0d0d0" },
  ], description: "Urea decomposes releasing ammonia" },

  // Hydrated copper sulfate
  "CuSO4": { minTemp: 110, products: [
    { formula: "CuSO4", phase: "s", color: "#f0f0f0" }, // anhydrous = white!
    { formula: "H2O", phase: "g", color: "#e8f4f8" },
  ], description: "Copper sulfate loses water of crystallization — turns from blue to white" },
};

// Gradual color change on heating (caramelization, dehydration, etc.)
const COLOR_CHANGES: Record<string, {
  startTemp: number;
  endTemp: number;
  startColor: string;
  endColor: string;
}> = {
  "C6H12O6": { startTemp: 150, endTemp: 190, startColor: "#f5f5dc", endColor: "#8b4513" },
  "C12H22O11": { startTemp: 160, endTemp: 200, startColor: "#fffaf0", endColor: "#654321" },
  "CuSO4": { startTemp: 90, endTemp: 130, startColor: "#4169e1", endColor: "#f0f0f0" },
};

export function usePhysicsSimulation() {
  useEffect(() => {
    const interval = setInterval(() => {
      const { benchItems, environment } = useLabStore.getState();
      const { temperature: ambientTemp, pressure } = environment;
      const pressureBPAdjust = Math.log2(Math.max(0.01, pressure)) * 20;

      let anyChanged = false;
      const updatedItems = benchItems.map((item) => {
        const diff = item.temperature - ambientTemp;

        // Already at ambient and no contents to phase-check
        if (Math.abs(diff) < AMBIENT_THRESHOLD && item.contents.length === 0) {
          return item;
        }

        // Compute new temperature
        const k = COOLING_RATES[item.type] ?? 0.04;
        const hasLiquid = item.contents.some(s => s.phase === "l" || s.phase === "aq");
        const effectiveK = hasLiquid ? k * LIQUID_COOLING_FACTOR : k;
        let newTemp: number;
        if (Math.abs(diff) < AMBIENT_THRESHOLD) {
          newTemp = ambientTemp;
        } else {
          newTemp = Math.round((ambientTemp + diff * (1 - effectiveK)) * 10) / 10;
        }

        // Phase change checks — single pass over contents
        let contentsChanged = false;
        let isBoiling = false;
        let isReleasingGas = false;
        const newContents = item.contents.map(s => {
          const isLiquid = s.phase === "l" || s.phase === "aq";
          // Aqueous solutions use water's boiling point, not the solute's
          const bp = s.phase === "aq" ? (BOILING_POINTS["H2O"] ?? 100) : BOILING_POINTS[s.formula];
          const fp = FREEZING_POINTS[s.formula];

          // Boiling
          if (bp !== undefined && isLiquid) {
            const adjustedBP = bp + pressureBPAdjust;
            if (newTemp >= adjustedBP) {
              isBoiling = true;
              const evapRate = 0.02 * (newTemp - adjustedBP + 1);
              const newAmount = Math.max(0, s.amount_ml - evapRate);
              if (newAmount !== s.amount_ml) {
                contentsChanged = true;
                return { ...s, amount_ml: newAmount };
              }
            }
          }

          // Freezing
          if (fp !== undefined && isLiquid && newTemp <= fp) {
            contentsChanged = true;
            return { ...s, phase: "s" };
          }

          // Thawing
          if (fp !== undefined && s.phase === "s" && newTemp > fp) {
            contentsChanged = true;
            return { ...s, phase: "l" };
          }

          // Gas escape from open containers
          if (s.phase === "g" && OPEN_CONTAINERS.has(item.type)) {
            const escapeRate = 3; // mL per tick
            contentsChanged = true;
            isReleasingGas = true;
            return { ...s, amount_ml: Math.max(0, s.amount_ml - escapeRate) };
          }

          return s;
        }).filter(s => s.amount_ml > 0);

        // Solubility simulation — dissolve solids into liquids
        const liquids = newContents.filter(s => s.phase === "l" || s.phase === "aq");
        const solids = newContents.filter(s => s.phase === "s");
        if (liquids.length > 0 && solids.length > 0) {
          for (const solid of solids) {
            for (const liquid of liquids) {
              const solData = SOLUBILITY[solid.formula];
              if (!solData) continue;
              const maxG = solData[liquid.formula];
              if (maxG === undefined || maxG <= 0) continue;
              // Compute how much is already dissolved (aq phase of same formula)
              const alreadyDissolved = newContents
                .filter(s => s.formula === solid.formula && s.phase === "aq")
                .reduce((sum, s) => sum + s.amount_ml, 0);
              const solventVol = liquid.amount_ml;
              const density = DENSITIES[solid.formula] ?? 2.0;
              const maxDissolveML = (maxG / 100) * solventVol / density;
              const canDissolve = Math.max(0, maxDissolveML - alreadyDissolved);
              if (canDissolve > 0 && solid.amount_ml > 0) {
                const dissolveAmount = Math.min(solid.amount_ml, canDissolve * 0.1); // 10% per tick
                if (dissolveAmount > 0.001) {
                  solid.amount_ml -= dissolveAmount;
                  // Add to existing aq entry or create one
                  const aqEntry = newContents.find(s => s.formula === solid.formula && s.phase === "aq");
                  if (aqEntry) {
                    aqEntry.amount_ml += dissolveAmount;
                  } else {
                    newContents.push({ formula: solid.formula, amount_ml: dissolveAmount, phase: "aq", color: solid.color });
                  }
                  contentsChanged = true;
                }
              }
            }
          }
          // Remove zero-volume entries
          for (let i = newContents.length - 1; i >= 0; i--) {
            if (newContents[i].amount_ml <= 0.001) {
              newContents.splice(i, 1);
              contentsChanged = true;
            }
          }
        }

        if (newContents.length !== item.contents.length) contentsChanged = true;

        // Color change on heating (caramelization, dehydration, etc.)
        for (const s of newContents) {
          const colorChange = COLOR_CHANGES[s.formula];
          if (colorChange && newTemp >= colorChange.startTemp && newTemp < colorChange.endTemp) {
            const t = (newTemp - colorChange.startTemp) / (colorChange.endTemp - colorChange.startTemp);
            const startR = parseInt(colorChange.startColor.slice(1, 3), 16);
            const startG = parseInt(colorChange.startColor.slice(3, 5), 16);
            const startB = parseInt(colorChange.startColor.slice(5, 7), 16);
            const endR = parseInt(colorChange.endColor.slice(1, 3), 16);
            const endG = parseInt(colorChange.endColor.slice(3, 5), 16);
            const endB = parseInt(colorChange.endColor.slice(5, 7), 16);
            const r = Math.round(startR + (endR - startR) * t);
            const g = Math.round(startG + (endG - startG) * t);
            const b = Math.round(startB + (endB - startB) * t);
            const newColor = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
            if (s.color !== newColor) {
              s.color = newColor;
              contentsChanged = true;
            }
          }
        }

        // Thermal decomposition check
        const newEffectsArr: string[] = [...item.activeEffects];
        for (const s of newContents) {
          const decomp = THERMAL_DECOMPOSITIONS[s.formula];
          if (decomp && newTemp >= decomp.minTemp && s.amount_ml > 0) {
            contentsChanged = true;
            const idx = newContents.indexOf(s);
            if (idx >= 0) {
              const amount = s.amount_ml;
              const originalFormula = s.formula;
              const originalPhase = s.phase;
              newContents.splice(idx, 1); // remove original
              // Add products, splitting volume among them
              const perProduct = amount / decomp.products.length;
              for (const p of decomp.products) {
                const existing = newContents.find(c => c.formula === p.formula && c.phase === p.phase);
                if (existing) {
                  existing.amount_ml += perProduct;
                } else {
                  newContents.push({ formula: p.formula, amount_ml: perProduct, phase: p.phase, color: p.color });
                }
              }
              // Add visual effects
              if (!newEffectsArr.includes("steam")) newEffectsArr.push("steam");
              if (decomp.products.some(p => p.phase === "g") && !newEffectsArr.includes("gas_release")) {
                newEffectsArr.push("gas_release");
              }
              // Show notification
              useLabStore.getState().showNotification(decomp.description);
              // Add to reaction log
              const logEntry: ReactionLogEntry = {
                id: `decomp-${Date.now()}`,
                timestamp: new Date(),
                equation: `${originalFormula} → ${decomp.products.map(p => p.formula).join(" + ")} (thermal)`,
                reaction_type: "decomposition",
                source: "predicted",
                reactants: [{ formula: originalFormula, amount, phase: originalPhase }],
                products: decomp.products.map(p => ({ formula: p.formula, amount: amount / decomp.products.length, phase: p.phase, color: p.color })),
                limiting_reagent: null,
                yield_percent: 100,
                delta_h: null,
                delta_s: null,
                delta_g: null,
                spontaneous: true,
                temp_change: 0,
                effects: {
                  color: null,
                  gas: decomp.products.some(p => p.phase === "g")
                    ? { type: decomp.products.find(p => p.phase === "g")!.formula, rate: "moderate" }
                    : null,
                  heat: "endothermic",
                  precipitate: null,
                  special: [],
                  sounds: ["sizzle"],
                  safety: [],
                },
                description: decomp.description,
                observations: [decomp.description],
                safety_notes: [],
                balanced_with_states: "",
              };
              useLabStore.getState().addReactionLogEntry(logEntry);
              break; // only decompose one substance per tick
            }
          }
        }

        // Update effects — start from newEffectsArr which may already include decomposition effects
        let newEffects = newEffectsArr;
        const decompAddedSteam = newEffectsArr.includes("steam") && !item.activeEffects.includes("steam");
        const decompAddedGasRelease = newEffectsArr.includes("gas_release") && !item.activeEffects.includes("gas_release");

        const hadSteam = item.activeEffects.includes("steam");
        if (isBoiling && !newEffects.includes("steam")) {
          newEffects = [...newEffects, "steam"];
          contentsChanged = true;
        } else if (!isBoiling && !decompAddedSteam && hadSteam) {
          newEffects = newEffects.filter(e => e !== "steam");
          contentsChanged = true;
        }

        // Update gas_release effect
        const hadGasRelease = item.activeEffects.includes("gas_release");
        if (isReleasingGas && !newEffects.includes("gas_release")) {
          newEffects = [...newEffects, "gas_release"];
          contentsChanged = true;
        } else if (!isReleasingGas && !decompAddedGasRelease && hadGasRelease) {
          newEffects = newEffects.filter(e => e !== "gas_release");
          contentsChanged = true;
        }


        const tempChanged = newTemp !== item.temperature;
        if (!tempChanged && !contentsChanged) return item;

        anyChanged = true;
        return {
          ...item,
          temperature: newTemp,
          ...(contentsChanged ? { contents: newContents, activeEffects: newEffects } : {}),
        };
      });

      if (anyChanged) {
        useLabStore.setState({ benchItems: updatedItems });

        // In realistic mode, check for heat-activated reactions
        const { simulationMode } = useLabStore.getState();
        if (simulationMode === "realistic") {
          for (const item of updatedItems) {
            if (item.contents.length >= 2) {
              const original = benchItems.find((b) => b.id === item.id);
              if (original && Math.abs(item.temperature - original.temperature) > 10) {
                setTimeout(() => {
                  useLabStore.getState().combineContainers(item.id, item.id);
                }, 100);
              }
            }
          }
        }
      }
    }, TICK_INTERVAL);

    return () => clearInterval(interval);
  }, []);
}
