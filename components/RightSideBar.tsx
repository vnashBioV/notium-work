"use client";

import React from 'react'
import { Plus, Clock, Paperclip } from 'lucide-react';
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

    return (
        <div className="flex h-full w-full flex-col gap-6 rounded-lg p-5 sm:p-6 shadow-lg">
            {/* add project */}
            <div 
                className='relative flex cursor-pointer items-center justify-center rounded-xl bg-[#4D3BED] px-10 py-2 text-white'
                onClick={openModal}
            >
                <p className='absolute left-4'><Plus size={20} className='text-white'/></p>
                <p>Add project</p>
            </div>
            <div className='flex justify-between items-center border-b border-[#e0e0e0] pb-2'>
                <p>Finished projects</p>
                <p>{finishedProjects}</p>
            </div>
            <div className='flex justify-between items-center border-b border-[#e0e0e0] pb-2'>
                <p>Projects in progress</p>
                <p>{inProgressProjects}</p>
            </div>
            <div className='flex justify-between items-center border-b border-[#e0e0e0] pb-2'>
                <p>Overall project time</p>
                <p>{totalHours}h</p>
            </div>

            {/* projects over view */}
            <div className='text-sm'>
                <p>Over view</p>
            </div>
            {overviewProjects.length === 0 ? (
              <div className='w-full rounded-xl border border-[#e0e0e0] p-3 text-sm text-gray-500'>
                No project data yet.
              </div>
            ) : (
              overviewProjects.map((project) => {
                const isCompleted = project.status === "completed";
                const statusDot = project.status === "in-progress" ? "bg-blue-500" : isCompleted ? "bg-green-500" : "bg-yellow-600";
                const statusLabel = project.status ? project.status.replace("-", " ") : "not started";
                const attachmentsCount = project.attachments?.length ?? 0;
                const projectHours = Number(project.timeSpentOnProject ?? 0);

                return (
                  <div
                    key={project.id ?? project.name}
                    onClick={() => project.id && router.push(`/projects/${project.id}`)}
                    className='w-full flex flex-col gap-2 rounded-xl border border-[#e0e0e0] p-2 hover:bg-gray-50'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='min-w-0'>
                        <p className='truncate'>{project.name}</p>
                        <p className='truncate text-xs text-gray-500'>{project.description || "No description"}</p>
                      </div>
                      <div className='ml-2 flex flex-row items-center gap-2 text-xs capitalize'>
                        <div className={`h-[8px] w-[8px] rounded-full ${statusDot}`}></div>
                        <p>{statusLabel}</p>
                        <input type="checkbox" checked={isCompleted} readOnly className='m-0 p-0' />
                      </div>
                    </div>
                    <div className='flex items-center justify-between text-xs'>
                      <div className='flex flex-row items-center gap-1'><Clock size={12}/><p>{projectHours}h</p></div>
                      <div className='flex flex-row items-center gap-1'><Paperclip size={12}/><p>{attachmentsCount} attachments</p></div>
                    </div>
                  </div>
                );
              })
            )}
        </div>
    )
}

export default RightSideBar
