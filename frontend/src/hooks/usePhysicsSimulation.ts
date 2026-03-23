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
