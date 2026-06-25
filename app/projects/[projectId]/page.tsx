'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, getDocs, getDoc, addDoc, updateDoc, doc, deleteDoc, increment, type DocumentData, type UpdateData } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { DraggableNote, type Note } from '@/components/notes/DraggableNote';
import DraggableResource from '@/components/resources/DraggableResource';
import type { MindMapEdge, Project } from '@/app/types/projects';
import { Bot, CalendarDays, ExternalLink, Eye, FileText, FolderOpenDot, FolderPlus, Home, ImagePlus, Link2, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import DescriptionBox from '@/components/DescriptionBox';
import ProjectCompanion from '@/components/ProjectCompanion';
import { getProjectVisual } from '@/lib/projectVisuals';

export default function ProjectNotesPage() {
  const { projectId } = useParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [newLink, setNewLink] = useState("");
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState("");
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [documentPreview, setDocumentPreview] = useState<{ url: string; name: string } | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<"verify" | "confirm">("verify");
  const [deleteError, setDeleteError] = useState("");
  const [deletingProject, setDeletingProject] = useState(false);
  const [companionOpen, setCompanionOpen] = useState(false);
  const [resourcePositions, setResourcePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [resourceSizes, setResourceSizes] = useState<Record<string, { width: number; height: number }>>({});
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const trackedSecondsRef = useRef(0);
  const lastActiveAtRef = useRef<number | null>(null);
  const flushInFlightRef = useRef(false);
  const router = useRouter();

  const layoutKey = (nodeId: string) => encodeURIComponent(nodeId);
  const getSavedLayout = (nodeId: string) => project?.resourceLayout?.[layoutKey(nodeId)];

  const fetchNotes = async (userId: string, projectId: string) => {
    const notesCollection = collection(db, `users/${userId}/projects/${projectId}/notes`);
    const querySnapshot = await getDocs(notesCollection);
    const notesData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Note[];
    setNotes(notesData);
  };

  const fetchProject = async (userId: string, projectId: string) => {
    const projectRef = doc(db, `users/${userId}/projects/${projectId}`);
    const projectSnap = await getDoc(projectRef);
    if (projectSnap.exists()) {
      setProject({
        id: projectSnap.id,
        ...projectSnap.data(),
      } as Project);
    }
  };

  const deleteSubcollectionDocs = async (collectionPath: string) => {
    const snapshot = await getDocs(collection(db, collectionPath));
    await Promise.all(snapshot.docs.map((snapshotDoc) => deleteDoc(snapshotDoc.ref)));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && typeof projectId === 'string') {
        setUserId(user.uid);
        await fetchNotes(user.uid, projectId);
        fetchProject(user.uid, projectId)
      } else {
        router.push('/login');
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router, projectId]);

  const updateProjectAssets = async (next: Partial<Project>) => {
    if (!userId || typeof projectId !== 'string') return;
    const clean = Object.fromEntries(
      Object.entries(next).filter(([, value]) => {
        if (value === undefined) return false;
        if (Array.isArray(value)) return value.every((item) => item !== undefined && item !== null);
        return true;
      })
    );
    if (Object.keys(clean).length === 0) return;
    const projectRef = doc(db, `users/${userId}/projects/${projectId}`);
    await updateDoc(projectRef, clean as UpdateData<DocumentData>);
    setProject((prev) => (prev ? { ...prev, ...clean } : prev));
  };

  const flushTrackedTime = async (force = false) => {
    if (flushInFlightRef.current) return;
    if (!userId || typeof projectId !== 'string') return;
    if (!force && trackedSecondsRef.current < 10) return;
    const secondsToFlush = trackedSecondsRef.current;
    if (secondsToFlush <= 0) return;

    trackedSecondsRef.current = 0;
    flushInFlightRef.current = true;
    const hoursToAdd = secondsToFlush / 3600;

    try {
      const projectRef = doc(db, `users/${userId}/projects/${projectId}`);
      await updateDoc(projectRef, { timeSpentOnProject: increment(hoursToAdd) });
      setProject((prev) => {
        if (!prev) return prev;
        return { ...prev, timeSpentOnProject: Number(prev.timeSpentOnProject ?? 0) + hoursToAdd };
      });
    } catch (error) {
      console.error('Failed to sync tracked time:', error);
      trackedSecondsRef.current += secondsToFlush;
    } finally {
      flushInFlightRef.current = false;
    }
  };

  const uploadFileToCloudinary = async (file: File, resourceType: "image" | "auto" = "image") => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );

    const data = await res.json();
    if (!res.ok || !data?.secure_url) {
      throw new Error(data?.error?.message || "Upload failed");
    }
    return data.secure_url as string;
  };

  const handleAddImage = async (file: File | null) => {
    if (!file || !project) return;
    setAssetsLoading(true);
    setAssetsError("");
    try {
      const url = await uploadFileToCloudinary(file);
      if (!url) throw new Error("Missing uploaded file URL");
      const current = project.attachments ?? [];
      await updateProjectAssets({ attachments: [...current, url] });
    } catch (error) {
      console.error("Error adding image:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to upload image to Cloudinary.";
      setAssetsError(message);
    } finally {
      setAssetsLoading(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    if (!project) return;
    setAssetsLoading(true);
    setAssetsError("");
    try {
      const next = (project.attachments ?? []).filter((item) => item !== imageUrl);
      const nodeId = `image-${imageUrl}`;
      const nextEdges = (project.mindMapEdges ?? []).filter((edge) => edge.from !== nodeId && edge.to !== nodeId);
      const nextLayout = { ...(project.resourceLayout ?? {}) };
      delete nextLayout[layoutKey(nodeId)];
      await updateProjectAssets({ attachments: next, mindMapEdges: nextEdges, resourceLayout: nextLayout });
    } catch (error) {
      console.error("Error removing image:", error);
      setAssetsError("Failed to remove image.");
    } finally {
      setAssetsLoading(false);
    }
  };

  const normalizeLink = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleAddLink = async () => {
    if (!project) return;
    const normalized = normalizeLink(newLink);
    if (!normalized) return;

    try {
      new URL(normalized);
    } catch {
      setAssetsError("Please enter a valid link.");
      return;
    }

    setAssetsLoading(true);
    setAssetsError("");
    try {
      const current = project.resourceLinks ?? [];
      if (current.includes(normalized)) {
        setAssetsError("Link already exists.");
        return;
      }
      await updateProjectAssets({ resourceLinks: [...current, normalized] });
      setNewLink("");
    } catch (error) {
      console.error("Error adding link:", error);
      setAssetsError("Failed to add link.");
    } finally {
      setAssetsLoading(false);
    }
  };

  const handleRemoveLink = async (link: string) => {
    if (!project) return;
    setAssetsLoading(true);
    setAssetsError("");
    try {
      const next = (project.resourceLinks ?? []).filter((item) => item !== link);
      const nodeId = `link-${link}`;
      const nextEdges = (project.mindMapEdges ?? []).filter((edge) => edge.from !== nodeId && edge.to !== nodeId);
      const nextLayout = { ...(project.resourceLayout ?? {}) };
      delete nextLayout[layoutKey(nodeId)];
      await updateProjectAssets({ resourceLinks: next, mindMapEdges: nextEdges, resourceLayout: nextLayout });
    } catch (error) {
      console.error("Error removing link:", error);
      setAssetsError("Failed to remove link.");
    } finally {
      setAssetsLoading(false);
    }
  };

  const handleAddDocument = async (file: File | null) => {
    if (!file || !project) return;
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      setAssetsError("Only PDF, DOC, and DOCX files are supported.");
      return;
    }

    setAssetsLoading(true);
    setAssetsError("");
    try {
      const url = await uploadFileToCloudinary(file, "auto");
      if (!url) throw new Error("Missing uploaded file URL");
      const current = project.resourceDocuments ?? [];
      const next = [...current, { url, name: file.name, mimeType: file.type }];
      await updateProjectAssets({ resourceDocuments: next });
    } catch (error) {
      console.error("Error adding document:", error);
      setAssetsError("Failed to upload document.");
    } finally {
      setAssetsLoading(false);
    }
  };

  const handleRemoveDocument = async (documentUrl: string) => {
    if (!project) return;
    setAssetsLoading(true);
    setAssetsError("");
    try {
      const next = (project.resourceDocuments ?? []).filter((item) => item.url !== documentUrl);
      const nodeId = `doc-${documentUrl}`;
      const nextEdges = (project.mindMapEdges ?? []).filter((edge) => edge.from !== nodeId && edge.to !== nodeId);
      const nextLayout = { ...(project.resourceLayout ?? {}) };
      delete nextLayout[layoutKey(nodeId)];
      await updateProjectAssets({ resourceDocuments: next, mindMapEdges: nextEdges, resourceLayout: nextLayout });
    } catch (error) {
      console.error("Error removing document:", error);
      setAssetsError("Failed to remove document.");
    } finally {
      setAssetsLoading(false);
    }
  };

  const getDocumentPreviewUrl = (url: string) =>
    `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;

  const resourceItems = [
    ...(project?.attachments ?? []).map((value) => ({ id: `image-${value}`, type: "image" as const, value })),
    ...(project?.resourceLinks ?? []).map((value) => ({ id: `link-${value}`, type: "link" as const, value })),
    ...(project?.resourceDocuments ?? []).map((item) => ({
      id: `doc-${item.url}`,
      type: "document" as const,
      value: item.url,
      label: item.name,
      mimeType: item.mimeType,
    })),
  ];

  useEffect(() => {
    if (resourceItems.length === 0) return;
    setResourcePositions((prev) => {
      const next = { ...prev };
      for (const item of resourceItems) {
        if (!next[item.id]) {
          const saved = getSavedLayout(item.id);
          next[item.id] = {
            x: saved?.x ?? 420 + Math.floor(Math.random() * 220),
            y: saved?.y ?? 170 + Math.floor(Math.random() * 260),
          };
        }
      }
      return next;
    });
    setResourceSizes((prev) => {
      const next = { ...prev };
      for (const item of resourceItems) {
        if (item.type === "image" && !next[item.id]) {
          const saved = getSavedLayout(item.id);
          next[item.id] = { width: saved?.width ?? 224, height: saved?.height ?? 180 };
        }
      }
      return next;
    });
  }, [project?.attachments, project?.resourceLinks, project?.resourceDocuments, project?.resourceLayout]);

  const persistResourceLayout = async (
    id: string,
    patch: Partial<{ x: number; y: number; width: number; height: number }>
  ) => {
    if (!project) return;
    const key = layoutKey(id);
    const current = project.resourceLayout ?? {};
    const existing = current[key] ?? { x: 420, y: 170 };
    const nextLayout = {
      ...current,
      [key]: {
        ...existing,
        ...patch,
      },
    };
    await updateProjectAssets({ resourceLayout: nextLayout });
  };

  const handleDragResource = async (id: string, x: number, y: number) => {
    setResourcePositions((prev) => ({ ...prev, [id]: { x, y } }));
    await persistResourceLayout(id, { x, y });
  };

  const handleResizeResource = async (id: string, width: number, height: number) => {
    setResourceSizes((prev) => ({ ...prev, [id]: { width, height } }));
    await persistResourceLayout(id, { width, height });
  };

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeIds((prev) => {
      if (prev.includes(nodeId)) return prev.filter((item) => item !== nodeId);
      if (prev.length >= 2) return [prev[1], nodeId];
      return [...prev, nodeId];
    });
  };

  const handleConnectSelected = async () => {
    if (!project || selectedNodeIds.length !== 2) return;
    const [rawFrom, rawTo] = selectedNodeIds;
    if (rawFrom === rawTo) return;
    const [from, to] = [rawFrom, rawTo].sort();
    if (!nodeCenters[from] || !nodeCenters[to]) {
      setAssetsError("One of the selected cards is not ready yet. Try again.");
      return;
    }
    const current = project.mindMapEdges ?? [];
    if (current.some((edge) => edge.from === from && edge.to === to)) {
      setAssetsError("These cards are already connected.");
      return;
    }
    const edge: MindMapEdge = {
      id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      from,
      to,
    };
    setAssetsError("");
    await updateProjectAssets({ mindMapEdges: [...current, edge] });
    setSelectedNodeIds([]);
  };

  const handleRemoveEdge = async (edgeId: string) => {
    if (!project) return;
    const next = (project.mindMapEdges ?? []).filter((edge) => edge.id !== edgeId);
    await updateProjectAssets({ mindMapEdges: next });
  };

  const handleClearMindMap = async () => {
    if (!project) return;
    await updateProjectAssets({ mindMapEdges: [] });
    setSelectedNodeIds([]);
  };

  const nodeCenters = useMemo(() => {
    const centers: Record<string, { x: number; y: number }> = {};
    for (const note of notes) {
      centers[`note-${note.id}`] = {
        x: note.x + (note.width || 200) / 2,
        y: note.y + (note.height || 150) / 2,
      };
    }
    for (const item of resourceItems) {
      const pos = resourcePositions[item.id] ?? { x: 420, y: 170 };
      const size = resourceSizes[item.id] ?? { width: 224, height: item.type === "image" ? 180 : 96 };
      centers[item.id] = {
        x: pos.x + size.width / 2,
        y: pos.y + size.height / 2,
      };
    }
    return centers;
  }, [notes, resourceItems, resourcePositions, resourceSizes]);

  const visibleMindMapEdges = useMemo(() => {
    const all = project?.mindMapEdges ?? [];
    return all.filter((edge) => nodeCenters[edge.from] && nodeCenters[edge.to]);
  }, [project?.mindMapEdges, nodeCenters]);

  const mapCanvasSize = useMemo(() => {
    const points = Object.values(nodeCenters);
    let maxX = 0;
    let maxY = 0;
    for (const point of points) {
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    }
    return {
      width: Math.max(1400, Math.ceil(maxX + 320)),
      height: Math.max(900, Math.ceil(maxY + 320)),
    };
  }, [nodeCenters]);

  const handleAddNote = async () => {
    await handleCreateNote("default");
  };

  const handleCreateNote = async (type: "default" | "story") => {
    if (!userId || typeof projectId !== 'string') return;

    const noteData = {
      content:
        type === "story"
          ? "<h2>Full Story Synopsis</h2><p><strong>Premise:</strong> What is the full story about?</p><p><strong>Beginning:</strong> </p><p><strong>Middle:</strong> </p><p><strong>Ending:</strong> </p><h2>Character Background</h2><p><strong>Main character:</strong> </p><p><strong>Backstory:</strong> </p><p><strong>Goal:</strong> </p><p><strong>Flaw:</strong> </p><h2>Timeline of Major Events</h2><ol><li>Opening situation</li><li>Inciting incident</li><li>Major reversal</li><li>Climax</li><li>Resolution</li></ol><h2>Environmental Storytelling Ideas</h2><ul><li>Visual clue in the environment</li><li>Prop that reveals history</li><li>Location with hidden narrative meaning</li></ul><h2>Journal Entries</h2><p><strong>Entry 01:</strong> </p><h2>Voice Log Scripts</h2><p><strong>Voice log 01:</strong> </p><h2>Object Descriptions</h2><p><strong>Key object:</strong> </p><p><strong>Meaning:</strong> </p><h2>Final Ending Sequence</h2><p><strong>Final trigger:</strong> </p><p><strong>Final image:</strong> </p><p><strong>Emotion to leave the player with:</strong> </p>"
          : "<p></p>",
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: type === "story" ? 320 : 200,
      height: type === "story" ? 240 : 150,
      type,
    };

    const projectNotesCollection = collection(db, `users/${userId}/projects/${projectId}/notes`);
    const docRef = await addDoc(projectNotesCollection, noteData);

    const newNote: Note = {
      id: docRef.id,
      ...noteData,
    };

    setNotes((prev) => [...prev, newNote]);
  };

  const isGameProject = useMemo(() => {
    const normalized = `${project?.name ?? ""} ${project?.description ?? ""}`.toLowerCase();
    return ["game", "level", "quest", "story", "character", "rpg", "npc"].some((keyword) =>
      normalized.includes(keyword)
    );
  }, [project?.description, project?.name]);

  const handleDeleteNote = async (noteId: string) => {
    try {
      if (!userId || typeof projectId !== 'string') return;
  
      await deleteDoc(doc(db, `users/${userId}/projects/${projectId}/notes/${noteId}`));
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (project) {
        const nodeId = `note-${noteId}`;
        const nextEdges = (project.mindMapEdges ?? []).filter((edge) => edge.from !== nodeId && edge.to !== nodeId);
        if (nextEdges.length !== (project.mindMapEdges ?? []).length) {
          await updateProjectAssets({ mindMapEdges: nextEdges });
        }
      }
      console.log("Note deleted");
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };  

  const handleDrag = async (id: string, x: number, y: number) => {
    setNotes((prev) => prev.map(note => note.id === id ? { ...note, x, y } : note));
  
    try {
      if (!userId || typeof projectId !== 'string') return;
  
      const noteRef = doc(db, `users/${userId}/projects/${projectId}/notes/${id}`);
      await updateDoc(noteRef, { x, y });
    } catch (error) {
      console.error('Error updating note position:', error);
    }
  };  

  const handleMove = (id: string, x: number, y: number) => {
    setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, x, y } : note)));
  };

  const handleContentChange = async (id: string, content: string) => {
    setNotes((prev) => prev.map(note => note.id === id ? { ...note, content } : note));
    if (userId && typeof projectId === 'string') {
      const noteRef = doc(db, `users/${userId}/projects/${projectId}/notes/${id}`);
      await updateDoc(noteRef, { content });
    }
  };

  const handleResize = async (id: string, width: number, height: number) => {
    setNotes((prev) =>
      prev.map((note) => note.id === id ? { ...note, width, height } : note)
    );
  
    try {
      if (!userId || typeof projectId !== 'string') return;
  
      const noteRef = doc(db, `users/${userId}/projects/${projectId}/notes/${id}`);
      await updateDoc(noteRef, { width, height });
    } catch (error) {
      console.error('Error updating note size:', error);
    }
  };

  const handleMoveResource = (id: string, x: number, y: number) => {
    setResourcePositions((prev) => ({ ...prev, [id]: { x, y } }));
  };

  const closeDeleteModal = () => {
    if (deletingProject) return;
    setDeleteModalOpen(false);
    setDeleteConfirmValue("");
    setDeleteConfirmStep("verify");
    setDeleteError("");
  };

  const handleDeleteContinue = () => {
    if (!project) return;
    const projectName = project.name?.trim() ?? "";
    if (!projectName) {
      setDeleteError("Project name is missing. Refresh and try again.");
      return;
    }

    if (deleteConfirmValue.trim() !== projectName) {
      setDeleteError("Type the exact project name to confirm deletion.");
      return;
    }
    setDeleteError("");
    setDeleteConfirmStep("confirm");
  };

  const handleDeleteProject = async () => {
    if (!userId || typeof projectId !== 'string' || !project) return;
    setDeletingProject(true);
    setDeleteError("");

    try {
      await deleteSubcollectionDocs(`users/${userId}/projects/${projectId}/notes`);
      await deleteSubcollectionDocs(`users/${userId}/projects/${projectId}/todos`);
      await deleteDoc(doc(db, `users/${userId}/projects/${projectId}`));
      router.push('/projects');
    } catch (error) {
      console.error("Error deleting project:", error);
      setDeleteError("Failed to delete project. Please try again.");
    } finally {
      setDeletingProject(false);
    }
  };

  useEffect(() => {
    if (!userId || typeof projectId !== 'string') return;
    if (typeof document === 'undefined') return;

    const tick = () => {
      const isActive = document.visibilityState === 'visible';
      const now = Date.now();
      if (!isActive) {
        lastActiveAtRef.current = null;
        return;
      }
      if (lastActiveAtRef.current === null) {
        lastActiveAtRef.current = now;
        return;
      }
      const elapsedSeconds = Math.min((now - lastActiveAtRef.current) / 1000, 5);
      lastActiveAtRef.current = now;
      if (elapsedSeconds <= 0) return;
      trackedSecondsRef.current += elapsedSeconds;
      void flushTrackedTime(false);
    };

    const intervalId = window.setInterval(tick, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lastActiveAtRef.current = null;
        void flushTrackedTime(true);
      }
    };

    const handlePageHide = () => {
      lastActiveAtRef.current = null;
      void flushTrackedTime(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      void flushTrackedTime(true);
    };
  }, [userId, projectId]);

  if (checkingAuth) {
    return (
      <div className='w-full h-[100vh] flex justify-center items-center'>
        <div className='w-full h-full flex justify-center items-center'>
              <div role="status" className='rounded-full bg-white'>
                  <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-white fill-blue-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                  </svg>
                  <span className="sr-only">Loading...</span>
              </div>
          </div>
      </div>
      
    )
  }

  const projectVisual = getProjectVisual(project?.name);
  const ProjectVisualIcon = projectVisual.icon;

  return (
    <div data-canvas-scroll className='relative min-h-screen overflow-auto bg-[#ebedee] p-4 sm:p-6 md:pr-24 lg:pr-28'>
      <div className="flex w-full flex-wrap items-center gap-2 text-sm text-slate-500">
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 transition hover:bg-white"
        >
          <Home size={16} />
          Home
        </button>
        <span className="text-slate-300">/</span>
        <div className="inline-flex items-center gap-2 rounded-full bg-white/40 px-3 py-2 text-slate-700">
          <FolderPlus size={15} />
          Project
        </div>
      </div>
      <div className="pointer-events-none fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 md:flex">
        <div className="pointer-events-auto flex w-[58px] flex-col items-center gap-2 rounded-[20px] border border-white/70 bg-white/90 px-2 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF0FF] text-[#1B1C3A]">
            <span className="text-[10px] font-semibold">{selectedNodeIds.length}/2</span>
          </div>
          <button
            onClick={handleConnectSelected}
            disabled={selectedNodeIds.length !== 2}
            title="Connect selected cards"
            aria-label="Connect selected cards"
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-[#1F2430] transition hover:bg-[#F3F4F6] disabled:opacity-40"
          >
            <Link2 size={18} />
            {selectedNodeIds.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
            )}
          </button>
          <button
            onClick={() => setCompanionOpen((prev) => !prev)}
            title="Companion"
            aria-label="Toggle companion"
            className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
              companionOpen ? "bg-[#4D3BED] text-white" : "text-[#1F2430] hover:bg-[#F3F4F6]"
            }`}
          >
            <Bot size={18} />
          </button>
          <button
            onClick={() => setResourcesOpen(true)}
            title="Resources"
            aria-label="Resources"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1F2430] transition hover:bg-[#F3F4F6]"
          >
            <ImagePlus size={18} />
          </button>
          <button
            onClick={() => router.push(`/calendar?projectId=${projectId}`)}
            title="Schedule"
            aria-label="Schedule"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1F2430] transition hover:bg-[#F3F4F6]"
          >
            <CalendarDays size={18} />
          </button>
          <button
            onClick={handleAddNote}
            title="Add note"
            aria-label="Add note"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1F2430] transition hover:bg-[#F3F4F6]"
          >
            <FileText size={18} />
          </button>
          {isGameProject ? (
            <button
              onClick={() => handleCreateNote("story")}
              title="Add story note"
              aria-label="Add story note"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#b45309] transition hover:bg-[#fff1d6]"
            >
              <FolderPlus size={18} />
            </button>
          ) : null}
          <div className="my-1 h-px w-8 bg-gray-200" />
          <button
            onClick={handleClearMindMap}
            disabled={(project?.mindMapEdges?.length ?? 0) === 0}
            title="Clear mind map"
            aria-label="Clear mind map"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1F2430] transition hover:bg-[#F3F4F6] disabled:opacity-40"
          >
            <X size={18} />
          </button>
          <button
            onClick={() => setDeleteModalOpen(true)}
            title="Delete project"
            aria-label="Delete project"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-red-700 transition hover:bg-red-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="my-6 flex flex-col gap-4 text-black sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-[760px] rounded-[28px] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,255,255,0.72))] px-5 py-5 shadow-[0_16px_44px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6">
          <div className="flex items-start gap-4">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] shadow-inner sm:h-[74px] sm:w-[74px] ${projectVisual.panelClass}`}>
                {project?.imageUrl ?(
                  <img
                      src={project?.imageUrl}
                      className="h-full w-full rounded-[22px] object-cover"
                      alt={project?.name}
                  />): (
                      <ProjectVisualIcon className="h-9 w-9" />
                    )
                }
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex items-center rounded-full bg-[#eef0ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4D3BED]">
                Project space
              </div>
              <h1 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-slate-950 sm:text-[2rem]">{project?.name}</h1>
              <div className="mt-3 max-w-[560px]">
                <DescriptionBox
                    userId={userId!}
                    projectId={projectId as string}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-xs text-gray-700 shadow-sm md:flex">
          <span>{selectedNodeIds.length}/2 selected</span>
          <span className="text-gray-400">|</span>
          <span>{(project?.mindMapEdges?.length ?? 0)} links</span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 md:hidden">
        <button
          onClick={() => setCompanionOpen((prev) => !prev)}
          className={`rounded-md border px-3 py-2 text-xs ${
            companionOpen ? "border-[#4D3BED] bg-[#4D3BED] text-white" : "border-gray-300 bg-white text-black"
          }`}
        >
          Companion
        </button>
        <button
          onClick={() => setResourcesOpen(true)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-black"
        >
          Resources
        </button>
        <button
          onClick={() => router.push(`/calendar?projectId=${projectId}`)}
          className="rounded-md border border-[#4D3BED] bg-white px-3 py-2 text-xs text-[#4D3BED]"
        >
          Schedule
        </button>
        <button
          onClick={handleAddNote}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-black"
        >
          Add Note
        </button>
        {isGameProject ? (
          <button
            onClick={() => handleCreateNote("story")}
            className="rounded-md border border-[#f3d19c] bg-[#fff7e8] px-3 py-2 text-xs text-[#b45309]"
          >
            Story Note
          </button>
        ) : null}
        <button
          onClick={handleConnectSelected}
          disabled={selectedNodeIds.length !== 2}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-black disabled:opacity-50"
        >
          Connect
        </button>
        <button
          onClick={handleClearMindMap}
          disabled={(project?.mindMapEdges?.length ?? 0) === 0}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-black disabled:opacity-50"
        >
          Clear
        </button>
        <button
          onClick={() => setDeleteModalOpen(true)}
          className="rounded-md border border-red-300 bg-white px-3 py-2 text-xs text-red-700"
        >
          Delete
        </button>
      </div>
       {/* Floating To-Do List */}
      {/* <div className="fixed top-40 right-5 z-50 w-80">
        <TodoList userId={userId!} projectId={projectId as string} />
      </div> */}

      <AnimatePresence>
        {project && companionOpen ? (
          <motion.div
            className="fixed bottom-4 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-20 md:top-1/2 md:w-[340px] md:-translate-y-1/2"
            initial={{ opacity: 0, x: 18, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 12, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <ProjectCompanion
              className="max-h-[72vh] overflow-y-auto"
              companion={project.companion}
              onChange={async (companion) => {
                await updateProjectAssets({ companion });
              }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {resourcesOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <motion.div
              className="w-full max-w-3xl rounded-xl bg-white p-4 sm:p-5 shadow-lg"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">Project Resources</h2>
              <button
                onClick={() => setResourcesOpen(false)}
                className="rounded p-1 text-gray-600 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {assetsError && <p className="mb-3 text-sm text-red-600">{assetsError}</p>}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-3">
                <h3 className="mb-2 text-sm font-semibold text-black">Images</h3>
                <label className="mb-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#4D3BED] px-3 py-2 text-sm text-[#4D3BED] hover:bg-[#4D3BED] hover:text-white transition-all duration-200">
                  <ImagePlus size={16} />
                  {assetsLoading ? "Uploading..." : "Add image"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAddImage(e.target.files?.[0] || null)}
                    disabled={assetsLoading}
                  />
                </label>

                {project?.attachments && project.attachments.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {project.attachments.map((imageUrl) => (
                      <div key={imageUrl} className="group relative overflow-hidden rounded-lg bg-gray-100">
                        <img src={imageUrl} alt="attachment" className="h-24 w-full object-cover" />
                        <button
                          onClick={() => handleRemoveImage(imageUrl)}
                          className="absolute right-1 top-1 rounded bg-black/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No images added yet.</p>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <h3 className="mb-2 text-sm font-semibold text-black">Links</h3>
                <div className="mb-3 flex gap-2">
                  <input
                    type="url"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#4D3BED]"
                  />
                  <button
                    onClick={handleAddLink}
                    disabled={assetsLoading || !newLink.trim()}
                    className="rounded-md bg-[#4D3BED] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>

                {project?.resourceLinks && project.resourceLinks.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-auto pr-1">
                    {project.resourceLinks.map((link) => (
                      <div key={link} className="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-2 py-2">
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-0 items-center gap-2 text-sm text-[#4D3BED] hover:underline"
                        >
                          <ExternalLink size={14} />
                          <span className="truncate">{link}</span>
                        </a>
                        <button onClick={() => handleRemoveLink(link)} className="rounded p-1 text-red-600 hover:bg-red-50">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No links added yet.</p>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 p-3">
                <h3 className="mb-2 text-sm font-semibold text-black">Documents</h3>
                <label className="mb-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#4D3BED] px-3 py-2 text-sm text-[#4D3BED] hover:bg-[#4D3BED] hover:text-white transition-all duration-200">
                  <FileText size={16} />
                  {assetsLoading ? "Uploading..." : "Add document"}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={(e) => handleAddDocument(e.target.files?.[0] || null)}
                    disabled={assetsLoading}
                  />
                </label>

                {project?.resourceDocuments && project.resourceDocuments.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-auto pr-1">
                    {project.resourceDocuments.map((document) => (
                      <div key={document.url} className="rounded-md border border-gray-200 px-2 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm text-gray-800">{document.name}</p>
                          <button
                            onClick={() => handleRemoveDocument(document.url)}
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => setDocumentPreview({ url: document.url, name: document.name })}
                            className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                          >
                            <Eye size={12} />
                            Preview
                          </button>
                          <a
                            href={document.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                          >
                            <ExternalLink size={12} />
                            Open
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No documents added yet.</p>
                )}
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {documentPreview && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <motion.div
              className="w-full max-w-5xl rounded-xl bg-white p-4 shadow-lg"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="truncate text-lg font-semibold text-black">{documentPreview.name}</h2>
                <button
                  onClick={() => setDocumentPreview(null)}
                  className="rounded p-1 text-gray-600 hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>
              <iframe
                src={getDocumentPreviewUrl(documentPreview.url)}
                title={documentPreview.name}
                className="h-[70vh] w-full rounded border border-gray-200"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <motion.div
              className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
            <h2 className="text-lg font-semibold text-black">Delete Project</h2>
            {deleteConfirmStep === "verify" ? (
              <>
                <p className="mt-2 text-sm text-gray-700">
                  This will permanently delete the project, notes, and todos.
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  Type <span className="font-semibold text-black">{project?.name ?? "project name"}</span> to continue.
                </p>
                <input
                  type="text"
                  value={deleteConfirmValue}
                  onChange={(e) => {
                    setDeleteConfirmValue(e.target.value);
                    if (deleteError) setDeleteError("");
                  }}
                  className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-red-400"
                  placeholder="Enter project name"
                  disabled={deletingProject}
                />
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-700">
                Final confirmation: deleting <span className="font-semibold text-black">{project?.name ?? "this project"}</span> is permanent and cannot be undone.
              </p>
            )}
            {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={closeDeleteModal}
                disabled={deletingProject}
                className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteConfirmStep === "verify" ? handleDeleteContinue : handleDeleteProject}
                disabled={deletingProject}
                className="rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingProject ? "Deleting..." : deleteConfirmStep === "verify" ? "Continue" : "Delete Project"}
              </button>
            </div>
            {deleteConfirmStep === "confirm" && !deletingProject && (
              <button
                onClick={() => setDeleteConfirmStep("verify")}
                className="mt-2 text-sm text-gray-600 hover:text-black"
              >
                Back to verification
              </button>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <svg
        className="pointer-events-none absolute left-0 top-0 z-[5] overflow-visible"
        style={{ width: `${mapCanvasSize.width}px`, height: `${mapCanvasSize.height}px` }}
      >
        {visibleMindMapEdges.map((edge) => {
          const from = nodeCenters[edge.from];
          const to = nodeCenters[edge.to];
          if (!from || !to) return null;
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;

          return (
            <g key={edge.id}>
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#4D3BED"
                strokeOpacity="0.8"
                strokeWidth="2.5"
                style={{ pointerEvents: "none" }}
              />
              <g>
                <circle cx={midX} cy={midY} r="9" fill="white" stroke="#ef4444" strokeWidth="1.5" />
                <path d={`M ${midX - 3} ${midY - 3} L ${midX + 3} ${midY + 3} M ${midX + 3} ${midY - 3} L ${midX - 3} ${midY + 3}`} stroke="#ef4444" strokeWidth="1.5" />
              </g>
            </g>
          );
        })}
      </svg>

      {notes.map((note) => (
        <DraggableNote
          key={note.id}
          note={note}
          onMove={handleMove}
          onDrag={handleDrag}
          onContentChange={handleContentChange}
          onResize={handleResize}
          onDelete={handleDeleteNote}
          selected={selectedNodeIds.includes(`note-${note.id}`)}
          onSelect={handleSelectNode}
        />
      ))}

      {resourceItems.map((item) => (
        <DraggableResource
          key={item.id}
          id={item.id}
          type={item.type}
          value={item.value}
          label={"label" in item ? item.label : undefined}
          mimeType={"mimeType" in item ? item.mimeType : undefined}
          x={resourcePositions[item.id]?.x ?? 420}
          y={resourcePositions[item.id]?.y ?? 170}
          width={resourceSizes[item.id]?.width ?? 224}
          height={resourceSizes[item.id]?.height ?? (item.type === "image" ? 180 : 96)}
          onMove={handleMoveResource}
          onDrag={handleDragResource}
          onResize={item.type === "image" ? handleResizeResource : undefined}
          onDelete={
            item.type === "image"
              ? handleRemoveImage
              : item.type === "link"
                ? handleRemoveLink
                : handleRemoveDocument
          }
          onPreviewDocument={(url, name) => setDocumentPreview({ url, name })}
          selected={selectedNodeIds.includes(item.id)}
          onSelect={handleSelectNode}
        />
      ))}
    </div>
  );
}
