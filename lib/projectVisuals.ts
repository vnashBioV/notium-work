import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  BookOpen,
  Box,
  Briefcase,
  CalendarClock,
  Camera,
  Clock3,
  Code2,
  FileText,
  FolderKanban,
  Gamepad2,
  Megaphone,
  MessageSquareQuote,
  Palette,
  Rocket,
  Target,
  WalletCards,
} from "lucide-react";

type ProjectVisual = {
  icon: LucideIcon;
  accentClass: string;
  panelClass: string;
};

const visuals: ProjectVisual[] = [
  {
    icon: MessageSquareQuote,
    accentClass: "from-[#efe9ff] to-[#d8d0ff] text-[#6654ff]",
    panelClass: "bg-[linear-gradient(135deg,#efe9ff_0%,#d8d0ff_100%)] text-[#6654ff]",
  },
  {
    icon: Box,
    accentClass: "from-[#f2e7ff] to-[#e5d6ff] text-[#8c52ff]",
    panelClass: "bg-[linear-gradient(135deg,#f2e7ff_0%,#e5d6ff_100%)] text-[#8c52ff]",
  },
  {
    icon: Clock3,
    accentClass: "from-[#ecf9dd] to-[#dbf1ce] text-[#4f9b39]",
    panelClass: "bg-[linear-gradient(135deg,#ecf9dd_0%,#dbf1ce_100%)] text-[#4f9b39]",
  },
  {
    icon: Megaphone,
    accentClass: "from-[#ddfff5] to-[#cff3ea] text-[#20b486]",
    panelClass: "bg-[linear-gradient(135deg,#ddfff5_0%,#cff3ea_100%)] text-[#20b486]",
  },
  {
    icon: Code2,
    accentClass: "from-[#ffe7dc] to-[#ffd5ce] text-[#ff5f57]",
    panelClass: "bg-[linear-gradient(135deg,#ffe7dc_0%,#ffd5ce_100%)] text-[#ff5f57]",
  },
  {
    icon: Gamepad2,
    accentClass: "from-[#ffe5ee] to-[#ffd4df] text-[#e75480]",
    panelClass: "bg-[linear-gradient(135deg,#ffe5ee_0%,#ffd4df_100%)] text-[#e75480]",
  },
  {
    icon: AppWindow,
    accentClass: "from-[#e2f0ff] to-[#d3e6ff] text-[#2563eb]",
    panelClass: "bg-[linear-gradient(135deg,#e2f0ff_0%,#d3e6ff_100%)] text-[#2563eb]",
  },
  {
    icon: Palette,
    accentClass: "from-[#ffeccc] to-[#ffdca1] text-[#d97706]",
    panelClass: "bg-[linear-gradient(135deg,#ffeccc_0%,#ffdca1_100%)] text-[#d97706]",
  },
];

const keywordMap: Array<{ keywords: string[]; visual: ProjectVisual }> = [
  { keywords: ["testimonial", "review", "feedback"], visual: visuals[0] },
  { keywords: ["model", "3d", "asset", "cube"], visual: visuals[1] },
  { keywords: ["time", "track", "timer", "schedule"], visual: visuals[2] },
  { keywords: ["marketing", "campaign", "brand", "social"], visual: visuals[3] },
  { keywords: ["code", "app", "web", "site", "platform", "dashboard"], visual: visuals[4] },
  { keywords: ["game", "ember", "play"], visual: visuals[5] },
  { keywords: ["calendar", "plan"], visual: { ...visuals[2], icon: CalendarClock } },
  { keywords: ["media", "video", "youtube", "content"], visual: { ...visuals[5], icon: Camera } },
  { keywords: ["note", "doc", "document", "writing"], visual: { ...visuals[0], icon: FileText } },
  { keywords: ["client", "crm", "sales", "business"], visual: { ...visuals[3], icon: Briefcase } },
  { keywords: ["learn", "course", "study", "book"], visual: { ...visuals[7], icon: BookOpen } },
  { keywords: ["launch", "startup", "growth"], visual: { ...visuals[4], icon: Rocket } },
  { keywords: ["focus", "goal", "task"], visual: { ...visuals[2], icon: Target } },
  { keywords: ["finance", "budget", "money"], visual: { ...visuals[7], icon: WalletCards } },
];

const fallbackIcons: LucideIcon[] = [FolderKanban, AppWindow, Rocket, Target, FileText, Briefcase, Palette, Code2];

const hashName = (name: string) =>
  name.split("").reduce((total, char) => total + char.charCodeAt(0), 0);

export const getProjectVisual = (projectName?: string): ProjectVisual => {
  const normalized = (projectName ?? "").trim().toLowerCase();

  for (const entry of keywordMap) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.visual;
    }
  }

  const hash = hashName(normalized || "project");
  const visual = visuals[hash % visuals.length];
  const icon = fallbackIcons[hash % fallbackIcons.length];

  return {
    ...visual,
    icon,
  };
};
