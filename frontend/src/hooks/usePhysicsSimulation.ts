import { useEffect } from "react";
import { useLabStore } from "../stores/labStore";

const TICK_INTERVAL = 1000; // 1 second

// Cooling constant k — how fast temperature approaches ambient
// Depends on container type and whether it has liquid
const COOLING_RATES: Record<string, number> = {
  "beaker": 0.05,        // open top, cools faster
  "erlenmeyer": 0.04,    // narrower neck, slightly slower
  "test-tube": 0.06,     // small volume, cools fast
  "round-bottom": 0.03,  // thick glass, slower
  "watch-glass": 0.08,   // very exposed, cools fastest
  "graduated-cylinder": 0.04,
};

// Boiling points at 1 atm (°C) for common solvents
const BOILING_POINTS: Record<string, number> = {
  "H2O": 100, "C2H5OH": 78.4, "CH3OH": 64.7, "C3H6O": 56.1, // acetone
  "CH2Cl2": 39.6, "CHCl3": 61.2, "CCl4": 76.7, "C6H6": 80.1,
  "HCl": -85, "NH3": -33, "C2H4": -104,
};

// Freezing points at 1 atm (°C)
const FREEZING_POINTS: Record<string, number> = {
  "H2O": 0, "C2H5OH": -114, "CH3OH": -97.6, "C6H6": 5.5,
  "Hg": -38.8,
};

export function usePhysicsSimulation() {
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useLabStore.getState();
      const ambientTemp = state.environment.temperature;
      const pressure = state.environment.pressure;
      const benchItems = state.benchItems;

      let changed = false;
      const updatedItems = benchItems.map((item) => {
        const k = COOLING_RATES[item.type] ?? 0.04;
        const currentTemp = item.temperature;
        const diff = currentTemp - ambientTemp;

        // Skip if already at ambient (within 0.5°C)
        if (Math.abs(diff) < 0.5) {
          if (currentTemp !== ambientTemp) {
            changed = true;
            return { ...item, temperature: ambientTemp };
          }
          return item;
        }

        // Newton's Law of Cooling: T(t+dt) = T_ambient + (T - T_ambient) * e^(-k*dt)
        // Simplified: new_temp = ambient + diff * (1 - k)
        const hasLiquid = item.contents.some(s => s.phase === "l" || s.phase === "aq");
        const effectiveK = hasLiquid ? k * 0.6 : k; // liquid slows cooling
        const newTemp = Math.round((ambientTemp + diff * (1 - effectiveK)) * 10) / 10;

        // Phase change checks
        let newContents = item.contents;
        let newEffects = [...item.activeEffects];

        // Boiling check — adjusted by pressure (Clausius-Clapeyron approximation)
        // Every doubling of pressure raises BP by ~20°C for water
        const pressureBPAdjust = Math.log2(pressure) * 20;

        for (const substance of item.contents) {
          const baseBP = BOILING_POINTS[substance.formula];
          if (baseBP !== undefined) {
            const adjustedBP = baseBP + pressureBPAdjust;
            if (newTemp >= adjustedBP && (substance.phase === "l" || substance.phase === "aq")) {
              // Boiling! Reduce volume, add steam effect
              changed = true;
              const evapRate = 0.02 * (newTemp - adjustedBP + 1); // faster evap at higher temps
              newContents = newContents.map(s =>
                s.formula === substance.formula
                  ? { ...s, amount_ml: Math.max(0, s.amount_ml - evapRate) }
                  : s
              ).filter(s => s.amount_ml > 0);
              if (!newEffects.includes("steam")) newEffects.push("steam");
            }
          }

          // Freezing check
          const fp = FREEZING_POINTS[substance.formula];
          if (fp !== undefined && newTemp <= fp && (substance.phase === "l" || substance.phase === "aq")) {
            changed = true;
            newContents = newContents.map(s =>
              s.formula === substance.formula ? { ...s, phase: "s" } : s
            );
          }

          // Thawing check
          if (fp !== undefined && newTemp > fp && substance.phase === "s") {
            changed = true;
            newContents = newContents.map(s =>
              s.formula === substance.formula ? { ...s, phase: "l" } : s
            );
          }
        }

        // Remove steam effect if not boiling anymore
        if (!item.contents.some(s => {
          const bp = BOILING_POINTS[s.formula];
          return bp !== undefined && newTemp >= bp + pressureBPAdjust;
        })) {
          newEffects = newEffects.filter(e => e !== "steam");
        }

        if (newTemp !== currentTemp || newContents !== item.contents) {
          changed = true;
          return { ...item, temperature: newTemp, contents: newContents, activeEffects: newEffects };
        }
        return item;
      });

      if (changed) {
        useLabStore.setState({ benchItems: updatedItems });
      }
    }, TICK_INTERVAL);

    return () => clearInterval(interval);
  }, []);
}
