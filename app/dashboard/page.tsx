'use client';

import { useEffect, useMemo, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Menu, Search } from 'lucide-react';
import { useModal } from "@/context/ModalContext";
import { useProjects } from "@/context/ProjectsContext";
import { loadUserSettings } from "@/lib/userSettings";
import { AnimatePresence, motion } from 'framer-motion';

import Navbar from '@/components/Navbar';
import Motivation from '@/components/Motivation';
import RecentProjects from '@/components/RecentProjects';
import AddProjectModal from "@/components/AddProjectModal";
import RightSideBar from '@/components/RightSideBar';


export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLimit, setSearchLimit] = useState(8);
  const { projects } = useProjects();
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email)}&background=random&size=256&color=fff&bold=true`;
  const router = useRouter();
  const { isModalOpen, closeModal } = useModal();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        const settings = loadUserSettings(user.uid);
        setSearchLimit(settings.dashboardSearchLimit);
      } else {
        router.push('/login');
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];

    return projects.filter((project) => {
      const name = project.name?.toLowerCase() ?? "";
      const description = project.description?.toLowerCase() ?? "";
      return name.includes(query) || description.includes(query);
    });
  }, [projects, searchTerm]);

  const searchResults = useMemo(() => filteredProjects.slice(0, searchLimit), [filteredProjects, searchLimit]);

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
    <div className="relative flex min-h-screen overflow-hidden bg-white">
      {/* Mobile Hamburger */}
      <div className="absolute top-4 left-4 z-50 lg:hidden bg-white rounded-full w-[50px] h-[50px] flex justify-center items-center">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-800">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <main className="flex min-h-screen flex-1 min-w-0 flex-col p-4 sm:p-6 lg:p-8">
        {/* Top Row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative w-full sm:max-w-sm">
            <div className="flex items-center w-full h-9 rounded-full bg-[#E9E9E9]">
              <input
                type="text"
                placeholder="Search project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 rounded-full text-sm px-4 bg-transparent outline-0 py-1"
              />
              <div className="flex justify-center items-center rounded-full bg-[#4D3BED] h-8 w-8 mr-1">
                <Search size={16} className="text-white" />
              </div>
            </div>

            <AnimatePresence>
              {searchTerm.trim() && (
                <motion.div
                  className="absolute left-0 right-0 top-11 z-30 max-h-72 overflow-auto rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.99 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                {searchResults.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">No projects match your search.</p>
                ) : (
                  searchResults.map((project) => (
                    <button
                      key={project.id ?? project.name}
                      type="button"
                      onClick={() => project.id && router.push(`/projects/${project.id}`)}
                      className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-gray-100"
                    >
                      <span className="truncate text-sm font-semibold text-black">{project.name}</span>
                      <span className="truncate text-xs text-gray-500">{project.description || "No description"}</span>
                    </button>
                  ))
                )}
                </motion.div>
              )}
            </AnimatePresence>
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
        <div className="relative mt-5 mb-6 md:mb-8 flex w-full min-h-[180px] sm:min-h-[220px] lg:min-h-[260px] items-end overflow-hidden rounded-xl bg-[#DEF8CB]">
          <div className="absolute inset-0">
            <img
              src="/dashboard-intro.svg"
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>

          <div className="relative z-10 max-w-2xl p-4 sm:p-6 md:p-10">
            <p className="font-bold text-xl sm:text-3xl md:text-4xl lg:text-4xl leading-tight">
              Think deeper. Plan sharper.
              <br />
              Flow with Novaq
            </p>
          </div>
        </div>

        {/* Content Columns (stack on mobile) */}
        <div className="flex flex-1 flex-col gap-6 xl:flex-row">
          {/* LEFT - Projects */}
          <div className="w-full min-w-0 xl:flex-[3]">
            <div className="flex justify-between items-center mb-3">
              <h1 className="text-black text-lg font-bold">Recent projects</h1>
              <p onClick={() => router.push('/projects')} className="text-sm text-[#4D3BED] cursor-pointer">View all</p>
            </div>

            {/* recent projects */}
            <RecentProjects limit={8} emptyMessage="Go ahead and create a project" />

            {/* Motivation box */}
            <div className="mt-6">
              <Motivation />
            </div>
          </div>

          {/* RIGHT - Sidebar Content */}
          <div className="w-full min-w-0 xl:w-[320px] xl:flex-none">
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
