import { useElements } from "../../api/elements";
import { useLabStore } from "../../stores/labStore";
import { CATEGORY_COLORS } from "../../types/element";

// Standard periodic table layout: [row, col] for each atomic number
const LAYOUT: Record<number, [number, number]> = {};

// Row 0
LAYOUT[1] = [0, 0]; LAYOUT[2] = [0, 17];
// Row 1
LAYOUT[3] = [1, 0]; LAYOUT[4] = [1, 1];
for (let i = 5; i <= 10; i++) LAYOUT[i] = [1, i + 7];
// Row 2
LAYOUT[11] = [2, 0]; LAYOUT[12] = [2, 1];
for (let i = 13; i <= 18; i++) LAYOUT[i] = [2, i - 1];
// Row 3
for (let i = 19; i <= 36; i++) LAYOUT[i] = [3, i - 19];
// Row 4
for (let i = 37; i <= 54; i++) LAYOUT[i] = [4, i - 37];
// Row 5
LAYOUT[55] = [5, 0]; LAYOUT[56] = [5, 1];
for (let i = 57; i <= 71; i++) LAYOUT[i] = [8, i - 57 + 2]; // Lanthanides
for (let i = 72; i <= 86; i++) LAYOUT[i] = [5, i - 72 + 3];
// Row 6
LAYOUT[87] = [6, 0]; LAYOUT[88] = [6, 1];
for (let i = 89; i <= 103; i++) LAYOUT[i] = [9, i - 89 + 2]; // Actinides
for (let i = 104; i <= 118; i++) LAYOUT[i] = [6, i - 104 + 3];

export default function PeriodicTable() {
  const { data: elements, isLoading, error } = useElements();
  const selectedElement = useLabStore((s) => s.selectedElement);
  const selectElement = useLabStore((s) => s.selectElement);

  if (isLoading) return <p className="text-xs text-gray-500">Loading elements...</p>;
  if (error) return <p className="text-xs text-red-500">Failed to load elements</p>;
  if (!elements) return null;

  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(18, 1fr)", gridTemplateRows: "repeat(10, 1fr)" }}>
      {elements.map((el) => {
        const pos = LAYOUT[el.atomic_number];
        if (!pos) return null;
        const [row, col] = pos;
        const color = CATEGORY_COLORS[el.category] || CATEGORY_COLORS.unknown;
        const isSelected = selectedElement === el.atomic_number;

        return (
          <button
            key={el.atomic_number}
            onClick={() => selectElement(isSelected ? null : el.atomic_number)}
            className="flex flex-col items-center justify-center p-0.5 rounded-sm transition-all hover:scale-110 hover:z-10 cursor-pointer border"
            style={{
              gridRow: row + 1,
              gridColumn: col + 1,
              backgroundColor: isSelected ? color : `${color}22`,
              borderColor: isSelected ? color : `${color}44`,
              color: isSelected ? "#000" : color,
            }}
            title={`${el.name} (${el.symbol}) — ${el.atomic_number}`}
          >
            <span className="text-[7px] leading-none opacity-60">{el.atomic_number}</span>
            <span className="text-[10px] font-bold leading-tight">{el.symbol}</span>
          </button>
        );
      })}
    </div>
  );
}
