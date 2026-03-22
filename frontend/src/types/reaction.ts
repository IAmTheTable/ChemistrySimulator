export interface ReactionEffects {
  color: { from: string; to: string; speed: string } | null;
  gas: { type: string; rate: string } | null;
  heat: string | null;
  precipitate: { color: string; speed: string } | null;
  special: string[];
  sounds: string[];
  safety: string[];
}

export interface ReactionResult {
  equation: string;
  reaction_type: string;
  source: "curated" | "predicted";
  reactants: { formula: string; amount: number; phase: string }[];
  products: { formula: string; amount: number; phase: string; color: string }[];
  limiting_reagent: string | null;
  yield_percent: number;
  delta_h: number | null;
  delta_s: number | null;
  delta_g: number | null;
  spontaneous: boolean;
  temp_change: number;
  effects: ReactionEffects;
  description: string;
  observations: string[];
  safety_notes: string[];
  balanced_with_states: string;
}

export interface ReactionEvent {
  event: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface ReactionLogEntry extends ReactionResult {
  id: string;
  timestamp: Date;
}
