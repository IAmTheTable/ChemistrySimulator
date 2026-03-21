import { useQuery } from "@tanstack/react-query";
import type { MoleculeData, OrbitalData } from "../types/structure";

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

  throw new Error(`No structure available for ${formula}`);
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
