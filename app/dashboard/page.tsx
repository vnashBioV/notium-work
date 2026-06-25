'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Command, Menu, Search } from 'lucide-react';
import gsap from 'gsap';
import { useModal } from "@/context/ModalContext";
import { useProjects } from "@/context/ProjectsContext";
import { loadUserSettings } from "@/lib/userSettings";

import Navbar from '@/components/Navbar';
import Motivation from '@/components/Motivation';
import RecentProjects from '@/components/RecentProjects';
import AddProjectModal from "@/components/AddProjectModal";
import RightSideBar from '@/components/RightSideBar';

const pageStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.08,
    },
  },
};

const revealUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const revealSoft = {
  hidden: { opacity: 0, scale: 0.985, y: 22 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

const getInitials = (user: User | null) => {
  const source = user?.displayName || user?.email || "User";

  return source
    .split(/[.\s@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");
};

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLimit, setSearchLimit] = useState(8);
  const { projects } = useProjects();
  const router = useRouter();
  const { isModalOpen, closeModal } = useModal();
  const scopeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (nextUser) {
        setUser(nextUser);
        const settings = loadUserSettings(nextUser.uid);
        setSearchLimit(settings.dashboardSearchLimit);
      } else {
        router.push('/login');
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  useLayoutEffect(() => {
    if (checkingAuth || !scopeRef.current) return;

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline
        .fromTo(
          "[data-hero-glow]",
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 1.1 },
          0
        )
        .fromTo(
          "[data-hero-copy]",
          { opacity: 0, y: 34 },
          { opacity: 1, y: 0, duration: 0.9 },
          0.1
        )
        .fromTo(
          "[data-hero-art]",
          { opacity: 0, x: 36, scale: 1.08 },
          { opacity: 1, x: 0, scale: 1, duration: 1.1 },
          0.18
        )
        .fromTo(
          "[data-dashboard-surface]",
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.72, stagger: 0.08 },
          0.28
        );

      gsap.to("[data-hero-art]", {
        yPercent: -3,
        xPercent: 1.5,
        duration: 6.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to("[data-hero-glow]", {
        scale: 1.04,
        duration: 7.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, scopeRef);

    return () => context.revert();
  }, [checkingAuth]);

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
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(218,239,255,0.9),_rgba(255,255,255,0.82)_32%,_#fff_65%)]">
        <div role="status">
          <svg aria-hidden="true" className="h-8 w-8 animate-spin text-slate-200 fill-[#4f46e5]" viewBox="0 0 100 101">
            <path d="M100 50.5908C100 78.2051..." fill="currentColor" />
            <path d="M93.9676 39.0409C96.393..." fill="currentFill" />
          </svg>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div ref={scopeRef} className="dashboard-shell relative flex min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(218,239,255,0.9),_rgba(255,255,255,0.82)_32%,_#fff_65%)] text-slate-950 xl:h-screen">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="relative flex min-h-screen flex-1 flex-col xl:h-screen xl:min-h-0">
        <motion.header
          variants={revealUp}
          initial="hidden"
          animate="visible"
          className="border-b border-white/60 bg-white/60 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="dashboard-card-border flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu size={22} />
              </button>

              <div className="relative w-full md:w-[500px]">
                <div className="dashboard-card-border flex h-14 items-center rounded-[22px] bg-white/90 px-5 backdrop-blur-sm">
                  <Search className="h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="ml-3 flex-1 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 sm:flex">
                    <Command className="h-4 w-4" />
                    <span>K</span>
                  </div>
                </div>

                <AnimatePresence>
                  {searchTerm.trim() && (
                    <motion.div
                      className="dashboard-card-border-strong absolute left-0 right-0 top-16 z-30 max-h-72 overflow-auto rounded-[22px] bg-white/95 p-2 backdrop-blur-sm"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.99 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      {searchResults.length === 0 ? (
                        <p className="px-3 py-3 text-sm text-slate-500">No projects match your search.</p>
                      ) : (
                        searchResults.map((project) => (
                          <button
                            key={project.id ?? project.name}
                            type="button"
                            onClick={() => project.id && router.push(`/projects/${project.id}`)}
                            className="flex w-full flex-col rounded-[18px] px-4 py-3 text-left transition hover:bg-slate-50"
                          >
                            <span className="truncate text-sm font-semibold text-slate-950">{project.name}</span>
                            <span className="truncate text-xs text-slate-500">{project.description || "No description"}</span>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={() => router.push('/settings')}
              variants={revealUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.08 }}
              className="ml-auto flex items-center gap-3 rounded-full bg-transparent px-1 py-1 transition hover:bg-slate-100"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="User Avatar"
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1f2937_0%,#475569_100%)] text-sm font-bold text-white">
                  {getInitials(user)}
                </div>
              )}
              <ChevronDown className="h-4 w-4 text-slate-500" />
            </motion.button>
          </div>
        </motion.header>

        <motion.div
          variants={pageStagger}
          initial="hidden"
          animate="visible"
          className="flex flex-1 flex-col gap-5 px-4 pb-5 pt-3 sm:px-6 lg:px-8 xl:min-h-0 xl:flex-row xl:gap-6 xl:overflow-hidden"
        >
          <section className="min-w-0 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
            <motion.div
              variants={revealSoft}
              className="dashboard-card-border relative overflow-hidden rounded-[28px] bg-[linear-gradient(113deg,#e4f3ff_0%,#f8f6ff_44%,#efe9ff_100%)] px-0"
            >
              <div
                data-hero-glow
                className="pointer-events-none absolute -left-8 top-2 h-24 w-24 rounded-full bg-[radial-gradient(circle,_rgba(255,255,255,0.8)_0%,_rgba(255,255,255,0)_70%)] blur-2xl"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-[56%] bg-gradient-to-r from-white/55 via-white/14 to-transparent" />
              <div
                data-hero-art
                className="pointer-events-none absolute inset-y-0 right-0 w-[52%] overflow-hidden"
              >
                <img
                  src="/dashboard-intro.svg"
                  alt=""
                  className="absolute bottom-0 right-0 h-full w-full object-cover object-right-bottom"
                />
              </div>
              <div
                data-hero-copy
                className="relative z-10 max-w-[500px] px-6 py-6 sm:px-8 sm:py-7"
              >
                <p className="text-[1.7rem] font-extrabold leading-[1.14] tracking-[-0.04em] text-slate-950 sm:text-[2.15rem]">
                  Think deeper. Plan sharper.
                  <br />
                  Flow with <span className="text-[#5a50ff]">Novaq</span>
                </p>
                <p className="mt-2 text-[13px] text-slate-600 sm:text-sm">Stay focused. Get things done.</p>
              </div>
            </motion.div>

            <motion.div
              variants={revealUp}
              data-dashboard-surface
              className="mt-6 flex items-center justify-between gap-3"
            >
              <h1 className="text-[1.2rem] font-bold tracking-[-0.02em] text-slate-950">Recent projects</h1>
              <button
                type="button"
                onClick={() => router.push('/projects')}
                className="text-sm font-semibold text-[#4f46e5] transition hover:text-[#4338ca]"
              >
                View all
              </button>
            </motion.div>

            <motion.div variants={revealUp} data-dashboard-surface className="mt-4">
              <RecentProjects limit={6} emptyMessage="Go ahead and create a project" />
            </motion.div>

            <motion.div variants={revealUp} data-dashboard-surface className="mt-6">
              <Motivation />
            </motion.div>
          </section>

          <motion.aside
            variants={revealSoft}
            data-dashboard-surface
            className="w-full xl:w-[350px] xl:flex-none xl:min-h-0 xl:overflow-y-auto"
          >
            <RightSideBar />
          </motion.aside>
        </motion.div>
      </main>

      <AddProjectModal
        isOpen={isModalOpen}
        onClose={closeModal}
        user={user}
      />
    </div>
  );
}
