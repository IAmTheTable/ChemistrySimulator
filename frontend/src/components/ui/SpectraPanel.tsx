import { useState } from "react";
import { useLabStore } from "../../stores/labStore";
import { useIRSpectrum, useUVVisSpectrum, useMassSpectrum } from "../../api/spectroscopy";
import SpectrumChart from "./SpectrumChart";

type SpectrumType = "ir" | "uv-vis" | "mass-spec";

const SPECTRUM_TYPES: { id: SpectrumType; label: string }[] = [
  { id: "ir", label: "IR" },
  { id: "uv-vis", label: "UV-Vis" },
  { id: "mass-spec", label: "Mass Spec" },
];

export default function SpectraPanel() {
  const formula = useLabStore((s) => s.structureViewer.formula);
  const [activeType, setActiveType] = useState<SpectrumType>("ir");

  const { data: irData, isLoading: irLoading } = useIRSpectrum(
    activeType === "ir" ? formula : null,
  );
  const { data: uvData, isLoading: uvLoading } = useUVVisSpectrum(
    activeType === "uv-vis" ? formula : null,
  );
  const { data: msData, isLoading: msLoading } = useMassSpectrum(
    activeType === "mass-spec" ? formula : null,
  );

  if (!formula) {
    return (
      <p className="text-xs text-gray-600">
        Select a substance to view its spectra. Use the Inspector or right-click
        a container to choose a substance.
      </p>
    );
  }

  const spectrumData =
    activeType === "ir" ? irData : activeType === "uv-vis" ? uvData : msData;
  const isLoading =
    activeType === "ir" ? irLoading : activeType === "uv-vis" ? uvLoading : msLoading;

  return (
    <div className="flex flex-col gap-3">
      {/* Formula header */}
      <div className="text-center">
        <div className="text-sm font-semibold text-white">{formula}</div>
        <div className="text-[10px] text-gray-500">Simulated Spectra</div>
      </div>

      {/* Spectrum type selector */}
      <div className="flex gap-1">
        {SPECTRUM_TYPES.map((st) => (
          <button
            key={st.id}
            onClick={() => setActiveType(st.id)}
            className={`flex-1 text-[10px] py-1.5 rounded transition-colors ${
              activeType === st.id
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      {isLoading && (
        <div className="flex items-center justify-center h-[200px] text-xs text-gray-500">
          Loading spectrum...
        </div>
      )}

      {spectrumData && !isLoading && (
        <SpectrumChart data={spectrumData} type={activeType} />
      )}
    </div>
  );
}
