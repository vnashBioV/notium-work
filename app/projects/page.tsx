'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FolderOpenDot,
  FolderPlus,
  Grid2x2,
  Home,
  List,
  Plus,
  Search,
  ChevronDown,
} from 'lucide-react';
import AddProjectModal from '@/components/AddProjectModal';
import { useAuth } from '@/context/AuthContext';
import { useModal } from '@/context/ModalContext';
import { useProjects } from "@/context/ProjectsContext";
import { getProjectVisual } from "@/lib/projectVisuals";
import type { Project } from "@/context/ProjectsContext";

const folderTones = [
  {
    shell: 'bg-[linear-gradient(180deg,rgba(90,80,255,0.08)_0%,rgba(90,80,255,0.04)_100%)]',
    tab: 'bg-[#5a50ff]',
    icon: 'bg-[rgba(90,80,255,0.14)] text-[#5a50ff]',
  },
  {
    shell: 'bg-[linear-gradient(180deg,rgba(111,200,255,0.12)_0%,rgba(111,200,255,0.05)_100%)]',
    tab: 'bg-[#49b8ff]',
    icon: 'bg-[rgba(73,184,255,0.14)] text-[#49b8ff]',
  },
  {
    shell: 'bg-[linear-gradient(180deg,rgba(139,92,246,0.12)_0%,rgba(139,92,246,0.05)_100%)]',
    tab: 'bg-[#9b6dff]',
    icon: 'bg-[rgba(155,109,255,0.14)] text-[#9b6dff]',
  },
  {
    shell: 'bg-[linear-gradient(180deg,rgba(114,226,197,0.13)_0%,rgba(114,226,197,0.05)_100%)]',
    tab: 'bg-[#47d7b4]',
    icon: 'bg-[rgba(71,215,180,0.15)] text-[#22b893]',
  },
];

const formatDate = (value?: string | number | Date) => {
  if (!value) return 'Recently updated';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently updated';

  return `Updated ${date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  })}`;
};

const scopeOptions = ['All projects', 'In progress', 'Completed', 'Not started'] as const;
const typeOptions = ['All types', 'Product', 'Marketing', 'Study', 'Planning', 'Creative'] as const;

const inferProjectType = (project: Project): (typeof typeOptions)[number] => {
  const text = `${project.name} ${project.description ?? ''}`.toLowerCase();

  if (/(market|brand|social|campaign|sales|client|crm)/.test(text)) return 'Marketing';
  if (/(study|learn|course|book|note|doc|document|writing)/.test(text)) return 'Study';
  if (/(calendar|plan|schedule|time|track|goal|task|finance|budget)/.test(text)) return 'Planning';
  if (/(design|creative|media|video|content|game|art|palette)/.test(text)) return 'Creative';
  return 'Product';
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const { isModalOpen, openModal, closeModal } = useModal();
  const { projects } = useProjects();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [scopeFilter, setScopeFilter] = useState<(typeof scopeOptions)[number]>('All projects');
  const [typeFilter, setTypeFilter] = useState<(typeof typeOptions)[number]>('All types');
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const projectsPerPage = 8;

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const search = searchTerm.trim().toLowerCase();
      const matchesScope =
        scopeFilter === 'All projects' ||
        (scopeFilter === 'In progress' && project.status === 'in-progress') ||
        (scopeFilter === 'Completed' && project.status === 'completed') ||
        (scopeFilter === 'Not started' && (project.status === 'not-started' || !project.status));

      const inferredType = inferProjectType(project);
      const matchesType = typeFilter === 'All types' || inferredType === typeFilter;
      const matchesSearch =
        !search ||
        project.name.toLowerCase().includes(search) ||
        (project.description ?? '').toLowerCase().includes(search);

      return matchesScope && matchesType && matchesSearch;
    });
  }, [projects, scopeFilter, typeFilter, searchTerm]);

  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const currentProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * projectsPerPage;
    return filteredProjects.slice(startIndex, startIndex + projectsPerPage);
  }, [currentPage, filteredProjects]);

  useEffect(() => {
    setCurrentPage(1);
  }, [scopeFilter, typeFilter, searchTerm]);

  useEffect(() => {
    const closeMenus = () => {
      setScopeMenuOpen(false);
      setTypeMenuOpen(false);
    };

    window.addEventListener('click', closeMenus);
    return () => window.removeEventListener('click', closeMenus);
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(90,80,255,0.12),_transparent_28%),linear-gradient(180deg,#f6f8ff_0%,#f7fbff_100%)]">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2.5 text-slate-400 transition hover:text-slate-700"
          >
            <Home size={17} />
            Home
          </button>
          <span className="text-slate-300">/</span>
          <div className="inline-flex items-center gap-2.5 font-semibold text-slate-900">
            <FolderPlus size={16} className="text-[#5a50ff]" />
            Projects
          </div>
        </div>

        <section className="rounded-[34px] border border-white/70 bg-white/88 p-6 shadow-[0_24px_70px_rgba(82,94,128,0.10)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-[1.8rem] font-semibold tracking-[-0.04em] text-slate-950">Projects</h1>
                <p className="mt-2 text-sm text-slate-500">
                  Find all your personal and shared projects
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={openModal}
                  className="inline-flex items-center gap-2.5 rounded-[12px] bg-[linear-gradient(135deg,#5a50ff_0%,#4f46e5_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(90,80,255,0.28)] transition hover:translate-y-[-1px]"
                >
                  <Plus size={15} />
                  Create
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSearchOpen((open) => !open);
                    }}
                    className={`flex h-10 w-10 items-center justify-center rounded-[12px] border bg-white text-slate-500 shadow-[0_4px_12px_rgba(15,23,42,0.04)] transition hover:border-[#5a50ff]/30 hover:text-[#5a50ff] ${
                      searchOpen ? 'border-[#5a50ff]/30 text-[#5a50ff]' : 'border-slate-200'
                    }`}
                  >
                    <Search size={17} />
                  </button>
                  {searchOpen ? (
                    <input
                      autoFocus
                      type="text"
                      value={searchTerm}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search projects..."
                      className="h-10 w-[220px] rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#5a50ff]/40"
                    />
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`flex h-10 w-10 items-center justify-center rounded-[12px] transition ${
                    viewMode === 'grid'
                      ? 'bg-[rgba(90,80,255,0.1)] text-[#5a50ff]'
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <Grid2x2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex h-10 w-10 items-center justify-center rounded-[12px] transition ${
                    viewMode === 'list'
                      ? 'bg-[rgba(90,80,255,0.1)] text-[#5a50ff]'
                      : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <List size={16} />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setScopeMenuOpen((open) => !open);
                    setTypeMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-2.5 rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 shadow-[0_4px_12px_rgba(15,23,42,0.03)]"
                >
                  {scopeFilter}
                  <ChevronDown size={15} className={`transition-transform duration-200 ${scopeMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setTypeMenuOpen((open) => !open);
                    setScopeMenuOpen(false);
                  }}
                  className="inline-flex items-center gap-2.5 rounded-[12px] border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 shadow-[0_4px_12px_rgba(15,23,42,0.03)]"
                >
                  {typeFilter}
                  <ChevronDown size={15} className={`transition-transform duration-200 ${typeMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className="rounded-full border border-slate-200 bg-slate-50/80 px-4 py-2 text-sm font-medium text-slate-500">
                {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'}
              </div>
            </div>

            {scopeMenuOpen ? (
              <div className="flex flex-wrap gap-2">
                {scopeOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setScopeFilter(option);
                      setScopeMenuOpen(false);
                    }}
                    className={`rounded-full px-3 py-1.5 text-sm transition ${
                      scopeFilter === option
                        ? 'bg-[rgba(90,80,255,0.12)] text-[#5a50ff]'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}

            {typeMenuOpen ? (
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setTypeFilter(option);
                      setTypeMenuOpen(false);
                    }}
                    className={`rounded-full px-3 py-1.5 text-sm transition ${
                      typeFilter === option
                        ? 'bg-[rgba(90,80,255,0.12)] text-[#5a50ff]'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}

            {projects.length === 0 ? (
              <div className="flex min-h-[380px] flex-col items-center justify-center rounded-[26px] border border-dashed border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fafbff_100%)] text-center">
                <FolderOpenDot className="h-10 w-10 text-slate-300" />
                <p className="mt-4 text-base font-semibold text-slate-700">No projects yet</p>
                <p className="mt-2 text-sm text-slate-500">Create a project from the dashboard to start filling this workspace.</p>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[26px] border border-dashed border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fafbff_100%)] text-center">
                <FolderOpenDot className="h-10 w-10 text-slate-300" />
                <p className="mt-4 text-base font-semibold text-slate-700">No projects match these filters</p>
                <p className="mt-2 text-sm text-slate-500">Try a different project status or type.</p>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4' : 'flex flex-col gap-4'}>
                  {currentProjects.map((project, index) => {
                    const tone = folderTones[index % folderTones.length];
                    const { icon: Icon, accentClass } = getProjectVisual(project.name);

                    return (
                      <motion.button
                        key={project.id}
                        type="button"
                        initial={false}
                        whileHover={{ y: -4, scale: 1.01 }}
                        whileTap={{ scale: 0.992 }}
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className={`group rounded-[18px] border border-slate-200/80 p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.045)] transition ${tone.shell} ${
                          viewMode === 'grid' ? 'min-h-[174px]' : 'min-h-0'
                        }`}
                      >
                        <div className={`flex h-full ${viewMode === 'grid' ? 'flex-col' : 'items-center gap-5'}`}>
                          <div className={`flex items-start justify-between gap-3 ${viewMode === 'grid' ? '' : 'w-[72px] shrink-0'}`}>
                            <div className="relative h-11 w-11">
                              <div className={`absolute left-0 top-1 h-3.5 w-5 rounded-t-[5px] ${tone.tab} opacity-80`} />
                              <div className={`absolute bottom-0 left-0 flex h-8.5 w-10 items-center justify-center rounded-[8px] ${tone.icon}`}>
                                <div className={`flex h-6.5 w-6.5 items-center justify-center rounded-[7px] bg-gradient-to-br ${accentClass}`}>
                                  <Icon size={14} strokeWidth={2.2} />
                                </div>
                              </div>
                            </div>
                            {viewMode === 'grid' ? (
                              <div className="h-2.5 w-2.5 rounded-full bg-[#5a50ff]/30 transition group-hover:bg-[#5a50ff]" />
                            ) : null}
                          </div>

                          <div className={`min-w-0 ${viewMode === 'grid' ? 'mt-7' : 'flex-1'}`}>
                            <h3 className="line-clamp-2 text-[1rem] font-semibold leading-6 tracking-[-0.03em] text-slate-900">
                              {project.name}
                            </h3>
                            <p className="mt-1.5 line-clamp-2 text-[12px] leading-5 text-slate-400">
                              {formatDate(project.createdAt as string | number | Date | undefined)}
                            </p>
                          </div>

                          <p className={`${viewMode === 'grid' ? 'mt-auto pt-5' : 'mt-2'} text-[13px] leading-5 text-slate-500`}>
                            {project.description || 'Open this project to add notes, files, and progress updates.'}
                          </p>

                          {viewMode === 'list' ? (
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                              <span>{inferProjectType(project)}</span>
                              <span className="h-2.5 w-2.5 rounded-full bg-[#5a50ff]/30 transition group-hover:bg-[#5a50ff]" />
                            </div>
                          ) : null}
                        </div>
                      </motion.button>
                    );
                  })}

                  <motion.button
                    type="button"
                    initial={false}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.992 }}
                    onClick={openModal}
                    className={`flex items-center justify-center rounded-[18px] border border-dashed border-[#5a50ff]/25 bg-[rgba(90,80,255,0.025)] text-[#5a50ff] transition hover:bg-[rgba(90,80,255,0.05)] ${
                      viewMode === 'grid' ? 'min-h-[174px]' : 'min-h-[120px]'
                    }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#5a50ff]/35 bg-white">
                      <Plus size={20} />
                    </div>
                  </motion.button>
                </div>

                {totalPages > 1 ? (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    {Array.from({ length: totalPages }).map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setCurrentPage(index + 1)}
                        className={`h-3 w-3 rounded-full transition-all duration-200 ${
                          currentPage === index + 1
                            ? 'bg-[#5a50ff] scale-125'
                            : 'bg-slate-200 hover:bg-[#5a50ff] hover:scale-110'
                        }`}
                      />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
      </div>
      <AddProjectModal
        isOpen={isModalOpen}
        onClose={closeModal}
        user={user}
      />
    </div>
  );
}
