"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Eye, FileText, Link2, Trash2 } from "lucide-react";

type ResourceType = "image" | "link" | "document";

const buildLinkOverview = (raw: string) => {
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./i, "");
    const segments = parsed.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);
    const queryCount = Array.from(parsed.searchParams.keys()).length;

    const topSegment = segments[0]
      ? decodeURIComponent(segments[0]).replace(/[-_]+/g, " ")
      : "";

    const title = topSegment
      ? `${host} / ${topSegment}`
      : host;

    const detailParts: string[] = [];
    detailParts.push(`Domain: ${host}`);
    if (segments.length > 0) detailParts.push(`Path depth: ${segments.length}`);
    if (queryCount > 0) detailParts.push(`Query params: ${queryCount}`);

    return {
      title,
      overview: detailParts.join(" • "),
      shortUrl: `${parsed.protocol}//${host}${parsed.pathname === "/" ? "" : parsed.pathname}`,
    };
  } catch {
    return {
      title: "External link",
      overview: "Unable to generate overview for this URL.",
      shortUrl: raw,
    };
  }
};

interface DraggableResourceProps {
  id: string;
  type: ResourceType;
  value: string;
  label?: string;
  mimeType?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  onMove?: (id: string, x: number, y: number) => void;
  onDrag: (id: string, x: number, y: number) => void;
  onResize?: (id: string, width: number, height: number) => void;
  onDelete: (value: string) => void;
  onPreviewDocument?: (url: string, name: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export default function DraggableResource({
  id,
  type,
  value,
  label,
  mimeType,
  x,
  y,
  width = 224,
  height = 180,
  onMove,
  onDrag,
  onResize,
  onDelete,
  onPreviewDocument,
  selected = false,
  onSelect,
}: DraggableResourceProps) {
  const [pos, setPos] = useState({ x, y });
  const [dragging, setDragging] = useState(false);
  const [size, setSize] = useState({ width, height });
  const [resizing, setResizing] = useState(false);
  const linkMeta = buildLinkOverview(value);
  const documentTitle = label || value.split("/").pop() || "Document";

  const getScrollContainer = (element: HTMLElement): HTMLElement | Window => {
    const container = element.closest('[data-canvas-scroll]');
    if (container instanceof HTMLElement) return container;
    return window;
  };

  const isWindowTarget = (target: HTMLElement | Window): target is Window => {
    return target instanceof Window;
  };

  const getScrollPosition = (target: HTMLElement | Window) => {
    if (isWindowTarget(target)) {
      return { left: window.scrollX, top: window.scrollY };
    }
    return { left: target.scrollLeft, top: target.scrollTop };
  };

  const scrollByTarget = (target: HTMLElement | Window, dx: number, dy: number) => {
    if (dx === 0 && dy === 0) return;
    if (isWindowTarget(target)) {
      window.scrollBy(dx, dy);
      return;
    }
    target.scrollBy(dx, dy);
  };

  const getAutoPanDelta = (target: HTMLElement | Window, clientX: number, clientY: number) => {
    const threshold = 120;
    const maxSpeed = 24;
    let dx = 0;
    let dy = 0;

    if (isWindowTarget(target)) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (clientX < threshold) dx = -Math.ceil(((threshold - clientX) / threshold) * maxSpeed);
      if (clientX > width - threshold) dx = Math.ceil(((clientX - (width - threshold)) / threshold) * maxSpeed);
      if (clientY < threshold) dy = -Math.ceil(((threshold - clientY) / threshold) * maxSpeed);
      if (clientY > height - threshold) dy = Math.ceil(((clientY - (height - threshold)) / threshold) * maxSpeed);
      return { dx, dy };
    }

    const rect = target.getBoundingClientRect();
    const leftGap = clientX - rect.left;
    const rightGap = rect.right - clientX;
    const topGap = clientY - rect.top;
    const bottomGap = rect.bottom - clientY;

    if (leftGap < threshold) dx = -Math.ceil(((threshold - leftGap) / threshold) * maxSpeed);
    if (rightGap < threshold) dx = Math.ceil(((threshold - rightGap) / threshold) * maxSpeed);
    if (topGap < threshold) dy = -Math.ceil(((threshold - topGap) / threshold) * maxSpeed);
    if (bottomGap < threshold) dy = Math.ceil(((threshold - bottomGap) / threshold) * maxSpeed);
    return { dx, dy };
  };

  useEffect(() => {
    if (!dragging) {
      setPos({ x, y });
    }
  }, [x, y, dragging]);

  useEffect(() => {
    if (!resizing) {
      setSize({ width, height });
    }
  }, [width, height, resizing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (resizing) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    if ((type === "link" || type === "document") && target.closest("a")) return;

    onSelect?.(id);
    setDragging(true);
    const scrollTarget = getScrollContainer(e.currentTarget as HTMLElement);
    const startScroll = getScrollPosition(scrollTarget);
    const pointerOffsetX = e.clientX - pos.x;
    const pointerOffsetY = e.clientY - pos.y;
    let latestX = pos.x;
    let latestY = pos.y;

    const handleMouseMove = (event: MouseEvent) => {
      const { dx, dy } = getAutoPanDelta(scrollTarget, event.clientX, event.clientY);
      scrollByTarget(scrollTarget, dx, dy);
      const currentScroll = getScrollPosition(scrollTarget);
      const newX = event.clientX - pointerOffsetX + (currentScroll.left - startScroll.left);
      const newY = event.clientY - pointerOffsetY + (currentScroll.top - startScroll.top);
      latestX = newX;
      latestY = newY;
      setPos({ x: newX, y: newY });
      onMove?.(id, newX, newY);
    };

    const handleMouseUp = () => {
      setDragging(false);
      onDrag(id, latestX, latestY);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    let latestWidth = startWidth;
    let latestHeight = startHeight;

    const handleMouseMove = (event: MouseEvent) => {
      const nextWidth = Math.max(160, startWidth + (event.clientX - startX));
      const nextHeight = Math.max(120, startHeight + (event.clientY - startY));
      latestWidth = nextWidth;
      latestHeight = nextHeight;
      setSize({ width: nextWidth, height: nextHeight });
    };

    const handleMouseUp = () => {
      setResizing(false);
      onResize?.(id, latestWidth, latestHeight);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`absolute z-20 rounded-xl border-2 bg-white p-2 shadow-md ${
        selected ? "border-[#4D3BED]" : "border-gray-200"
      }`}
      style={{
        left: pos.x,
        top: pos.y,
        width: type === "image" ? size.width : 224,
        cursor: dragging ? "grabbing" : "grab",
      }}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
          {type === "image" ? <span>Image</span> : null}
          {type === "link" ? <><Link2 size={12} /><span>Link</span></> : null}
          {type === "document" ? <><FileText size={12} /><span>Document</span></> : null}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(id);
            }}
            className={`rounded p-1 ${selected ? "bg-[#4D3BED] text-white" : "text-[#4D3BED] hover:bg-[#f4f2ff]"}`}
            aria-label="Select resource for mind map"
          >
            +
          </button>
          <button
            onClick={() => onDelete(value)}
            className="rounded p-1 text-red-600 hover:bg-red-50"
            aria-label="Delete resource"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {type === "image" ? (
        <div className="relative">
          <a href={value} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
            <img src={value} alt="resource" className="w-full object-cover" style={{ height: size.height }} />
          </a>
          <button
            type="button"
            onMouseDown={handleResizeMouseDown}
            className="absolute bottom-1 right-1 h-4 w-4 cursor-se-resize rounded-sm bg-black/60"
            aria-label="Resize image"
          />
        </div>
      ) : null}
      {type === "link" ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="block rounded-lg border border-gray-200 px-2 py-2 text-sm hover:bg-[#f8f7ff]"
        >
          <div className="mb-1 flex items-center gap-2 text-[#4D3BED]">
            <ExternalLink size={14} />
            <span className="truncate font-semibold">{linkMeta.title}</span>
          </div>
          <p className="line-clamp-2 text-xs text-gray-600">{linkMeta.overview}</p>
          <p className="mt-1 truncate text-[11px] text-gray-500">{linkMeta.shortUrl}</p>
        </a>
      ) : null}
      {type === "document" ? (
        <div className="rounded-lg border border-gray-200 px-2 py-2 text-sm">
          <div className="mb-2 flex items-start gap-2 text-[#4D3BED]">
            <FileText size={14} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{documentTitle}</p>
              <p className="truncate text-[11px] text-gray-500">{mimeType || "Document file"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewDocument?.(value, documentTitle);
              }}
              className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
            >
              <Eye size={12} />
              Preview
            </button>
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
            >
              <ExternalLink size={12} />
              Open
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
