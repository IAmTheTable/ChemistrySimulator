import { useQuery } from "@tanstack/react-query";
import type { Element } from "../types/element";

async function fetchElements(): Promise<Element[]> {
  const response = await fetch("/api/elements");
  if (!response.ok) throw new Error("Failed to fetch elements");
  return response.json();
}

async function fetchElement(atomicNumber: number): Promise<Element> {
  const response = await fetch(`/api/elements/${atomicNumber}`);
  if (!response.ok) throw new Error(`Failed to fetch element ${atomicNumber}`);
  return response.json();
}

export function useElements() {
  return useQuery({
    queryKey: ["elements"],
    queryFn: fetchElements,
    staleTime: Infinity,
  });
}

export function useElement(atomicNumber: number | null) {
  return useQuery({
    queryKey: ["elements", atomicNumber],
    queryFn: () => fetchElement(atomicNumber!),
    enabled: atomicNumber !== null,
    staleTime: Infinity,
  });
}
