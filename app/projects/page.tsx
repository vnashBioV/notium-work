'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpenDot, FolderPlus, Home } from 'lucide-react';
import { useProjects } from "@/context/ProjectsContext";

export default function ProjectsPage() {
  const { projects } = useProjects();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 8;

  const totalPages = Math.ceil(projects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;
  const currentProjects = projects.slice(startIndex, endIndex);

  return (
    <div className='w-full min-h-screen'>
      <div className='flex w-full flex-wrap items-center gap-2 p-4 sm:p-6'>
        <div onClick={() => router.push('/dashboard')} className='text-gray-400 cursor-pointer flex items-center'>
          <Home size={18} className="mr-3"/>
          Home
        </div>
        <h1 className='px-4 text-black'>|</h1>
        <div className='text-bold text-black flex items-center'>
          <FolderPlus size={16} className="mr-3"/>
          Projects
        </div>
      </div>
      <div className="flex min-h-[calc(100vh-88px)] flex-col items-center justify-center p-4 sm:p-6">
        {projects.length === 0 ? (
          <FolderOpenDot className="w-10 h-10 text-gray-400" />
        ) : (
          <>
            <div className="grid w-full max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {currentProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="cursor-pointer flex flex-col p-6 rounded-xl transition-transform transform hover:scale-105 shadow-md"
                  style={{ backgroundColor: project.backgroundColour || '#4D3BED' }}
                >
                  <h3 className="text-lg font-bold text-white truncate w-full">{project.name}</h3>
                  <p className="text-white text-sm overflow-hidden text-ellipsis whitespace-nowrap w-full mt-1">
                    {project.description || "No description"}
                  </p>
                  <div className="w-[70px] h-[70px] mt-3 flex items-center justify-center bg-white rounded-lg">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        className="object-cover w-full h-full rounded-lg"
                        width={512}
                        height={512}
                        alt={project.name}
                      />
                    ) : (
                      <FolderOpenDot className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bullet Pagination */}
            <div className="flex justify-center items-center gap-3 mt-6">
              {Array.from({ length: totalPages }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    currentPage === index + 1
                      ? 'bg-[#4D3BED] scale-125'
                      : 'bg-gray-300 hover:bg-[#4D3BED] hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
