import { useRef, useCallback } from "react";

interface ResizeHandleProps {
  direction: "horizontal" | "vertical";
  onResize: (delta: number) => void;
}

export default function ResizeHandle({ direction, onResize }: ResizeHandleProps) {
  const dragging = useRef(false);
  const lastPos = useRef(0);

  const isVertical = direction === "vertical";

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      lastPos.current = isVertical ? e.clientX : e.clientY;
      document.body.style.cursor = isVertical ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        const pos = isVertical ? e.clientX : e.clientY;
        const delta = pos - lastPos.current;
        lastPos.current = pos;
        onResize(delta);
      };

      const onMouseUp = () => {
        dragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [onResize, isVertical]
  );

  if (isVertical) {
    return (
      <div onMouseDown={onMouseDown} className="w-3 cursor-col-resize flex-shrink-0 relative group z-10">
        <div className="absolute inset-y-0 -left-2 -right-2 group-hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors" />
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-gray-700 group-hover:bg-blue-500 transition-colors" />
      </div>
    );
  }

  return (
    <div onMouseDown={onMouseDown} className="h-3 cursor-row-resize flex-shrink-0 relative group z-20">
      <div className="absolute inset-x-0 -top-3 -bottom-3 group-hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors" />
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-700 group-hover:bg-blue-500 transition-colors" />
    </div>
  );
}
