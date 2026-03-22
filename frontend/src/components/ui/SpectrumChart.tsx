import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import type { SpectrumData } from "../../api/spectroscopy";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
);

interface SpectrumChartProps {
  data: SpectrumData;
  type: "ir" | "uv-vis" | "mass-spec";
}

export default function SpectrumChart({ data, type }: SpectrumChartProps) {
  const isMassSpec = type === "mass-spec";
  const isIR = type === "ir";

  // Downsample line data for performance (keep every Nth point)
  const downsampled = useMemo(() => {
    if (isMassSpec) return { x: data.x, y: data.y };
    const step = Math.max(1, Math.floor(data.x.length / 500));
    const x: number[] = [];
    const y: number[] = [];
    for (let i = 0; i < data.x.length; i += step) {
      x.push(data.x[i]);
      y.push(data.y[i]);
    }
    return { x, y };
  }, [data, isMassSpec]);

  const lineColor =
    type === "ir"
      ? "rgba(59, 130, 246, 0.9)"
      : type === "uv-vis"
        ? "rgba(168, 85, 247, 0.9)"
        : "rgba(16, 185, 129, 0.9)";

  const fillColor =
    type === "ir"
      ? "rgba(59, 130, 246, 0.1)"
      : type === "uv-vis"
        ? "rgba(168, 85, 247, 0.15)"
        : "rgba(16, 185, 129, 0.3)";

  const chartData = useMemo(() => {
    if (isMassSpec) {
      // Filter to only show m/z values with nonzero intensity for cleaner bars
      const filtered = downsampled.x
        .map((x, i) => ({ x, y: downsampled.y[i] }))
        .filter((pt) => pt.y > 0.5);

      return {
        labels: filtered.map((pt) => String(pt.x)),
        datasets: [
          {
            label: data.y_label,
            data: filtered.map((pt) => pt.y),
            backgroundColor: fillColor,
            borderColor: lineColor,
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: downsampled.x.map(String),
      datasets: [
        {
          label: data.y_label,
          data: downsampled.y,
          borderColor: lineColor,
          backgroundColor: fillColor,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: true,
          tension: 0.2,
        },
      ],
    };
  }, [downsampled, data.y_label, lineColor, fillColor, isMassSpec]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 } as const,
      plugins: {
        title: { display: false },
        tooltip: {
          backgroundColor: "rgba(17, 24, 39, 0.95)",
          titleColor: "#e5e7eb",
          bodyColor: "#d1d5db",
          borderColor: "#374151",
          borderWidth: 1,
          callbacks: {
            title: (items: { label?: string }[]) => {
              const label = items[0]?.label ?? "";
              return `${data.x_label}: ${label}`;
            },
          },
        },
        legend: { display: false },
      },
      scales: {
        x: {
          reverse: isIR,
          title: {
            display: true,
            text: data.x_label,
            color: "#9ca3af",
            font: { size: 10 },
          },
          ticks: {
            color: "#6b7280",
            font: { size: 9 },
            maxTicksLimit: 10,
            autoSkip: true,
          },
          grid: { color: "rgba(55, 65, 81, 0.3)" },
        },
        y: {
          title: {
            display: true,
            text: data.y_label,
            color: "#9ca3af",
            font: { size: 10 },
          },
          ticks: {
            color: "#6b7280",
            font: { size: 9 },
            maxTicksLimit: 6,
          },
          grid: { color: "rgba(55, 65, 81, 0.3)" },
          beginAtZero: true,
        },
      },
    }),
    [data.x_label, data.y_label, isIR],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="h-[200px] bg-gray-950 rounded p-2">
        {isMassSpec ? (
          <Bar data={chartData} options={options} />
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>

      {/* Peak annotations */}
      {data.peaks.length > 0 && (
        <div className="text-[10px] text-gray-500 space-y-0.5 max-h-[100px] overflow-y-auto">
          <div className="text-gray-400 font-medium mb-0.5">Peaks:</div>
          {data.peaks.map((peak, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span className="text-gray-400">{peak.position}</span>
              <span className="text-gray-500 truncate">{peak.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Extra info */}
      {data.lambda_max != null && (
        <div className="text-[10px] text-purple-400">
          Lambda max: {data.lambda_max} nm
        </div>
      )}
      {data.molecular_ion != null && (
        <div className="text-[10px] text-emerald-400">
          Molecular ion (M+): {data.molecular_ion} m/z
        </div>
      )}
    </div>
  );
}
