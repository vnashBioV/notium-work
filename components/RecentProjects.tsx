import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/context/ProjectsContext";
import { FolderOpenDot } from "lucide-react";
import { useRouter } from 'next/navigation';

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";

const RecentProjects = () => {
    const { projects } = useProjects();

    const router = useRouter();

    return (
        <div className="overflow-hidden">
        {projects.length === 0 ? (
            <div className="!h-[228px] !w-[187px] p-6 flex flex-col text-center items-center justify-center rounded-xl bg-gray-100 text-gray-500">
            <div className="w-[50%] h-[50%] text-center">
                <img
                src="/empty-box.png"
                className="object-cover"
                width={512}
                height={512}
                alt="empty"
                />
            </div>
            <p>Go ahead and create a project</p>
            </div>
        ) : (
            <Swiper
            modules={[Autoplay]}
            slidesPerView="auto"
            spaceBetween={16}
            loop={true}
            freeMode={true}
            allowTouchMove={false}
            speed={5000}
            autoplay={{
                delay: 0,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            }}
            className="w-full"
            >
            {projects.map((project, i) => (
                <SwiperSlide
                key={i}
                className="!h-[228px] cursor-pointer !w-[187px] flex-shrink-0 rounded-xl p-6"
                style={{ backgroundColor: project.backgroundColour }}
                onClick={() => router.push(`/dashboard/${project.id}`)}
                >
                {/* title */}
                <h3 className="text-lg font-bold text-white truncate w-full">
                    {project.name}
                </h3>

                {/* description */}
                <p className="text-white text-sm overflow-hidden text-ellipsis whitespace-nowrap w-full">
                    {project.description || "No description"}
                </p>

                {/* project image */}
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
        </div>
    );
};

export default RecentProjects;
