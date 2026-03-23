import { useMemo } from "react";
import * as THREE from "three";
import type { AtomData } from "../../types/structure";

interface BondCylinderProps {
  atom1: AtomData;
  atom2: AtomData;
  order: number;
  mode: string;
}

const Z_AXIS = new THREE.Vector3(0, 0, 1);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

function computeQuaternion(dir: THREE.Vector3): THREE.Quaternion {
  const q = new THREE.Quaternion();
  q.setFromUnitVectors(Y_AXIS, dir.clone().normalize());
  return q;
}

/**
 * Returns a vector perpendicular to `dir`. Avoids parallel-to-Y degenerate case.
 */
function getPerpendicular(dir: THREE.Vector3): THREE.Vector3 {
  const normalized = dir.clone().normalize();
  // If dir is nearly parallel to Z, cross with Y instead
  if (Math.abs(normalized.z) < 0.9) {
    return normalized.clone().cross(Z_AXIS).normalize();
  }
  return normalized.clone().cross(Y_AXIS).normalize();
}

interface StickProps {
  mid: THREE.Vector3;
  quaternion: THREE.Quaternion;
  length: number;
  radius: number;
  color: string;
  offset?: THREE.Vector3;
}

function Stick({ mid, quaternion, length, radius, color, offset }: StickProps) {
  const pos: [number, number, number] = offset
    ? [mid.x + offset.x, mid.y + offset.y, mid.z + offset.z]
    : [mid.x, mid.y, mid.z];

  return (
    <mesh position={pos} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} />
    </mesh>
  );
}

export default function BondCylinder({ atom1, atom2, order, mode }: BondCylinderProps) {
  const { mid, dir, quaternion, length } = useMemo(() => {
    const m = new THREE.Vector3(
      (atom1.x + atom2.x) / 2,
      (atom1.y + atom2.y) / 2,
      (atom1.z + atom2.z) / 2,
    );
    const d = new THREE.Vector3(
      atom2.x - atom1.x,
      atom2.y - atom1.y,
      atom2.z - atom1.z,
    );
    const l = d.length();
    const q = computeQuaternion(d);
    return { mid: m, dir: d, quaternion: q, length: l };
  }, [atom1.x, atom1.y, atom1.z, atom2.x, atom2.y, atom2.z]);

  const bondColor = mode === "ball-and-stick" ? "#666666" : "#555555";
  let baseRadius: number;
  if (mode === "wireframe") {
    baseRadius = 0.01;
  } else {
    // Ball-and-stick: prominent bonds
    baseRadius = order === 1 ? 0.06 : order === 2 ? 0.04 : 0.03;
  }

  if (order === 1 || mode === "wireframe") {
    return (
      <Stick
        mid={mid}
        quaternion={quaternion}
        length={length}
        radius={baseRadius}
        color={bondColor}
      />
    );
  }

  if (order === 2) {
    const perp = getPerpendicular(dir).multiplyScalar(0.06);
    return (
      <group>
        <Stick mid={mid} quaternion={quaternion} length={length} radius={baseRadius} color={bondColor} offset={perp} />
        <Stick mid={mid} quaternion={quaternion} length={length} radius={baseRadius} color={bondColor} offset={perp.clone().negate()} />
      </group>
    );
  }

  // Triple bond
  const perp = getPerpendicular(dir).multiplyScalar(0.065);
  const perp2 = perp.clone().negate();
  return (
    <group>
      {/* Center stick */}
      <Stick mid={mid} quaternion={quaternion} length={length} radius={baseRadius} color={bondColor} />
      {/* Two side sticks */}
      <Stick mid={mid} quaternion={quaternion} length={length} radius={baseRadius} color={bondColor} offset={perp} />
      <Stick mid={mid} quaternion={quaternion} length={length} radius={baseRadius} color={bondColor} offset={perp2} />
    </group>
  );
}
