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

  return (
    <Html position={[0, yOffset, 0]} center distanceFactor={8}>
      <div style={{ background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap", pointerEvents: "none" }}>
        <span style={{ color: "#e2e8f0", fontSize: "7px" }}>
          {contents.map(s => s.formula).join(" + ")}
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
