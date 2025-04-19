'use client'

import {useEditor, EditorContent} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Toolbar } from "./ToolBar";

export default function Tiptap ({
  content,
  onChange
}: {
  content: string
  onChange: (richText: string) => void
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure()],
    content: content,
    editorProps: {
      attributes:{
        class: 
          "rounded-md min-h-[150px] mt-3 outline-none bg-back"
      },
    },
    onUpdate({editor}){
      onChange(editor.getHTML())
      console.log(editor.getHTML())
    }
  })
  return (
    <div className="flex flex-col justify-stretch min-h-[250px]">
      <Toolbar editor={editor}/>
      <EditorContent editor={editor}/>
    </div>
  )
}