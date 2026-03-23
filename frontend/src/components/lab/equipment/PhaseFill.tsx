import type { ContainerSubstance } from "../../../stores/labStore";
import { computePhaseRendering, isMetallic } from "./equipmentUtils";

interface PhaseFillProps {
  contents: ContainerSubstance[];
  capacityMl: number;
  /** Total interior height of the container (world units) */
  height: number;
  /** Inner radius at the bottom */
  radiusBottom: number;
  /** Inner radius at the top (for tapered vessels; same as radiusBottom for cylinders) */
  radiusTop?: number;
  radialSegments?: number;
}

/**
 * Renders solid / liquid / gas layers inside a container based on phase.
 *
 * Solid  — opaque, rough, sits at bottom; metallic appearance for metal elements.
 * Liquid — semi-transparent, sits on top of any solid.
 * Gas    — very transparent cloud in headspace.
 *
 * Drop this inside any equipment group in place of the old single-fill mesh.
 */
export default function PhaseFill({
  contents,
  capacityMl,
  height,
  radiusBottom,
  radiusTop,
  radialSegments = 24,
}: PhaseFillProps) {
  const phases = computePhaseRendering(contents, capacityMl);
  const innerR = radiusBottom;
  const innerRTop = radiusTop ?? radiusBottom;

  const availableHeight = height - 0.02;
  const solidHeight  = phases.solidLevel  * availableHeight;
  const liquidHeight = phases.liquidLevel * availableHeight;

  // Y positions: bottom of container is -height/2, add 0.01 floor offset
  const floorY   = -height / 2 + 0.01;
  const solidY   = floorY + solidHeight / 2;
  const liquidY  = floorY + solidHeight + liquidHeight / 2;

  // For tapered vessels, interpolate the top-fill radius by fill level
  const liquidTopFraction = phases.solidLevel + phases.liquidLevel;
  const liquidR = innerR + (innerRTop - innerR) * Math.min(1, liquidTopFraction);
  const solidR  = innerR * 0.97; // slightly inset so it doesn't clip walls

  const metallic = isMetallic(phases.solidFormula);

  return (
    <>
      {/* Solid layer */}
      {phases.hasSolid && solidHeight > 0.0005 && (
        <mesh position={[0, solidY, 0]}>
          <cylinderGeometry args={[solidR, solidR, solidHeight, radialSegments]} />
          <meshStandardMaterial
            color={phases.solidColor}
            roughness={metallic ? 0.3 : 0.85}
            metalness={metallic ? 0.8 : 0.0}
            opacity={metallic ? 0.98 : 0.95}
            transparent={!metallic}
          />
        </mesh>
      )}

      {/* Liquid layer */}
      {phases.hasLiquid && liquidHeight > 0.0005 && (
        <mesh position={[0, liquidY, 0]}>
          <cylinderGeometry args={[liquidR, innerR, liquidHeight, radialSegments]} />
          <meshStandardMaterial
            color={phases.liquidColor}
            transparent
            opacity={0.7}
            roughness={0.1}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Gas cloud — floats in headspace */}
      {phases.hasGas && (
        <mesh position={[0, height * 0.25, 0]}>
          <sphereGeometry args={[innerR * 0.7, 10, 10]} />
          <meshStandardMaterial
            color={phases.gasColor}
            transparent
            opacity={0.12}
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  );
}
