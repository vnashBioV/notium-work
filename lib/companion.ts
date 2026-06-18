import type { CompanionTask, ProjectCompanionState } from "@/app/types/projects";

const stopWords = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "i",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "our",
  "that",
  "the",
  "this",
  "to",
  "we",
  "with",
  "you",
]);

const capitalize = (value: string) =>
  value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);

const toTaskId = () => `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const extractFocus = (prompt: string) => {
  const cleaned = prompt
    .replace(/[\r\n]+/g, " ")
    .replace(/[^\w\s-]/g, " ")
    .toLowerCase();
  const words = cleaned
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !stopWords.has(word));

  const unique = Array.from(new Set(words)).slice(0, 3);
  return unique.length > 0 ? unique.join(" ") : "this request";
};

const detectPriority = (prompt: string): CompanionTask["priority"] => {
  if (/\b(urgent|asap|immediately|critical|today)\b/i.test(prompt)) return "high";
  if (/\b(later|eventually|someday|nice to have)\b/i.test(prompt)) return "low";
  return "medium";
};

const buildSummary = (prompt: string, focus: string) => {
  const compact = prompt.trim().replace(/\s+/g, " ");
  if (compact.length <= 140) return compact;
  return `Manual execution plan for ${focus}.`;
};

export const buildCompanionPlan = (prompt: string, existingTasks: CompanionTask[] = []): ProjectCompanionState => {
  const trimmed = prompt.trim();
  const now = new Date().toISOString();
  const focus = extractFocus(trimmed);
  const priority = detectPriority(trimmed);

  const newTasks: CompanionTask[] = [
    {
      id: toTaskId(),
      title: `Clarify the outcome for ${focus}`,
      detail: "Confirm scope, constraints, and what finished work should look like.",
      status: "todo",
      priority,
      createdAt: now,
    },
    {
      id: toTaskId(),
      title: `Prepare the materials for ${focus}`,
      detail: "Collect links, files, notes, and approvals required before execution.",
      status: "todo",
      priority: priority === "low" ? "low" : "medium",
      createdAt: now,
    },
    {
      id: toTaskId(),
      title: `Execute the manual work for ${focus}`,
      detail: "Carry out the actual task in the smallest verifiable steps.",
      status: "todo",
      priority,
      createdAt: now,
    },
    {
      id: toTaskId(),
      title: `Review and close out ${focus}`,
      detail: "Check the result, document what changed, and note any follow-up.",
      status: "todo",
      priority: "medium",
      createdAt: now,
    },
  ];

  return {
    latestPrompt: trimmed,
    summary: buildSummary(trimmed, focus),
    status: "ready",
    tasks: [...newTasks, ...existingTasks],
    updatedAt: now,
  };
};

export const getCompanionProgress = (tasks: CompanionTask[] = []) => {
  if (tasks.length === 0) return 0;
  const complete = tasks.filter((task) => task.status === "done").length;
  return Math.round((complete / tasks.length) * 100);
};

export const getCompanionCounts = (tasks: CompanionTask[] = []) => ({
  todo: tasks.filter((task) => task.status === "todo").length,
  doing: tasks.filter((task) => task.status === "doing").length,
  done: tasks.filter((task) => task.status === "done").length,
});
