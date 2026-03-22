import { useQuery } from "@tanstack/react-query";

export interface ChargeAtom {
  index: number;
  symbol: string;
  x: number;
  y: number;
  z: number;
  partial_charge: number;
}

export interface ChargesResult {
  formula: string;
  atoms: ChargeAtom[];
  total_charge: number;
  num_atoms: number;
}

export interface BondLengthInfo {
  atom1_index: number;
  atom2_index: number;
  atom1_symbol: string;
  atom2_symbol: string;
  length_angstrom: number;
}

export interface BondAngleInfo {
  atom1_index: number;
  center_index: number;
  atom2_index: number;
  atoms: string;
  angle_degrees: number;
}

export interface GeometryResult {
  bond_lengths: BondLengthInfo[];
  bond_angles: BondAngleInfo[];
  dihedral_angles: { atom_indices: number[]; dihedral_degrees: number }[];
  geometry: string;
  energy: number;
}

export interface EnergyResult {
  formula: string;
  energy: number;
  unit: string;
  method: string;
}

async function fetchCharges(formula: string): Promise<ChargesResult> {
  const response = await fetch(`/api/quantum/charges/${encodeURIComponent(formula)}`);
  if (!response.ok) throw new Error("Failed to fetch charges");
  return response.json();
}

async function fetchGeometry(smiles: string): Promise<GeometryResult> {
  const response = await fetch("/api/quantum/optimize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ smiles }),
  });
  if (!response.ok) throw new Error("Failed to optimize geometry");
  return response.json();
}

async function fetchGeometryByFormula(formula: string): Promise<GeometryResult> {
  const response = await fetch(`/api/quantum/geometry/${encodeURIComponent(formula)}`);
  if (!response.ok) throw new Error("Failed to fetch geometry");
  return response.json();
}

async function fetchEnergy(formula: string): Promise<EnergyResult> {
  const response = await fetch(`/api/quantum/energy/${encodeURIComponent(formula)}`);
  if (!response.ok) throw new Error("Failed to fetch energy");
  return response.json();
}

export function useCharges(formula: string | null) {
  return useQuery({
    queryKey: ["charges", formula],
    queryFn: () => fetchCharges(formula!),
    enabled: formula !== null,
    staleTime: Infinity,
  });
}

export function useGeometry(smiles: string | null) {
  return useQuery({
    queryKey: ["geometry", smiles],
    queryFn: () => fetchGeometry(smiles!),
    enabled: smiles !== null,
    staleTime: Infinity,
  });
}

export function useGeometryByFormula(formula: string | null) {
  return useQuery({
    queryKey: ["geometryByFormula", formula],
    queryFn: () => fetchGeometryByFormula(formula!),
    enabled: formula !== null,
    staleTime: Infinity,
  });
}

export function useEnergy(formula: string | null) {
  return useQuery({
    queryKey: ["energy", formula],
    queryFn: () => fetchEnergy(formula!),
    enabled: formula !== null,
    staleTime: Infinity,
  });
}
