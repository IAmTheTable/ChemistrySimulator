import * as THREE from "three";
import type { ContainerSubstance } from "../../../stores/labStore";

const HOT_EMISSIVE = new THREE.Color("#ff6600");
const COLD_EMISSIVE = new THREE.Color("#000000");

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

export function getGlassAppearance(temperature: number, coldColor: string) {
  const isHot = temperature > 60;
  return {
    glassColor: isHot ? "#ffe0b2" : coldColor,
    glassEmissive: isHot ? HOT_EMISSIVE : COLD_EMISSIVE,
    glassEmissiveIntensity: isHot ? 0.15 : 0,
  };
}

export const EQUIPMENT_Y_OFFSETS: Record<string, number> = {
  beaker: 0.20,
  erlenmeyer: 0.14,
  "test-tube": 0.20,
};
