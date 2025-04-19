'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Menu, StickyNote, LogOut, Home, FolderPlus } from 'lucide-react';
import { DraggableNote, type Note } from '@/components/notes/DraggableNote';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import type { Project } from '@/app/types/projects';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [addProject, setAddProject] = useState(false);
  const imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(projectName)}&background=random&size=256`;
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email)}&background=random&size=256&color=fff&bold=true`;

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await fetchProjects(user.uid);
      } else {
        router.push('/login');
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchProjects = async (userId: string) => {
    const notesCollection = collection(db, `users/${userId}/projects`);
    const querySnapshot = await getDocs(notesCollection);
    const projectsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
    setProjects(projectsData);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const showAddModel = () => {
    setAddProject(true);
  }

  const handleAddProject = async () => {
    if(projectName !== ""){
      if (!user) return;

      const projectData = {
          name: projectName,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          imageUrl, 
      };

      const userNotesCollection = collection(db, `users/${user.uid}/projects`);
      const docRef = await addDoc(userNotesCollection, projectData);

      const newProject: Project = {
        id: docRef.id,
        ...projectData,
      }

      setProjects((prev) => [...prev, newProject]);
      setAddProject(false);
    }
    
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div role="status">
          <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin fill-blue-600" viewBox="0 0 100 101">
            <path d="M100 50.5908C100 78.2051..." fill="currentColor" />
            <path d="M93.9676 39.0409C96.393..." fill="currentFill" />
          </svg>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen relative overflow-hidden">
      {/* Mobile Hamburger */}
      <div className="absolute top-4 left-4 z-50 md:hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-800">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed z-40 inset-y-0 left-0 w-64 bg-white shadow-md transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col p-4 space-y-4 border-r">
          <div className="text-lg font-bold text-center text-black">Notium</div>
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded text-black cursor-pointer"
            >
              <Home size={18} />
              <span>Home</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded text-red-600 mt-4"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative ml-0 p-6">
        <div className='w-full flex justify-end relative'>
            {/* User Avatar */}
            <img
              src={avatarUrl}
              alt="User Avatar"
              className="w-10 h-10 rounded-full border"
            />
            {addProject &&
              <div className='absolute sm:w-[35%] w-full h-fit p-4 shadow-sm bg-white top-[5rem]'>
                <div onClick={() => setAddProject(false)} className='w-full flex justify-end cursor-pointer transition-all duration-300 hover:text-gray-600 text-black text-lg'>x</div>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="Project name"
                  className="bg-[#f3f3f3] rounded p-2 w-full text-black outline-none text-sm"
                />
                <button onClick={handleAddProject} className="flex items-center mt-4 w-full cursor-pointer gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Add
                </button>
              </div>
            }
        </div>
        <div className="flex items-center justify-end">
          {/* Add Project Button */}
          <button
            onClick={showAddModel}
            className="flex cursor-pointer items-center gap-2 px-4 py-2 text-black rounded hover:text-gray-600"
          >
            <FolderPlus size={16} />
            Add Project
          </button>
        </div>
        <p className="mt-2 text-black text-lg">Think it. Note it. Build it. Welcome to <b>Notium</b></p>

        {/* Projects */}
        <h1 className='mt-5 mb-2 text-black'>Projects</h1>
        <div className='h-[70vh] overflow-scroll scroll-hidden'>
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => router.push(`/dashboard/${project.id}`)}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded text-black cursor-pointer"
            >
              <img src={project.imageUrl} alt="Project Icon" className="w-10 h-10 rounded-full" />
              <span className='text-lg'>{project.name}</span>
            </button>          
          ))}
        </div>
      </main>
    </div>
  );
}
