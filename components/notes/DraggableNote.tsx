import { on } from 'node:stream';
import { useState, useRef, useEffect } from 'react';
import Tiptap from './Tiptap';

export type Note = {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

interface DraggableNoteProps {
  note: Note;
  onDrag: (id: string, x: number, y: number) => void;
  onContentChange: (id: string, content: string) => void;
  onResize: (id: string, width: number, height: number) => void;
  onDelete: (id: string) => void;
}

export const DraggableNote = ({
  note,
  onDrag,
  onContentChange,
  onResize,
  onDelete,
}: DraggableNoteProps) => {
  const [pos, setPos] = useState({ x: note.x, y: note.y });
  const [size, setSize] = useState({ width: note.width, height: note.height });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(14);

  // Drag logic...
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('[contenteditable="true"]') ||
      (e.target as HTMLElement).tagName === 'INPUT' ||
      (e.target as HTMLElement).classList.contains('resize-handle')
    ) {
      return;
    }
  
    setDragging(true);
    const startX = e.clientX - pos.x;
    const startY = e.clientY - pos.y;
  
    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      setPos({ x: newX, y: newY });
    };
  
    const handleMouseUp = () => {
      setDragging(false);
      onDrag(note.id, pos.x, pos.y);
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

    const handleResizeMouseMove = (e: MouseEvent) => {
      const newWidth = startWidth + (e.clientX - startX);
      const newHeight = startHeight + (e.clientY - startY);
      setSize({ width: newWidth, height: newHeight });
    };

    const handleResizeMouseUp = () => {
      setResizing(false);
      onResize(note.id, size.width, size.height);
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
      className="absolute bg-white shadow-md rounded text-black p-3 overflow-hidden"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        zIndex: dragging || resizing ? 50 : 10,
      }}
    >
      {/* Delete Button */}
      <button
        className="absolute top-1 right-1 text-gray-600 font-bold hover:text-gray-400 cursor-pointer p-1 bg-gray-200 rounded-full w-6 h-6 flex justify-center items-center"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(note.id);
        }}
      >
        ×
      </button>

      {/* Toolbar */}
      <div className="flex gap-2 mb-2 text-sm">
        <button onClick={() => setFontSize((s) => Math.min(s + 2, 30))} className="bg-gray-200 px-2 rounded text-sm cursor-pointer">A+</button>
        <button onClick={() => setFontSize((s) => Math.max(s - 2, 10))} className="bg-gray-200 px-2 rounded text-sm cursor-pointer">A-</button>
      </div>

      {/* Editable content */}
      <Tiptap
        content={note.content}
        onChange={(val: any) => onContentChange(note.id, val)}
        // fontSize={fontSize}
      />

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="resize-handle absolute bottom-1 right-1 w-4 h-4 bg-black opacity-40 cursor-se-resize rounded"
      />
    </div>
  );
};
