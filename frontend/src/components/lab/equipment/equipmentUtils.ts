import * as THREE from "three";
import type { ContainerSubstance } from "../../../stores/labStore";

export function blendColors(colors: string[]): string {
  if (colors.length === 0) return "#cccccc";
  if (colors.length === 1) return colors[0];
  let r = 0, g = 0, b = 0;
  for (const hex of colors) {
    const c = new THREE.Color(hex);
    r += c.r; g += c.g; b += c.b;
  }
  return "#" + new THREE.Color(r / colors.length, g / colors.length, b / colors.length).getHexString();
}

export function computeFillState(contents: ContainerSubstance[], capacityMl: number): { fillLevel: number; fillColor: string } {
  if (!contents || contents.length === 0) return { fillLevel: 0, fillColor: "#cccccc" };
  const totalMl = contents.reduce((sum, s) => sum + s.amount_ml, 0);
  return {
    fillLevel: Math.min(1, totalMl / capacityMl),
    fillColor: blendColors(contents.map((s) => s.color)),
  };
}

// Pre-allocated Color objects for temperature tiers — avoids GC pressure
const TEMP_TIERS = {
  extreme:  { glassColor: "#ff4400", glassEmissive: new THREE.Color("#ff2200"), glassEmissiveIntensity: 0.6 },
  veryHot:  { glassColor: "#ff8c00", glassEmissive: new THREE.Color("#ff6600"), glassEmissiveIntensity: 0.4 },
  hot:      { glassColor: "#ffe0b2", glassEmissive: new THREE.Color("#ff6600"), glassEmissiveIntensity: 0.2 },
  warm:     { glassColor: "#ffe0b2", glassEmissive: new THREE.Color("#ff6600"), glassEmissiveIntensity: 0.1 },
  veryCold: { glassColor: "#b3e5fc", glassEmissive: new THREE.Color("#2196f3"), glassEmissiveIntensity: 0.15 },
  cold:     { glassColor: "#e1f5fe", glassEmissive: new THREE.Color("#0288d1"), glassEmissiveIntensity: 0.05 },
  normal:   { glassColor: "", glassEmissive: new THREE.Color("#000000"), glassEmissiveIntensity: 0 },
} as const;

export function getGlassAppearance(temperature: number, coldColor: string) {
  if (temperature > 500) return TEMP_TIERS.extreme;
  if (temperature > 200) return TEMP_TIERS.veryHot;
  if (temperature > 100) return TEMP_TIERS.hot;
  if (temperature > 60) return TEMP_TIERS.warm;
  if (temperature < -50) return TEMP_TIERS.veryCold;
  if (temperature < 0) return TEMP_TIERS.cold;
  return { ...TEMP_TIERS.normal, glassColor: coldColor };
}

export const EQUIPMENT_Y_OFFSETS: Record<string, number> = {
  beaker: 0.20,
  erlenmeyer: 0.14,
  "test-tube": 0.20,
  "round-bottom": 0.16,
  "watch-glass": 0.08,
  "graduated-cylinder": 0.25,
};
