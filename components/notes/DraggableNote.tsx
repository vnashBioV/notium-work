import { useState } from 'react';

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
  onResize: (id: string, width: number, height: number) => void; // 👈 new prop
}

export const DraggableNote = ({
  note,
  onDrag,
  onContentChange,
  onResize
}: DraggableNoteProps) => {
  const [pos, setPos] = useState({ x: note.x, y: note.y });
  const [size, setSize] = useState({ width: note.width, height: note.height });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging when resizing
    if ((e.target as HTMLElement).classList.contains('resize-handle')) return;

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

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent dragging when resizing
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

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute bg-[#efefef] shadow-md rounded cursor-grab text-black p-4"
      style={{
        left: pos.x,
        top: pos.y,
        width: size.width,
        height: size.height,
        zIndex: dragging || resizing ? 50 : 10,
      }}
    >
      <textarea
        defaultValue={note.content}
        className="w-full h-full bg-transparent outline-none resize-none"
        onBlur={(e) => onContentChange(note.id, e.target.value)}
      />

      {/* Resize handle in bottom-right corner */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="resize-handle absolute bottom-1 right-1 w-4 h-4 bg-black opacity-40 cursor-se-resize rounded"
      />
    </div>
  );
};
