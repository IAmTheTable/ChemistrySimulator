import { useState } from "react";
import { Html } from "@react-three/drei";

interface InteractiveToolProps {
  children: React.ReactNode;
  name: string;
  description: string;
  onClick: (e: any) => void;
  position?: [number, number, number];
  labelOffset?: [number, number, number];
}

export default function InteractiveTool({
  children,
  name,
  description,
  onClick,
  position,
  labelOffset = [0, 0.3, 0],
}: InteractiveToolProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group
      position={position}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      {children}

      {/* Hover highlight — glowing ring under the tool */}
      {hovered && (
        <>
          <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.12, 24]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.6} />
          </mesh>
          <pointLight position={[0, 0.2, 0]} color="#22d3ee" intensity={0.3} distance={0.5} />
        </>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html position={labelOffset} center>
          <div
            style={{
              background: "rgba(0,0,0,0.85)",
              border: "1px solid #22d3ee",
              color: "#e2e8f0",
              fontSize: "9px",
              padding: "4px 8px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              maxWidth: "180px",
            }}
          >
            <div style={{ fontWeight: "bold", color: "#22d3ee", marginBottom: "2px" }}>{name}</div>
            <div style={{ color: "#94a3b8", fontSize: "8px" }}>{description}</div>
          </div>
        </Html>
      )}
    </group>
  );
}
