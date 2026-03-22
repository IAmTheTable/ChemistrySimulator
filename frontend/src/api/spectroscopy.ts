import { useQuery } from "@tanstack/react-query";

export interface SpectrumPeak {
  position: number;
  label: string;
}

export interface SpectrumData {
  x: number[];
  y: number[];
  peaks: SpectrumPeak[];
  x_label: string;
  y_label: string;
  lambda_max?: number;
  molecular_ion?: number;
}

async function fetchSpectrum(type: string, formula: string): Promise<SpectrumData> {
  const response = await fetch(`/api/spectroscopy/${type}/${encodeURIComponent(formula)}`);
  if (!response.ok) throw new Error(`Failed to fetch ${type} spectrum`);
  return response.json();
}

export function useIRSpectrum(formula: string | null) {
  return useQuery({
    queryKey: ["spectrum", "ir", formula],
    queryFn: () => fetchSpectrum("ir", formula!),
    enabled: formula !== null,
    staleTime: Infinity,
  });
}

export function useUVVisSpectrum(formula: string | null) {
  return useQuery({
    queryKey: ["spectrum", "uv-vis", formula],
    queryFn: () => fetchSpectrum("uv-vis", formula!),
    enabled: formula !== null,
    staleTime: Infinity,
  });
}

export function useMassSpectrum(formula: string | null) {
  return useQuery({
    queryKey: ["spectrum", "mass-spec", formula],
    queryFn: () => fetchSpectrum("mass-spec", formula!),
    enabled: formula !== null,
    staleTime: Infinity,
  });
}
