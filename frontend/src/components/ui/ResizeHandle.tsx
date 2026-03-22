import { useRef, useCallback } from "react";

interface ResizeHandleProps {
  side: "left" | "right";
  onResize: (delta: number) => void;
}

export default function ResizeHandle({ side, onResize }: ResizeHandleProps) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      lastX.current = e.clientX;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        const delta = e.clientX - lastX.current;
        lastX.current = e.clientX;
        onResize(side === "left" ? delta : -delta);
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
    [onResize, side]
  );

  return (
    <div
      onMouseDown={onMouseDown}
      className="w-3 cursor-col-resize flex-shrink-0 relative group z-10"
    >
      <div className="absolute inset-y-0 -left-2 -right-2 group-hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors" />
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-gray-700 group-hover:bg-blue-500 transition-colors" />
    </div>
  );
}
