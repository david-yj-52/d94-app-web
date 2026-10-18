"use client";

import {EditorContent, useEditor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
    Bold,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Italic,
    List,
    ListOrdered,
    Minus,
    Strikethrough,
    TextQuote,
} from "lucide-react";
import {useState} from "react";

interface WikiEditorProps {
    initialTitle: string;
    initialContent: string;
    onSave: (title: string, content: string) => void;
    onCancel: () => void;
    isSaving?: boolean;
}

export default function WikiEditor({
                                       initialTitle,
                                       initialContent,
                                       onSave,
                                       onCancel,
                                       isSaving,
                                   }: WikiEditorProps) {
    const [title, setTitle] = useState(initialTitle);

    const editor = useEditor({
        extensions: [StarterKit],
        content: initialContent || "<p></p>",
        editorProps: {
            attributes: {
                class:
                    "min-h-[400px] px-4 py-3 focus:outline-none prose prose-slate max-w-none text-sm leading-relaxed",
            },
        },
    });

    function handleSave() {
        if (!editor) return;
        onSave(title, editor.getHTML());
    }

    if (!editor) return null;

    const ToolbarBtn = ({
                            active,
                            onClick,
                            title: btnTitle,
                            children,
                        }: {
        active?: boolean;
        onClick: () => void;
        title: string;
        children: React.ReactNode;
    }) => (
        <button
            type="button"
            title={btnTitle}
            onClick={onClick}
            className={[
                "p-1.5 rounded text-sm transition-colors",
                active
                    ? "bg-blue-100 text-blue-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
            ].join(" ")}
        >
            {children}
        </button>
    );

    return (
        <div className="flex flex-col h-full">
            {/* Title */}
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="페이지 제목"
                className="text-2xl font-bold text-slate-900 px-4 pt-4 pb-2 border-b border-slate-200 focus:outline-none w-full bg-transparent placeholder:text-slate-300"
            />

            {/* Toolbar */}
            <div className="flex items-center gap-0.5 px-4 py-2 border-b border-slate-200 flex-wrap">
                <ToolbarBtn
                    title="Bold"
                    active={editor.isActive("bold")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold size={14}/>
                </ToolbarBtn>
                <ToolbarBtn
                    title="Italic"
                    active={editor.isActive("italic")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic size={14}/>
                </ToolbarBtn>
                <ToolbarBtn
                    title="Strikethrough"
                    active={editor.isActive("strike")}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                    <Strikethrough size={14}/>
                </ToolbarBtn>
                <ToolbarBtn
                    title="Code"
                    active={editor.isActive("code")}
                    onClick={() => editor.chain().focus().toggleCode().run()}
                >
                    <Code size={14}/>
                </ToolbarBtn>
                <div className="w-px h-5 bg-slate-200 mx-1"/>
                <ToolbarBtn
                    title="H1"
                    active={editor.isActive("heading", {level: 1})}
                    onClick={() => editor.chain().focus().toggleHeading({level: 1}).run()}
                >
                    <Heading1 size={14}/>
                </ToolbarBtn>
                <ToolbarBtn
                    title="H2"
                    active={editor.isActive("heading", {level: 2})}
                    onClick={() => editor.chain().focus().toggleHeading({level: 2}).run()}
                >
                    <Heading2 size={14}/>
                </ToolbarBtn>
                <ToolbarBtn
                    title="H3"
                    active={editor.isActive("heading", {level: 3})}
                    onClick={() => editor.chain().focus().toggleHeading({level: 3}).run()}
                >
                    <Heading3 size={14}/>
                </ToolbarBtn>
                <div className="w-px h-5 bg-slate-200 mx-1"/>
                <ToolbarBtn
                    title="Bullet List"
                    active={editor.isActive("bulletList")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                >
                    <List size={14}/>
                </ToolbarBtn>
                <ToolbarBtn
                    title="Ordered List"
                    active={editor.isActive("orderedList")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                >
                    <ListOrdered size={14}/>
                </ToolbarBtn>
                <ToolbarBtn
                    title="Blockquote"
                    active={editor.isActive("blockquote")}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                >
                    <TextQuote size={14}/>
                </ToolbarBtn>
                <ToolbarBtn
                    title="Horizontal Rule"
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                >
                    <Minus size={14}/>
                </ToolbarBtn>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-y-auto">
                <EditorContent editor={editor}/>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-200">
                <button
                    onClick={handleSave}
                    disabled={isSaving || !title.trim()}
                    className="h-8 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? "저장 중..." : "저장"}
                </button>
                <button
                    onClick={onCancel}
                    className="h-8 px-4 rounded-md border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
                >
                    취소
                </button>
            </div>
        </div>
    );
}
