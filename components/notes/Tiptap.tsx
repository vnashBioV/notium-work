"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Toolbar } from "./ToolBar";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import {
  BookOpenText,
  Clapperboard,
  Clock3,
  Drama,
  FileText,
  Logs,
  Map,
  ScrollText,
  Sparkles,
  Users,
  Volume2,
} from "lucide-react";

const storyBlocks = [
  {
    label: "Full synopsis",
    icon: Sparkles,
    content:
      "<h2>Full Story Synopsis</h2><p><strong>Premise:</strong> Summarize the core story in 2-4 sentences.</p><p><strong>Beginning:</strong> How does the story open?</p><p><strong>Middle escalation:</strong> What complications raise the stakes?</p><p><strong>Climax:</strong> What is the final confrontation or turning point?</p><p><strong>Resolution:</strong> What changes after everything is over?</p>",
  },
  {
    label: "Character bio",
    icon: Users,
    content:
      "<h2>Character Background</h2><p><strong>Name:</strong> </p><p><strong>Role:</strong> </p><p><strong>Backstory:</strong> </p><p><strong>Motivation:</strong> </p><p><strong>Fear / flaw:</strong> </p><p><strong>Arc:</strong> </p>",
  },
  {
    label: "Timeline",
    icon: Clock3,
    content:
      "<h2>Timeline of Major Events</h2><ol><li>Inciting incident</li><li>First major discovery</li><li>Midpoint reversal</li><li>Big loss / dark turn</li><li>Final confrontation</li><li>Aftermath</li></ol>",
  },
  {
    label: "Environment",
    icon: Map,
    content:
      "<h2>Environmental Storytelling Ideas</h2><ul><li>Destroyed space that hints at a past conflict</li><li>Wall markings or symbols that reveal culture</li><li>Prop placement that implies what happened here</li><li>Lighting / weather cue that reinforces mood</li><li>Hidden clue that rewards exploration</li></ul>",
  },
  {
    label: "Journal entry",
    icon: ScrollText,
    content:
      "<h2>Journal Entry</h2><p><strong>Author:</strong> </p><p><strong>Date / time:</strong> </p><p><strong>State of mind:</strong> </p><p>Write the entry in-character here.</p>",
  },
  {
    label: "Voice log",
    icon: Volume2,
    content:
      "<h2>Voice Log Script</h2><p><strong>Speaker:</strong> </p><p><strong>Location:</strong> </p><p><strong>Tone:</strong> </p><p><strong>Transcript:</strong></p><p>[Start writing the spoken log here.]</p>",
  },
  {
    label: "Object lore",
    icon: FileText,
    content:
      "<h2>Object Description</h2><p><strong>Object name:</strong> </p><p><strong>Visual detail:</strong> </p><p><strong>Narrative meaning:</strong> </p><p><strong>Where it is found:</strong> </p><p><strong>Why the player should care:</strong> </p>",
  },
  {
    label: "Ending",
    icon: Clapperboard,
    content:
      "<h2>Final Ending Sequence</h2><p><strong>Trigger:</strong> What causes the ending to begin?</p><p><strong>Cinematic beats:</strong></p><ol><li>Opening image</li><li>Emotional payoff</li><li>Final choice / reveal</li><li>Last line or final shot</li></ol><p><strong>Player feeling to leave with:</strong> </p>",
  },
  {
    label: "Scene beat",
    icon: Drama,
    content:
      "<h2>Scene Beat</h2><p><strong>Goal:</strong> </p><p><strong>Conflict:</strong> </p><p><strong>Turn:</strong> </p><ul><li>Opening image</li><li>Escalation</li><li>Cliffhanger / payoff</li></ul>",
  },
];

export default function Tiptap({
  content,
  onChange,
  variant = "default",
}: {
  content: string;
  onChange: (richText: string) => void;
  variant?: "default" | "story";
}) {
  const isStory = variant === "story";
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false, // disable built-ins
      }),
      Heading.configure({
        HTMLAttributes: {
          class: "text-xl font-bold",
          levels: [2],
        },
      }),
      BulletList,
      OrderedList,
      ListItem, 
    ],
    content,
    editorProps: {
      attributes: {
        class:
          isStory
            ? "rounded-xl min-h-[220px] mt-3 outline-none bg-[#fffdf8] p-3 text-[14px] leading-7 text-[#3f3122]"
            : "rounded-md min-h-[150px] mt-3 outline-none bg-back p-2",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="relative flex flex-col h-full">
      {isStory ? (
        <div className="rounded-[16px] border border-[#f2d7a6] bg-[linear-gradient(180deg,#fff8ea_0%,#fffdf7_100%)] p-3 text-[#6f4f1f]">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
            <BookOpenText className="h-4 w-4" />
            Story room
          </div>
          <div className="flex flex-wrap gap-2">
            {storyBlocks.map(({ label, icon: Icon, content: blockContent }) => (
              <button
                key={label}
                type="button"
                data-note-editor-control="true"
                onClick={() => editor?.chain().focus().insertContent(blockContent).run()}
                className="inline-flex items-center gap-2 rounded-full border border-[#edd3a3] bg-white/85 px-3 py-2 text-[11px] font-semibold text-[#7c581f] transition hover:bg-[#fff6df]"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#8a6a3b]">
            Build synopsis, character backstories, timelines, environmental storytelling, journals, voice logs, object lore, and endings directly inside the note.
          </p>
        </div>
      ) : null}

      <div className={`sticky z-10 ${isStory ? "top-2 mt-3 rounded-xl bg-[#fffaf0] px-2 py-1" : "top-4 bg-white"}`}>
        <Toolbar editor={editor} />
      </div>

      <div className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 ${isStory ? "mt-1 rounded-xl bg-[#fffdf8]" : ""}`}>
        <EditorContent editor={editor} className="min-h-[200px]" />
      </div>
    </div>
  );
}
