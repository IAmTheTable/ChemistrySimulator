import { useQuery } from "@tanstack/react-query";
import type { MoleculeData, OrbitalData } from "../types/structure";

// CPK colors for fallback rendering
const ELEMENT_COLORS: Record<string, string> = {
  H: "#FFFFFF", C: "#909090", N: "#3050F8", O: "#FF0000", F: "#90E050",
  Cl: "#1FF01F", Br: "#A62929", I: "#940094", S: "#FFFF30", P: "#FF8000",
  Na: "#AB5CF2", K: "#8F40D4", Ca: "#3DFF00", Mg: "#8AFF00", Fe: "#E06633",
  Cu: "#C88033", Zn: "#7D80B0", Ag: "#C0C0C0", Au: "#FFD123", Al: "#BFA6A6",
  Li: "#CC80FF", Ba: "#00C900", Mn: "#9C7AC7", Cr: "#8A99C7", Ni: "#50D050",
  Sn: "#668080", Pb: "#575961", Si: "#F0C8A0", B: "#FFB5B5", Ti: "#BFC2C7",
};

function makeFallbackMolecule(formula: string): MoleculeData {
  // Strip digits to get the element symbol(s)
  const match = formula.match(/^([A-Z][a-z]?)/);
  const symbol = match ? match[1] : formula;
  return {
    formula,
    name: formula,
    atoms: [{ index: 0, symbol, x: 0, y: 0, z: 0, color: ELEMENT_COLORS[symbol] ?? "#cccccc", radius: 1.0 }],
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
