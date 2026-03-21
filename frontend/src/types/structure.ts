export interface AtomData {
  index: number;
  symbol: string;
  x: number;
  y: number;
  z: number;
  color: string;
  radius: number;
}

export interface BondData {
  atom1: number;
  atom2: number;
  order: number;
}

export interface MoleculeData {
  formula: string;
  name: string;
  atoms: AtomData[];
  bonds: BondData[];
  properties: Record<string, unknown>;
}

export interface OrbitalInfo {
  n: number;
  l: number;
  label: string;
  electrons: number;
  shape: string;
  radius: number;
  orientations: string[];
}

export interface OrbitalData {
  element: string;
  atomic_number: number;
  electron_configuration: string;
  orbitals: OrbitalInfo[];
}
