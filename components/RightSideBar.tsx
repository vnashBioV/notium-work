"use client";

import React from 'react'
import { motion } from 'framer-motion';
import { Clock3, Paperclip, Plus } from 'lucide-react';
import { useModal } from "@/context/ModalContext";
import { useProjects } from "@/context/ProjectsContext";
import { useRouter } from 'next/navigation';

const RightSideBar = () => {
    const { openModal } = useModal();
    const { projects } = useProjects();
    const router = useRouter();

    const finishedProjects = projects.filter((project) => project.status === "completed").length;
    const inProgressProjects = projects.filter((project) => project.status === "in-progress").length;
    const totalHours = projects.reduce(
      (sum, project) => sum + Number(project.timeSpentOnProject ?? 0),
      0
    );
    const overviewProjects = projects.slice(0, 2);
    const weeklyHours = totalHours;
    const formatHours = (value: number) => {
      const safe = Number(value || 0);
      if (safe <= 0) return "0m";
      if (safe < 1) return `${Math.max(1, Math.round(safe * 60))}m`;
      return `${safe.toFixed(1)}h`;
    };
    const railStagger = {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.08,
        },
      },
    };
    const railReveal = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    };

    return (
        <motion.div variants={railStagger} initial="hidden" animate="visible" className="flex h-full w-full flex-col gap-4">
            <motion.button
                variants={railReveal}
                whileHover={{ boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)" }}
                type="button"
                className="group flex items-center justify-center gap-2 rounded-[22px] bg-white/72 p-3 text-base font-semibold text-white shadow-sm transition"
                onClick={openModal}
            >
                <span className="flex w-full items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#5b45ff_0%,#4f46e5_100%)] px-5 py-3">
                    <Plus size={17} className="mr-2 text-white" />
                    Add project
                </span>
            </motion.button>

            <motion.section variants={railReveal} className="rounded-[24px] bg-white/78 p-5 shadow-sm">
                <h2 className="text-[1.1rem] font-bold tracking-[-0.02em] text-slate-950">Overview</h2>
                <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm text-slate-600">
                        <span>Finished projects</span>
                        <span className="font-semibold text-slate-950">{finishedProjects}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm text-slate-600">
                        <span>Projects in progress</span>
                        <span className="font-semibold text-slate-950">{inProgressProjects}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm text-slate-600">
                        <span>Overall project time</span>
                        <span className="font-semibold text-slate-950">{formatHours(totalHours)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>This week</span>
                        <span className="font-semibold text-slate-950">{formatHours(weeklyHours)}</span>
                    </div>
                </div>
            </motion.section>

            <motion.section variants={railReveal} className="rounded-[24px] bg-white/78 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="text-[1.1rem] font-bold tracking-[-0.02em] text-slate-950">My tasks</h2>
                </div>

                <div className="mt-4 space-y-3">
                    {overviewProjects.length === 0 ? (
                      <div className='w-full rounded-[18px] bg-slate-50/80 p-4 text-sm text-slate-500'>
                        No project data yet.
                      </div>
                    ) : (
                      overviewProjects.map((project) => {
                        const isCompleted = project.status === "completed";
                        const statusDot = project.status === "in-progress" ? "bg-sky-500" : isCompleted ? "bg-emerald-500" : "bg-amber-500";
                        const statusLabel = project.status ? project.status.replace("-", " ") : "Not Started";
                        const attachmentsCount = project.attachments?.length ?? 0;
                        const projectHours = Number(project.timeSpentOnProject ?? 0);

                        return (
                          <motion.button
                            initial={{ opacity: 0, y: 14 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.4 }}
                            transition={{ duration: 0.45 }}
                            whileHover={{ boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)" }}
                            key={project.id ?? project.name}
                            type="button"
                            onClick={() => project.id && router.push(`/projects/${project.id}`)}
                            className='flex w-full flex-col gap-3 rounded-[18px] bg-white/85 p-4 text-left transition'
                          >
                            <div className='flex items-start justify-between gap-3'>
                              <div className='min-w-0'>
                                <p className='truncate text-[15px] font-bold tracking-[-0.02em] text-slate-950'>{project.name}</p>
                                <p className='mt-1 truncate text-[13px] text-slate-500'>{project.description || "No description"}</p>
                              </div>
                              <div className='flex items-center gap-2 pl-2 text-xs font-medium text-slate-500'>
                                <div className={`h-2.5 w-2.5 rounded-full ${statusDot}`}></div>
                                <p className='whitespace-nowrap'>{statusLabel}</p>
                                <span className={`h-4 w-4 rounded-[5px] border ${isCompleted ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'}`}></span>
                              </div>
                            </div>
                            <div className='flex items-center justify-between gap-3 text-[13px] text-slate-500'>
                              <div className='flex items-center gap-2'><Clock3 size={14}/><p>{formatHours(projectHours)}</p></div>
                              <div className='flex items-center gap-2'><Paperclip size={14}/><p>{attachmentsCount} attachments</p></div>
                            </div>
                          </motion.button>
                        );
                      })
                    )}
                </div>

                <button
                  type="button"
                  className="mt-5 w-full text-center text-sm font-semibold text-[#4f46e5] transition hover:text-[#4338ca]"
                  onClick={() => router.push('/projects')}
                >
                  View all tasks
                </button>
            </motion.section>
        </motion.div>
    )
}

export default RightSideBar
