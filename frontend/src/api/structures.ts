import { useQuery } from "@tanstack/react-query";
import type { MoleculeData, OrbitalData } from "../types/structure";

async function fetchCommonStructure(formula: string): Promise<MoleculeData> {
  const response = await fetch(`/api/structures/common/${encodeURIComponent(formula)}`);
  if (!response.ok) throw new Error(`No structure for ${formula}`);
  return response.json();
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
    queryFn: () => fetchCommonStructure(formula!),
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
