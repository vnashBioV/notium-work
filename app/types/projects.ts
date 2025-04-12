import type { Note } from '@/components/notes/DraggableNote';

export interface Project {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  imageUrl: string;
  notes?: Note[];
}