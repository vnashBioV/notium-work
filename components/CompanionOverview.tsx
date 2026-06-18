"use client";

import { Bot, Sparkles } from "lucide-react";
import type { Project } from "@/context/ProjectsContext";
import { getCompanionCounts, getCompanionProgress } from "@/lib/companion";

interface CompanionOverviewProps {
  projects: Project[];
}

export default function CompanionOverview({ projects }: CompanionOverviewProps) {
  const projectsWithCompanion = projects.filter((project) => (project.companion?.tasks?.length ?? 0) > 0);
  const activeProjects = projectsWithCompanion.filter((project) =>
    (project.companion?.tasks ?? []).some((task) => task.status !== "done")
  );
  const totalTasks = projectsWithCompanion.flatMap((project) => project.companion?.tasks ?? []);
  const progress = getCompanionProgress(totalTasks);
  const counts = getCompanionCounts(totalTasks);

  return (
    <div className="overflow-hidden rounded-3xl border border-[#D8DEFF] bg-[linear-gradient(135deg,#F7F8FF,#EEF8F5)] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#1B1C3A] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
          <Bot size={13} />
          Companion
        </div>
        <Sparkles size={15} className="text-[#4D3BED]" />
      </div>
      <p className="text-sm font-semibold text-[#1B1C3A]">Manual work queue</p>
      <p className="mt-1 text-xs text-gray-600">
        {activeProjects.length} active project{activeProjects.length === 1 ? "" : "s"} using the companion
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-2xl bg-white/80 px-2 py-3">
          <p className="text-base font-semibold text-[#1B1C3A]">{counts.todo}</p>
          <p className="text-gray-500">Queued</p>
        </div>
        <div className="rounded-2xl bg-white/80 px-2 py-3">
          <p className="text-base font-semibold text-[#1B1C3A]">{counts.doing}</p>
          <p className="text-gray-500">Doing</p>
        </div>
        <div className="rounded-2xl bg-white/80 px-2 py-3">
          <p className="text-base font-semibold text-[#1B1C3A]">{counts.done}</p>
          <p className="text-gray-500">Done</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
          <span>Overall completion</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-[#4D3BED]" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
