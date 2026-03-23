import { useEffect } from "react";
import { useLabStore } from "../stores/labStore";

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

        // Update effects only if boiling state changed
        let newEffects = item.activeEffects;
        const hadSteam = item.activeEffects.includes("steam");
        if (isBoiling && !hadSteam) {
          newEffects = [...newEffects, "steam"];
          contentsChanged = true;
        } else if (!isBoiling && hadSteam) {
          newEffects = newEffects.filter(e => e !== "steam");
          contentsChanged = true;
        }

        // Update gas_release effect
        const hadGasRelease = item.activeEffects.includes("gas_release");
        if (isReleasingGas && !hadGasRelease) {
          newEffects = [...newEffects, "gas_release"];
          contentsChanged = true;
        } else if (!isReleasingGas && hadGasRelease) {
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
