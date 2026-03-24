import { Html } from "@react-three/drei";
import type { ContainerSubstance } from "../../../stores/labStore";


interface ContentsLabelProps {
  contents: ContainerSubstance[];
  yOffset: number;
  temperature?: number;
}

export default function ContentsLabel({ contents, yOffset, temperature }: ContentsLabelProps) {
  if (!contents || contents.length === 0) return null;
  const showTemp = temperature !== undefined && (temperature > 30 || temperature < 20);
  const totalVol = contents.reduce((sum, s) => sum + s.amount_ml, 0);

  return (
    <Html position={[0, yOffset, 0]} center distanceFactor={12}>
      <div style={{ background: "rgba(0,0,0,0.5)", padding: "1px 4px", borderRadius: "3px", whiteSpace: "nowrap", pointerEvents: "none", userSelect: "none" }}>
        <span style={{ color: "#e2e8f0", fontSize: "6px" }}>
          {contents.map(s => s.formula).join(" + ")}
        </span>
        <span style={{ color: "#94a3b8", fontSize: "5px", marginLeft: "2px" }}>
          {totalVol.toFixed(0)}mL
        </span>
        {showTemp && (
          <span style={{
            color: temperature! > 60 ? "#f87171" : temperature! < 0 ? "#60a5fa" : "#9ca3af",
            fontSize: "5px",
            marginLeft: "3px"
          }}>
            {Math.round(temperature!)}°C
          </span>
        )}
      </div>
    </Html>
  );
}
