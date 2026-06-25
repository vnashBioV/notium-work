"use client";

import React from "react";
import { motion } from "framer-motion";
import { useProjects } from "@/context/ProjectsContext";
import type { Project } from "@/context/ProjectsContext";
import { Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getProjectVisual } from "@/lib/projectVisuals";

type RecentProjectsProps = {
  projects?: Project[];
  emptyMessage?: string;
  limit?: number;
};

const cardGrid = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};
const cardReveal = {
  hidden: { opacity: 0, y: 24, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const RecentProjects = ({ projects: incomingProjects, emptyMessage, limit = 8 }: RecentProjectsProps) => {
  const { projects: contextProjects } = useProjects();
  const projects = (incomingProjects ?? contextProjects).slice(0, limit);
  const router = useRouter();

  const formatHours = (value: number) => {
    const safe = Number(value || 0);
    if (safe <= 0) return "0m";
    if (safe < 1) return `${Math.max(1, Math.round(safe * 60))}m`;
    return `${safe.toFixed(1)}h`;
  };

  return (
    <div className="relative">
      {projects.length === 0 ? (
        <div className="dashboard-card-border flex h-[200px] w-full max-w-[260px] flex-col items-center justify-center rounded-[24px] bg-white/70 p-6 text-center text-slate-500 sm:h-[220px]">
          <div className="h-[50%] w-[50%] text-center">
            <img
              src="/empty-box.png"
              className="object-cover"
              width={512}
              height={512}
              alt="empty"
            />
          </div>
          <p>{emptyMessage ?? "Go ahead and create a project"}</p>
        </div>
      ) : (
        <motion.div variants={cardGrid} initial="hidden" animate="visible" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {projects.map((project, i) => {
            const { icon: Icon, accentClass } = getProjectVisual(project.name);

            return (
              <motion.button
                variants={cardReveal}
                whileHover={{ boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)" }}
                whileTap={{ scale: 0.992 }}
                key={project.id ?? i}
                type="button"
                onClick={() => project.id && router.push(`/projects/${project.id}`)}
                className="dashboard-card-border group flex min-h-[188px] flex-col rounded-[24px] bg-white/72 p-4 text-left backdrop-blur-sm transition"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br ${accentClass}`}>
                  {project.imageUrl ? (
                    <img
                      src={project.imageUrl}
                      className="h-full w-full rounded-[16px] object-cover"
                      width={48}
                      height={48}
                      alt={project.name}
                    />
                  ) : (
                    <Icon className="h-6 w-6" />
                  )}
                </div>

                <h3 className="truncate text-base font-bold tracking-[-0.02em] text-slate-950">
                  {project.name}
                </h3>

                <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-slate-500">
                  {project.description || "No description"}
                </p>

                <div className="mt-auto flex items-center gap-2 border-t border-slate-100 pt-5 text-[13px] text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  <span>{formatHours(Number(project.timeSpentOnProject ?? 0))}</span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default RecentProjects;
