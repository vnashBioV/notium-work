import { useState, useRef } from 'react';
import Tiptap from './Tiptap';
import { Scaling } from 'lucide-react';

export type Note = {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: "default" | "story";
};

interface DraggableNoteProps {
  note: Note;
  onMove?: (id: string, x: number, y: number) => void;
  onDrag: (id: string, x: number, y: number) => void;
  onContentChange: (id: string, content: string) => void;
  onResize: (id: string, width: number, height: number) => void;
  onDelete: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export const DraggableNote = ({
  note,
  onMove,
  onDrag,
  onContentChange,
  onResize,
  onDelete,
  selected = false,
  onSelect,
}: DraggableNoteProps) => {
  const [pos, setPos] = useState({ x: note.x, y: note.y });
  const [size, setSize] = useState({ width: note.width, height: note.height });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(14);
  const isStoryNote = note.type === "story";

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

  // Drag logic...
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Stop dragging if the click is inside any interactive area:
    if (
      target.closest('[contenteditable="true"]') || 
      target.closest('.tiptap-toolbar') ||          
      target.closest('[data-note-editor-control="true"]') ||
      target.closest('button') ||
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.classList.contains('resize-handle')
    ) {
      return;
    }

    setDragging(true);
    onSelect?.(`note-${note.id}`);
    const scrollTarget = getScrollContainer(e.currentTarget as HTMLElement);
    const startScroll = getScrollPosition(scrollTarget);
    const pointerOffsetX = e.clientX - pos.x;
    const pointerOffsetY = e.clientY - pos.y;
    let latestX = pos.x;
    let latestY = pos.y;

    const handleMouseMove = (e: MouseEvent) => {
      const { dx, dy } = getAutoPanDelta(scrollTarget, e.clientX, e.clientY);
      scrollByTarget(scrollTarget, dx, dy);
      const currentScroll = getScrollPosition(scrollTarget);
      const newX = e.clientX - pointerOffsetX + (currentScroll.left - startScroll.left);
      const newY = e.clientY - pointerOffsetY + (currentScroll.top - startScroll.top);
      latestX = newX;
      latestY = newY;
      setPos({ x: newX, y: newY });
      onMove?.(note.id, newX, newY);
    };

    const handleMouseUp = () => {
      setDragging(false);
      onDrag(note.id, latestX, latestY);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };


  // Resize logic...
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    let latestWidth = startWidth;
    let latestHeight = startHeight;

    const handleResizeMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(160, startWidth + (e.clientX - startX));
      const newHeight = Math.max(120, startHeight + (e.clientY - startY));
      latestWidth = newWidth;
      latestHeight = newHeight;
      setSize({ width: newWidth, height: newHeight });
    };

    const handleResizeMouseUp = () => {
      setResizing(false);
      onResize(note.id, latestWidth, latestHeight);
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleResizeMouseUp);
    };

    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
  };

  const handleBlur = () => {
    if (contentRef.current) {
      onContentChange(note.id, contentRef.current.innerHTML);
    }
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`absolute rounded text-[#222222] pt-8 text-sm border-2 shadow-md ${
        isStoryNote ? 'bg-[#fffaf0] shadow-[0_16px_34px_rgba(180,83,9,0.12)]' : 'bg-white'
      } ${
        selected ? 'border-[#4D3BED]' : isStoryNote ? 'border-[#f3d19c]' : 'border-transparent'
      }`}
      style={{
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        zIndex: dragging || resizing ? 50 : 10,
      }}
    >
      <button
        className={`absolute top-1 left-1 z-50 cursor-pointer p-1 w-6 h-6 flex justify-center items-center rounded ${
          selected ? "bg-[#4D3BED] text-white" : "bg-white text-[#4D3BED]"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(`note-${note.id}`);
        }}
        aria-label="Select note for mind map"
      >
        +
      </button>

      {/* Delete Button */}
      <button
        className="absolute top-1 right-1 z-50 text-gray-600 font-bold hover:text-gray-400 cursor-pointer p-1 w-6 h-6 flex justify-center items-center bg-white"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(note.id);
        }}
      >
        ×
      </button>

      {/* Editable content wrapper */}
      {isStoryNote ? (
        <div className="pointer-events-none absolute left-9 top-1.5 z-30 rounded-full bg-[#fff1d6] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b45309]">
          Story
        </div>
      ) : null}
      <div
        className="absolute inset-0 p-3 pb-6 overflow-auto"
        style={{ pointerEvents: dragging ? "none" : "auto" }}
      >
        <Tiptap
          content={note.content}
          variant={isStoryNote ? "story" : "default"}
          onChange={(val: any) => onContentChange(note.id, val)}
        />
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="resize-handle absolute bottom-1 right-1 w-4 h-4 bg-[#ffffff] opacity-40 cursor-se-resize rounded z-40"
      >
        <Scaling size={16} className='text-[#838383]'/>
      </div>
    </div>

  );
};
