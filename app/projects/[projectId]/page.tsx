'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, getDocs, getDoc, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { DraggableNote, type Note } from '@/components/notes/DraggableNote';
import DraggableResource from '@/components/resources/DraggableResource';
import type { Project } from '@/app/types/projects';
import { ExternalLink, FolderOpenDot, FolderPlus, Home, ImagePlus, Link2, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DescriptionBox from '@/components/DescriptionBox';

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
  const [resourcePositions, setResourcePositions] = useState<Record<string, { x: number; y: number }>>({});
  const router = useRouter();

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
    await updateDoc(projectRef, clean as Record<string, unknown>);
    setProject((prev) => (prev ? { ...prev, ...clean } : prev));
  };

  const uploadFileToCloudinary = async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary config missing");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
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
      await updateProjectAssets({ attachments: next });
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
      await updateProjectAssets({ resourceLinks: next });
    } catch (error) {
      console.error("Error removing link:", error);
      setAssetsError("Failed to remove link.");
    } finally {
      setAssetsLoading(false);
    }
  };

  const resourceItems = [
    ...(project?.attachments ?? []).map((value) => ({ id: `image-${value}`, type: "image" as const, value })),
    ...(project?.resourceLinks ?? []).map((value) => ({ id: `link-${value}`, type: "link" as const, value })),
  ];

  useEffect(() => {
    if (resourceItems.length === 0) return;
    setResourcePositions((prev) => {
      const next = { ...prev };
      for (const item of resourceItems) {
        if (!next[item.id]) {
          next[item.id] = {
            x: 420 + Math.floor(Math.random() * 220),
            y: 170 + Math.floor(Math.random() * 260),
          };
        }
      }
      return next;
    });
  }, [project?.attachments, project?.resourceLinks]);

  const handleDragResource = (id: string, x: number, y: number) => {
    setResourcePositions((prev) => ({ ...prev, [id]: { x, y } }));
  };

  const handleAddNote = async () => {
    if (!userId || typeof projectId !== 'string') return;
    const now = new Date().toISOString();

    const noteData = {
      content: "New Note",   
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 200,
      height: 150,
    };

    const projectNotesCollection = collection(db, `users/${userId}/projects/${projectId}/notes`);
    const docRef = await addDoc(projectNotesCollection, noteData);

    const newNote: Note = {
      id: docRef.id,
      ...noteData,
    };

    setNotes((prev) => [...prev, newNote]);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      if (!userId || typeof projectId !== 'string') return;
  
      await deleteDoc(doc(db, `users/${userId}/projects/${projectId}/notes/${noteId}`));
      setNotes(prev => prev.filter(note => note.id !== noteId));
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

  return (
    <div className='relative min-h-screen overflow-auto bg-[#ebedee] p-4 sm:p-6 lg:p-10'>
      <div className='flex w-full flex-wrap items-center gap-2'>
        <div onClick={() => router.push('/dashboard')} className='text-gray-400 cursor-pointer flex items-center'>
          <Home size={18} className="mr-3"/>
          Home
        </div>
        <h1 className='px-4 text-black'>|</h1>
        <div className='text-bold text-black flex items-center'>
          <FolderPlus size={16} className="mr-3"/>
          Project
        </div>
      </div>
      <div className="my-6 flex flex-col gap-4 text-black sm:flex-row sm:items-center sm:justify-between">
        <div className='flex items-center'>
          <div className='mr-2 flex h-14 w-14 items-center justify-center rounded-full bg-gray-300 sm:h-[70px] sm:w-[70px]'>
              {project?.imageUrl ?(
                <img
                    src={project?.imageUrl}
                    className="object-cover w-full h-full rounded-full border-none"
                    alt={project?.name}
                />): (
                    <FolderOpenDot className="w-10 h-10 text-gray-400" />
                  )
              }
          </div>
          <h1 className="text-xl font-semibold text-black sm:text-2xl">{project?.name}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setResourcesOpen(true)}
            className="w-fit rounded border border-gray-300 px-4 py-2 text-black hover:bg-gray-100 cursor-pointer flex items-center gap-2"
          >
            <Link2 size={16} />
            Resources
          </button>
          <button
            onClick={() => router.push(`/calendar?projectId=${projectId}`)}
            className="w-fit rounded border border-[#4D3BED] px-4 py-2 text-[#4D3BED] hover:bg-[#4D3BED] hover:text-white cursor-pointer flex items-center gap-2"
          >
            <FolderPlus size={16} />
            Schedule
          </button>
          <button onClick={handleAddNote} className="w-fit rounded px-4 py-2 text-black hover:text-gray-600 cursor-pointer flex items-center gap-2">
            <FolderPlus size={16} />
            Add Note
          </button>
        </div>
      </div>
      <DescriptionBox
          userId={userId!}
          projectId={projectId as string}
      />

       {/* Floating To-Do List */}
      {/* <div className="fixed top-40 right-5 z-50 w-80">
        <TodoList userId={userId!} projectId={projectId as string} />
      </div> */}

      {resourcesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white p-4 sm:p-5 shadow-lg">
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

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
            </div>
          </div>
        </div>
      )}

      {notes.map((note) => (
        <DraggableNote
          key={note.id}
          note={note}
          onDrag={handleDrag}
          onContentChange={handleContentChange}
          onResize={handleResize}
          onDelete={handleDeleteNote}
        />
      ))}

      {resourceItems.map((item) => (
        <DraggableResource
          key={item.id}
          id={item.id}
          type={item.type}
          value={item.value}
          x={resourcePositions[item.id]?.x ?? 420}
          y={resourcePositions[item.id]?.y ?? 170}
          onDrag={handleDragResource}
          onDelete={item.type === "image" ? handleRemoveImage : handleRemoveLink}
        />
      ))}
    </div>
  );
}
