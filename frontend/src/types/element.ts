export interface Isotope {
  mass_number: number;
  atomic_mass: number;
  abundance: number | null;
  stable: boolean;
}

export interface Element {
  atomic_number: number;
  symbol: string;
  name: string;
  atomic_mass: number;
  category: string;
  phase_at_stp: string;
  electron_configuration: string;
  electron_configuration_semantic: string;
  electronegativity_pauling: number | null;
  first_ionization_energy: number | null;
  atomic_radius: number | null;
  covalent_radius: number | null;
  van_der_waals_radius: number | null;
  melting_point: number | null;
  boiling_point: number | null;
  density: number | null;
  oxidation_states: number[];
  group: number | null;
  period: number;
  block: string;
  crystal_structure: string | null;
  magnetic_ordering: string | null;
  cpk_hex_color: string | null;
  isotopes: Isotope[];
  shells: number[];
  summary: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  "nonmetal": "#22c55e",
  "noble gas": "#a78bfa",
  "alkali metal": "#ef4444",
  "alkaline earth metal": "#f59e0b",
  "metalloid": "#06b6d4",
  "halogen": "#34d399",
  "post-transition metal": "#60a5fa",
  "transition metal": "#f472b6",
  "lanthanide": "#fb923c",
  "actinide": "#e879f9",
  "unknown": "#64748b",
};
