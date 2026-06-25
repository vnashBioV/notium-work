"use client"

import {type Editor} from "@tiptap/react";
import {
    Bold,
    Pilcrow,
    Italic,
    List,
    ListOrdered,
    Redo2,
    Underline as UnderlineIcon,
    Undo2,
    Heading2,
} from "lucide-react";
import {Toggle} from "../ui/toggle";

type Props = {
    editor : Editor | null
}

export function Toolbar ({ editor }: Props){
    if (!editor){
        return null
    }
    return (
        <div className="tiptap-toolbar bg-transparent rounded text-[#cfcfcf] flex flex-wrap gap-1 p-1">
            <button
                type="button"
                className="inline-flex h-8 min-w-8 items-center justify-center rounded px-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().chain().focus().undo().run()}
                title="Undo"
            >
                <Undo2 className="h-4 w-4" />
            </button>
            <button
                type="button"
                className="inline-flex h-8 min-w-8 items-center justify-center rounded px-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().chain().focus().redo().run()}
                title="Redo"
            >
                <Redo2 className="h-4 w-4" />
            </button>
            <div className="mx-1 h-5 w-px bg-gray-200" />
            <Toggle
                size="sm"
                className="cursor-pointer"
                pressed={editor.isActive("paragraph")}
                onPressedChange={() =>
                editor.chain().focus().setParagraph().run()
                }
            >
                <Pilcrow className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                className="cursor-pointer"
                pressed={editor.isActive("heading", { level: 2 })}
                onPressedChange={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
            >
                <Heading2 className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                className="cursor-pointer"
                pressed={editor.isActive("bold")}
                onPressedChange={() =>
                editor.chain().focus().toggleBold().run()
                }
            >
                <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                className="cursor-pointer"
                pressed={editor.isActive("italic")}
                onPressedChange={() =>
                editor.chain().focus().toggleItalic().run()
                }
            >
                <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                className="cursor-pointer"
                pressed={editor.isActive("underline")}
                onPressedChange={() =>
                editor.chain().focus().toggleUnderline().run()
                }
            >
                <UnderlineIcon className="h-4 w-4" />
            </Toggle>
            <div className="mx-1 h-5 w-px bg-gray-200" />
            <Toggle
                size="sm"
                className="cursor-pointer"
                pressed={editor.isActive("bulletList")}
                onPressedChange={() =>
                editor.chain().focus().toggleBulletList().run()
                }
            >
                <List className="h-4 w-4" />
            </Toggle>
            <Toggle
                size="sm"
                className="cursor-pointer"
                pressed={editor.isActive("orderedList")}
                onPressedChange={() =>
                editor.chain().focus().toggleOrderedList().run()
                }
            >
                <ListOrdered className="h-4 w-4" />
            </Toggle>
        </div>
        
    )
}
