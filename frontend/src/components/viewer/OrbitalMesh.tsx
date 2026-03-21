import * as THREE from "three";
import type { OrbitalInfo } from "../../types/structure";

interface OrbitalMeshProps {
  orbital: OrbitalInfo;
  position: [number, number, number];
}

const ORBITAL_BLUE = "#3b82f6";
const ORBITAL_RED = "#ef4444";

const MATERIAL_PROPS = {
  transparent: true,
  opacity: 0.35,
  depthWrite: false,
  side: THREE.DoubleSide,
} as const;

/** s orbital: a small translucent sphere (nucleus region) */
function SOrbital({ radius, position }: { radius: number; position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[radius * 0.18, 32, 32]} />
      <meshStandardMaterial color={ORBITAL_BLUE} {...MATERIAL_PROPS} opacity={0.5} />
    </mesh>
  );
}

/** One lobe of a p orbital — elongated along its axis */
function PLobe({
  pos,
  radius,
  color,
  axis,
}: {
  pos: [number, number, number];
  radius: number;
  color: string;
  axis: string;
}) {
  // Stretch the sphere along the lobe axis to make it teardrop-shaped
  const scale: [number, number, number] =
    axis === "x" ? [2.2, 0.7, 0.7] : axis === "y" ? [0.7, 2.2, 0.7] : [0.7, 0.7, 2.2];

  return (
    <mesh position={pos} scale={scale}>
      <sphereGeometry args={[radius, 16, 16]} />
      <meshStandardMaterial color={color} {...MATERIAL_PROPS} />
    </mesh>
  );
}

/** p orbital: dumbbell — two elongated lobes along EACH occupied axis */
function POrbital({
  orbital,
  position,
}: {
  orbital: OrbitalInfo;
  position: [number, number, number];
}) {
  const lobeRadius = orbital.radius * 0.3;
  const offset = orbital.radius * 0.5;
  const orientations = orbital.orientations.length > 0 ? orbital.orientations : ["z"];

  const axisOffset = (axis: string): [number, number, number] =>
    axis === "x" ? [offset, 0, 0] : axis === "y" ? [0, offset, 0] : [0, 0, offset];

  return (
    <group position={position}>
      {orientations.map((axis) => {
        const off = axisOffset(axis);
        return (
          <group key={axis}>
            <PLobe pos={off} radius={lobeRadius} color={ORBITAL_BLUE} axis={axis} />
            <PLobe pos={[-off[0], -off[1], -off[2]]} radius={lobeRadius} color={ORBITAL_RED} axis={axis} />
          </group>
        );
      })}
    </group>
  );
}

/** d orbital: 4 lobes in a plane (cloverleaf approximation) */
function DOrbital({
  orbital,
  position,
}: {
  orbital: OrbitalInfo;
  position: [number, number, number];
}) {
  const lobeRadius = orbital.radius * 0.3;
  const offset = orbital.radius * 0.45;
  const orientation = orbital.orientations[0] ?? "xy";

  // Build 4 lobe positions based on plane
  let lobeOffsets: [number, number, number][];
  if (orientation === "xz") {
    lobeOffsets = [
      [offset, 0, offset],
      [-offset, 0, offset],
      [offset, 0, -offset],
      [-offset, 0, -offset],
    ];
  } else if (orientation === "yz") {
    lobeOffsets = [
      [0, offset, offset],
      [0, -offset, offset],
      [0, offset, -offset],
      [0, -offset, -offset],
    ];
  } else {
    // xy plane (default)
    lobeOffsets = [
      [offset, offset, 0],
      [-offset, offset, 0],
      [offset, -offset, 0],
      [-offset, -offset, 0],
    ];
  }

  const colors = [ORBITAL_BLUE, ORBITAL_RED, ORBITAL_RED, ORBITAL_BLUE];

  return (
    <group position={position}>
      {lobeOffsets.map((off, i) => (
        <mesh key={i} position={off}>
          <sphereGeometry args={[lobeRadius, 12, 12]} />
          <meshStandardMaterial color={colors[i]} {...MATERIAL_PROPS} />
        </mesh>
      ))}
    </group>
  );
}

/** f orbital: 6 lobes approximation (alternating colors) */
function FOrbital({
  orbital,
  position,
}: {
  orbital: OrbitalInfo;
  position: [number, number, number];
}) {
  const lobeRadius = orbital.radius * 0.25;
  const offset = orbital.radius * 0.45;

  const lobeOffsets: [number, number, number][] = [
    [offset, 0, 0],
    [-offset, 0, 0],
    [0, offset, 0],
    [0, -offset, 0],
    [0, 0, offset],
    [0, 0, -offset],
  ];

  return (
    <group position={position}>
      {lobeOffsets.map((off, i) => (
        <mesh key={i} position={off}>
          <sphereGeometry args={[lobeRadius, 12, 12]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? ORBITAL_BLUE : ORBITAL_RED}
            {...MATERIAL_PROPS}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function OrbitalMesh({ orbital, position }: OrbitalMeshProps) {
  switch (orbital.shape) {
    case "sphere":
      return <SOrbital radius={orbital.radius} position={position} />;
    case "dumbbell":
      return <POrbital orbital={orbital} position={position} />;
    case "cloverleaf":
      return <DOrbital orbital={orbital} position={position} />;
    case "complex":
      return <FOrbital orbital={orbital} position={position} />;
    default:
      return <SOrbital radius={orbital.radius} position={position} />;
  }
}
