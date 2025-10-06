'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, getDocs, getDoc, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { DraggableNote, type Note } from '@/components/notes/DraggableNote';
import type { Project } from '@/app/types/projects';
import { FolderPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProjectNotesPage() {
  const { projectId } = useParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
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
    <div className='p-5 bg-[#ebedee] min-h-screen overflow-auto'>
      <div className='flex justify-between w-fit'>
        <div onClick={() => router.push('/dashboard')} className='text-gray-400 cursor-pointer'>Home</div>
        <h1 className='px-4 text-black'>|</h1>
        <div className='text-bold text-black'>Project</div>
      </div>
      <div className="flex justify-between items-center mb-4 text-black">
        <h1 className="text-2xl font-semibold text-black">{project?.name}</h1>
        <button onClick={handleAddNote} className="flex items-center gap-2 px-4 py-2 text-black cursor-pointer hover:text-gray-600 rounded">
          <FolderPlus size={16} />
          Add Note
        </button>
      </div>
      <p>{project?.description}</p>

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
    </div>
  );
}
