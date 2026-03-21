import { useQuery } from "@tanstack/react-query";
import type { Substance } from "../types/substance";

async function fetchCommonSubstances(): Promise<Substance[]> {
  const response = await fetch("/api/substances/common");
  if (!response.ok) throw new Error("Failed to fetch common substances");
  return response.json();
}

export function useCommonSubstances() {
  return useQuery({
    queryKey: ["substances", "common"],
    queryFn: fetchCommonSubstances,
    staleTime: Infinity,
  });
}
