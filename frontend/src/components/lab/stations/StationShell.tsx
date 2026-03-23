import React from "react";

export const LABEL_STYLE: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "6px",
  whiteSpace: "nowrap",
  background: "rgba(0,0,0,0.4)",
  padding: "0px 3px",
  borderRadius: "2px",
  pointerEvents: "none",
};

export default function StationShell({
  children,
  wallColor = "#3f3f46",
  showShelf = true,
}: {
  children: React.ReactNode;
  wallColor?: string;
  showShelf?: boolean;
}) {
  return (
    <group>
      <mesh position={[0, 0.6, -1.25]} castShadow>
        <boxGeometry args={[4, 1.1, 0.05]} />
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {showShelf && (
        <mesh position={[0, 0.35, -1.1]} castShadow>
          <boxGeometry args={[3.8, 0.04, 0.3]} />
          <meshStandardMaterial color="#44403c" roughness={0.8} />
        </mesh>
      )}
      {children}
    </group>
  );
}
