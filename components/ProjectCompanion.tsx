"use client";

import { useMemo, useState } from "react";
import { Bot, CheckCircle2, ChevronDown, Circle, Loader2, Sparkles, Wand2 } from "lucide-react";
import type { CompanionTask, ProjectCompanionState } from "@/app/types/projects";
import { buildCompanionPlan, getCompanionCounts, getCompanionProgress } from "@/lib/companion";

interface ProjectCompanionProps {
  companion?: ProjectCompanionState;
  onChange: (next: ProjectCompanionState) => Promise<void>;
  className?: string;
}

const statusClasses: Record<CompanionTask["status"], string> = {
  todo: "border-gray-200 bg-white text-gray-700",
  doing: "border-[#D9D4FF] bg-[#F5F2FF] text-[#4D3BED]",
  done: "border-[#D6EFE0] bg-[#F3FBF6] text-[#1F7A45]",
};

const priorityClasses: Record<CompanionTask["priority"], string> = {
  high: "bg-[#4D3BED] text-white",
  medium: "bg-[#F1EEFF] text-[#4D3BED]",
  low: "bg-[#F4F4F5] text-[#52525B]",
};

export default function ProjectCompanion({ companion, onChange, className = "" }: ProjectCompanionProps) {
  const [prompt, setPrompt] = useState(companion?.latestPrompt ?? "");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const tasks = companion?.tasks ?? [];
  const progress = useMemo(() => getCompanionProgress(tasks), [tasks]);
  const counts = useMemo(() => getCompanionCounts(tasks), [tasks]);
  const activeTasks = tasks.filter((task) => task.status !== "done").slice(0, 3);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setSaving(true);
    try {
      await onChange(buildCompanionPlan(prompt, tasks));
      setExpanded(true);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (taskId: string, status: CompanionTask["status"]) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status,
            completedAt: status === "done" ? new Date().toISOString() : undefined,
          }
        : task
    );

    setSaving(true);
    try {
      await onChange({
        ...companion,
        status: "ready",
        tasks: updatedTasks,
        latestPrompt: prompt.trim() || companion?.latestPrompt,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`relative z-10 w-full rounded-[20px] bg-white/96 p-4 text-black shadow-[0_14px_40px_rgba(15,23,42,0.14)] sm:p-4 ${className}`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#4D3BED] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
              <Bot size={13} />
              Companion
            </div>
            <h2 className="text-[15px] font-semibold sm:text-base">Project companion</h2>
            <p className="mt-1 text-[13px] text-gray-600">
              Keep planning support nearby without taking over the workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="rounded-full bg-[#F5F2FF] px-3 py-2 text-[#4D3BED]">
              {counts.todo} queued
            </div>
            <div className="rounded-full bg-[#F5F2FF] px-3 py-2 text-[#4D3BED]">
              {counts.doing} doing
            </div>
            <div className="rounded-full bg-[#F5F2FF] px-3 py-2 text-[#4D3BED]">
              {progress}% done
            </div>
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700"
            >
              {expanded ? "Collapse" : "Expand"}
              <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {!expanded ? (
          <div className="grid gap-3">
            <div className="rounded-[18px] bg-[#FAFAFA] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4D3BED]">Latest prompt</p>
              <p className="mt-2 line-clamp-2 text-sm text-gray-700">
                {prompt.trim() || companion?.latestPrompt || "No prompt yet. Expand the companion when you want help organizing the next block of work."}
              </p>
              <p className="mt-3 text-xs text-gray-500">
                {companion?.summary || "No plan generated yet."}
              </p>
            </div>

            <div className="rounded-[18px] bg-[#FAFAFA] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Active queue</p>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-[#E5E7EB]">
                  <div className="h-full rounded-full bg-[#4D3BED]" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {activeTasks.length === 0 ? (
                <p className="text-sm text-gray-500">No active tasks. Expand the companion to create a plan.</p>
              ) : (
                <div className="space-y-2">
                  {activeTasks.map((task) => (
                    <div key={task.id} className="rounded-2xl bg-white px-3 py-2.5">
                      <div className="mb-1 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${priorityClasses[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${statusClasses[task.status]}`}>
                          {task.status}
                        </span>
                      </div>
                      <p className="truncate text-sm font-medium text-black">{task.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="rounded-[18px] bg-[#FAFAFA] p-4">
              <label htmlFor="companion-prompt" className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4D3BED]">
                <Sparkles size={16} />
                Companion prompt
              </label>
              <textarea
                id="companion-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Example: Prepare the onboarding docs, collect screenshots, and make sure the checklist is ready for handoff."
                className="min-h-[112px] w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm outline-none focus:border-[#4D3BED]"
              />
              <div className="mt-3 flex flex-col gap-3">
                <p className="text-xs text-gray-500">
                  {companion?.summary || "No plan generated yet. Create one to start tracking execution."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={saving || !prompt.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4D3BED] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                    Build plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpanded(false)}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700"
                  >
                    Minimize
                  </button>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col rounded-[18px] bg-[#FAFAFA] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Execution queue</h3>
                  <p className="mt-1 text-sm text-gray-600">{progress}% complete</p>
                </div>
                <div className="h-2 w-28 overflow-hidden rounded-full bg-[#E5E7EB]">
                  <div className="h-full rounded-full bg-[#4D3BED]" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white px-4 py-5 text-sm text-gray-500">
                  No tasks yet. Write a prompt and generate a plan.
                </div>
              ) : (
                <div className="max-h-[280px] space-y-3 overflow-y-auto pr-1">
                  {tasks.map((task) => (
                    <div key={task.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
                      <div className="flex flex-col gap-3">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${priorityClasses[task.priority]}`}>
                              {task.priority}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] ${statusClasses[task.status]}`}>
                              {task.status}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-black">{task.title}</p>
                          {task.detail ? <p className="mt-1 text-sm text-gray-600">{task.detail}</p> : null}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleStatusChange(task.id, "todo")}
                            disabled={saving}
                            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-700 disabled:opacity-50"
                          >
                            <Circle size={14} />
                            Queue
                          </button>
                          <button
                            onClick={() => handleStatusChange(task.id, "doing")}
                            disabled={saving}
                            className="inline-flex items-center gap-1 rounded-full border border-[#D9D4FF] px-3 py-1.5 text-xs text-[#4D3BED] disabled:opacity-50"
                          >
                            <Loader2 size={14} className={task.status === "doing" ? "animate-spin" : ""} />
                            Doing
                          </button>
                          <button
                            onClick={() => handleStatusChange(task.id, "done")}
                            disabled={saving}
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1.5 text-xs text-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle2 size={14} />
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
