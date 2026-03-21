import { useQuery } from "@tanstack/react-query";

async function fetchChemicalName(formula: string): Promise<string> {
  const response = await fetch(
    `/api/nomenclature/name?formula=${encodeURIComponent(formula)}`
  );
  if (!response.ok) return formula;
  const data = await response.json();
  return data.name;
}

export function useChemicalName(formula: string | null) {
  return useQuery({
    queryKey: ["nomenclature", formula],
    queryFn: () => fetchChemicalName(formula!),
    enabled: formula !== null,
    staleTime: Infinity,
  });
}
