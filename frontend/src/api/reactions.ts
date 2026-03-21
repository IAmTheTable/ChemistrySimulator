import type { ReactionResult, ReactionEvent } from "../types/reaction";

export async function runReaction(
  reactants: { formula: string; amount_g?: number; amount_ml?: number; phase: string }[],
  conditions: { temperature: number; pressure: number; catalyst: string | null } = { temperature: 25, pressure: 1, catalyst: null },
): Promise<ReactionResult> {
  const response = await fetch("/api/reactions/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reactants, conditions }),
  });
  if (!response.ok) throw new Error("Failed to run reaction");
  return response.json();
}

export function streamReaction(
  reactants: { formula: string; amount_g?: number; amount_ml?: number; phase: string }[],
  conditions: { temperature: number; pressure: number; catalyst: string | null },
  onEvent: (event: ReactionEvent) => void,
): () => void {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${window.location.host}/api/reactions/stream`);
  ws.onopen = () => ws.send(JSON.stringify({ reactants, conditions }));
  ws.onmessage = (e) => onEvent(JSON.parse(e.data));
  return () => ws.close();
}
