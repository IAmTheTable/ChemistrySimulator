export interface Substance {
  formula: string;
  name: string;
  phase: "s" | "l" | "g" | "aq";
  color: string;
  amount_ml: number | null;
  concentration: number | null;
  molar_mass: number | null;
  hazard_class: string | null;
}
