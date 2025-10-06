import type { Note } from '@/components/notes/DraggableNote';

export interface Project {
  id: string;
  description?: string; 
  backgroundColour?: string;
  name: string;
  userId: string;
  createdAt: string;
  imageUrl: string;
  notes?: Note[];
}