'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Menu, Search, Plus, Clock, Paperclip } from 'lucide-react';
import { DraggableNote, type Note } from '@/components/notes/DraggableNote';
import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import type { Project } from '@/app/types/projects';
import { useModal } from "@/context/ModalContext";

import Navbar from '@/components/Navbar';
import Motivation from '@/components/Motivation';
import RecentProjects from '@/components/RecentProjects';
import AddProjectModal from "@/components/AddProjectModal";

import { useMediaQuery } from 'react-responsive'
import RightSideBar from '@/components/RightSideBar';


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
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const router = useRouter();
  const { isModalOpen, openModal, closeModal } = useModal();

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
    <div className="flex min-h-screen relative overflow-hidden bg-white">
      {/* Mobile Hamburger */}
      <div className="absolute top-4 left-4 z-50 lg:hidden bg-white rounded-full w-[50px] h-[50px] flex justify-center items-center">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-800">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col p-4 sm:p-6 md:p-6 lg:p-8 h-screen">
        {/* Top Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex items-center w-full sm:max-w-sm h-9 rounded-full bg-[#E9E9E9]">
            <input
              type="text"
              placeholder="Search project..."
              className="flex-1 rounded-full text-sm px-4 bg-transparent outline-0 py-1"
            />
            <div className="flex justify-center items-center rounded-full bg-[#4D3BED] h-8 w-8 cursor-pointer mr-1">
              <Search size={16} className="text-white" />
            </div>
          </div>

          {/* Avatar */}
          <div className="flex items-center justify-end w-full sm:w-auto">
            <img
              src={avatarUrl}
              alt="User Avatar"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border"
            />
          </div>
        </div>

        {/* Hero Banner */}
        <div className="w-full mt-5 mb-6 md:mb-8 bg-[#DEF8CB] rounded-xl relative overflow-hidden flex items-center">
          <div className="absolute inset-0">
            <img
              src="/dashboard-intro.svg"
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 p-6 md:p-10">
            <p className="font-bold text-2xl sm:text-3xl md:text-4xl lg:text-4xl">
              Think deeper. Plan sharper.
              <br />
              Flow with Novaq
            </p>
          </div>

          {/* responsive height */}
          <style jsx>{`
            div[role="hero"] {}
          `}</style>
        </div>

        {/* Content Columns (stack on mobile) */}
        <div className="flex flex-col lg:flex-row flex-grow gap-6">
          {/* LEFT - Projects */}
          <div className="w-full lg:flex-[3] min-w-0">
            <div className="flex justify-between items-center mb-3">
              <h1 className="text-black text-lg font-bold">Recent projects</h1>
              <p className="text-sm text-[#4D3BED] cursor-pointer">View all</p>
            </div>

            {/* recent projects */}
            <RecentProjects />

            {/* Motivation box */}
            <div className="mt-6">
              <Motivation />
            </div>
          </div>

          {/* RIGHT - Sidebar Content */}
          <div className="w-full lg:w-1/3 min-w-0">
            <RightSideBar />
          </div>
        </div>
      </main>

      {/* add project popup */}
      <AddProjectModal
        isOpen={isModalOpen}
        onClose={closeModal}
        user={user}
      />
    </div>
  );
}
