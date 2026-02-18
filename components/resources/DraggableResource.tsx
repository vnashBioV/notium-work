"use client";

import { useState } from "react";
import { ExternalLink, Link2, Trash2 } from "lucide-react";

type ResourceType = "image" | "link";

interface DraggableResourceProps {
  id: string;
  type: ResourceType;
  value: string;
  x: number;
  y: number;
  onDrag: (id: string, x: number, y: number) => void;
  onDelete: (value: string) => void;
}

export default function DraggableResource({
  id,
  type,
  value,
  x,
  y,
  onDrag,
  onDelete,
}: DraggableResourceProps) {
  const [pos, setPos] = useState({ x, y });
  const [dragging, setDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("a") || target.closest("button")) return;

    setDragging(true);
    const startX = e.clientX - pos.x;
    const startY = e.clientY - pos.y;

    const handleMouseMove = (event: MouseEvent) => {
      const newX = event.clientX - startX;
      const newY = event.clientY - startY;
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setDragging(false);
      onDrag(id, pos.x, pos.y);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute z-20 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-md"
      style={{ left: pos.x, top: pos.y, cursor: dragging ? "grabbing" : "grab" }}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          {type === "image" ? <span>Image</span> : <><Link2 size={12} /><span>Link</span></>}
        </div>
        <button
          onClick={() => onDelete(value)}
          className="rounded p-1 text-red-600 hover:bg-red-50"
          aria-label="Delete resource"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {type === "image" ? (
        <a href={value} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
          <img src={value} alt="resource" className="h-28 w-full object-cover" />
        </a>
      ) : (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-2 py-2 text-sm text-[#4D3BED] hover:bg-[#f8f7ff]"
        >
          <ExternalLink size={14} />
          <span className="truncate">{value}</span>
        </a>
      )}
    </div>
  );
}
