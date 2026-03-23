import { Html } from "@react-three/drei";
import type { ContainerSubstance } from "../../../stores/labStore";

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
};

function computeMassG(contents: ContainerSubstance[]): number {
  return contents.reduce((total, s) => {
    const density = DENSITIES[s.formula] ?? 1.0;
    return total + s.amount_ml * density;
  }, 0);
}

function formatMass(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
  if (g >= 1) return `${g.toFixed(1)} g`;
  return `${(g * 1000).toFixed(0)} mg`;
}

interface ContentsLabelProps {
  contents: ContainerSubstance[];
  yOffset: number;
  temperature?: number;
}

export default function ContentsLabel({ contents, yOffset, temperature }: ContentsLabelProps) {
  if (!contents || contents.length === 0) return null;
  const showTemp = temperature !== undefined && (temperature > 30 || temperature < 20);
  const totalMass = computeMassG(contents);
  const totalVol = contents.reduce((sum, s) => sum + s.amount_ml, 0);

  return (
    <Html position={[0, yOffset, 0]} center distanceFactor={8}>
      <div style={{ background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap", pointerEvents: "none" }}>
        <span style={{ color: "#e2e8f0", fontSize: "7px" }}>
          {contents.map(s => s.formula).join(" + ")}
        </span>
        <span style={{ color: "#94a3b8", fontSize: "5.5px", marginLeft: "3px" }}>
          {totalVol.toFixed(1)}mL {formatMass(totalMass)}
        </span>
        {showTemp && (
          <span style={{
            color: temperature! > 60 ? "#f87171" : temperature! < 0 ? "#60a5fa" : "#9ca3af",
            fontSize: "6px",
            marginLeft: "4px"
          }}>
            {Math.round(temperature!)}°C
          </span>
        )}
      </div>
    </Html>
  );
}
