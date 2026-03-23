import { Html } from "@react-three/drei";
import type { ContainerSubstance } from "../../../stores/labStore";

interface ContentsLabelProps {
  contents: ContainerSubstance[];
  yOffset: number;
}

export default function ContentsLabel({ contents, yOffset }: ContentsLabelProps) {
  if (!contents || contents.length === 0) return null;
  return (
    <Html position={[0, yOffset, 0]} center distanceFactor={8}>
      <div style={{ background: "rgba(0,0,0,0.7)", padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap", pointerEvents: "none" }}>
        <span style={{ color: "#e2e8f0", fontSize: "7px" }}>
          {contents.map(s => s.formula).join(" + ")}
        </span>
      </div>
    </Html>
  );
}
