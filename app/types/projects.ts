import type { Note } from '@/components/notes/DraggableNote';

export interface MindMapEdge {
  id: string;
  from: string;
  to: string;
}

export interface ResourceDocument {
  url: string;
  name: string;
  mimeType?: string;
}

export interface Project {
  id: string;
  description?: string; 
  backgroundColour?: string;
  name: string;
  userId: string;
  createdAt: string;
  imageUrl: string;
  status?: "not-started" | "in-progress" | "completed";
  timeSpentOnProject?: number;
  attachments?: string[];
  resourceLinks?: string[];
  resourceDocuments?: ResourceDocument[];
  resourceLayout?: Record<string, {
    x: number;
    y: number;
    width?: number;
    height?: number;
  }>;
  mindMapEdges?: MindMapEdge[];
  notes?: Note[];
}
