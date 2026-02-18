"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Scrollbar } from "swiper/modules";
import { useProjects } from "@/context/ProjectsContext";
import type { Project } from "@/context/ProjectsContext";
import { FolderOpenDot } from "lucide-react";
import { useRouter } from "next/navigation";

import "swiper/css";
import "swiper/css/scrollbar";

type RecentProjectsProps = {
  projects?: Project[];
  emptyMessage?: string;
  limit?: number;
};

const RecentProjects = ({ projects: incomingProjects, emptyMessage, limit = 8 }: RecentProjectsProps) => {
  const { projects: contextProjects } = useProjects();
  const projects = (incomingProjects ?? contextProjects).slice(0, limit);
  const router = useRouter();

  return (
    <div className="relative overflow-hidden">
      {projects.length === 0 ? (
        <div className="flex h-[200px] w-full max-w-[260px] flex-col items-center justify-center rounded-xl bg-gray-100 p-6 text-center text-gray-500 sm:h-[228px]">
          <div className="w-[50%] h-[50%] text-center">
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
        <Swiper
          modules={[Autoplay, Scrollbar]}
          slidesPerView="auto"
          spaceBetween={16}
          loop={true}
          freeMode={true}
          scrollbar={{ draggable: true, hide: true }} 
          allowTouchMove={true}
          speed={5000}
          autoplay={{
            delay: 0,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          className="w-full recent-projects-swiper"
        >
          {projects.map((project, i) => (
            <SwiperSlide
              key={project.id ?? i}
              className="!h-[220px] !w-[170px] cursor-pointer flex-shrink-0 rounded-xl p-5 sm:!h-[228px] sm:!w-[187px] sm:p-6"
              style={{ backgroundColor: project.backgroundColour }}
              onClick={() => project.id && router.push(`/projects/${project.id}`)}
            >
              <h3 className="text-lg font-bold text-white truncate w-full">
                {project.name}
              </h3>

              <p className="text-white text-sm overflow-hidden text-ellipsis whitespace-nowrap w-full">
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
            </SwiperSlide>
          ))}
        </Swiper>
      )}
      <style jsx global>{`
        .recent-projects-swiper .swiper-scrollbar {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
      `}</style>
    </div>
  );
};

export default RecentProjects;
