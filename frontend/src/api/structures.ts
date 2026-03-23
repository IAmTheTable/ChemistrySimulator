import { useQuery } from "@tanstack/react-query";
import type { MoleculeData, OrbitalData } from "../types/structure";

// Fallback: single-atom rendering when backend can't generate 3D structure.
// Color picked from the element's category — matches backend CPK_COLORS.
function makeFallbackMolecule(formula: string): MoleculeData {
  const match = formula.match(/^([A-Z][a-z]?)/);
  const symbol = match ? match[1] : formula;
  return {
    formula,
    name: formula,
    atoms: [{ index: 0, symbol, x: 0, y: 0, z: 0, color: "#aaaaff", radius: 1.0 }],
    bonds: [],
    properties: {},
  };
}

async function fetchStructure(formula: string): Promise<MoleculeData> {
  // Try precomputed cache first
  const commonResponse = await fetch(`/api/structures/common/${encodeURIComponent(formula)}`);
  if (commonResponse.ok) return commonResponse.json();

  // Fall back to RDKit generation via formula
  const genResponse = await fetch("/api/structures/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: formula, input_type: "formula" }),
  });
  if (genResponse.ok) return genResponse.json();

  // Last resort: render as single atom
  return makeFallbackMolecule(formula);
}

async function fetchOrbitals(atomicNumber: number): Promise<OrbitalData> {
  const response = await fetch(`/api/structures/orbitals/${atomicNumber}`);
  if (!response.ok) throw new Error("Failed to fetch orbitals");
  return response.json();
}

export async function generateStructure(input: string, inputType: string = "smiles"): Promise<MoleculeData> {
  const response = await fetch("/api/structures/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, input_type: inputType }),
  });
  if (!response.ok) throw new Error("Failed to generate structure");
  return response.json();
}

export function useCommonStructure(formula: string | null) {
  return useQuery({
    queryKey: ["structure", formula],
    queryFn: () => fetchStructure(formula!),
    enabled: formula !== null,
    staleTime: Infinity,
    retry: false,
  });
}

export function useOrbitals(atomicNumber: number | null) {
  return useQuery({
    queryKey: ["orbitals", atomicNumber],
    queryFn: () => fetchOrbitals(atomicNumber!),
    enabled: atomicNumber !== null,
    staleTime: Infinity,
  });
}
