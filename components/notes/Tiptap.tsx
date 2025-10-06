"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Toolbar } from "./ToolBar";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";

export default function Tiptap({
  content,
  onChange,
}: {
  content: string;
  onChange: (richText: string) => void;
}) {
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
          "rounded-md min-h-[150px] mt-3 outline-none bg-back p-2",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="relative flex flex-col h-full">
      {/* Sticky Toolbar */}
      <div className="sticky top-4 z-10 bg-white">
        <Toolbar editor={editor} />
      </div>

      {/* Scrollable Editor */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <EditorContent editor={editor} className="min-h-[200px]" />
      </div>
    </div>
  );
}
