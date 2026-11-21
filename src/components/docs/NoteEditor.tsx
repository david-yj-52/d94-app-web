"use client";

import {useState} from "react";
import NoteMarkdown from "./NoteMarkdown";

interface NoteEditorProps {
    initialTitle: string;
    initialContent: string;
    saving?: boolean;
    onSave: (title: string, content: string) => void;
    onCancel: () => void;
}

/** 제목 + Markdown 본문 편집. Ctrl/Cmd+S 저장, 미리보기 토글. */
export default function NoteEditor({initialTitle, initialContent, saving, onSave, onCancel}: NoteEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [preview, setPreview] = useState(false);
    const save = () => onSave(title, content);
    return (
        <div className="flex h-full flex-col gap-3"
             onKeyDown={(e) => {
                 if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                     e.preventDefault();
                     save();
                 }
             }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="제목"
                   className="h-10 rounded-lg border border-slate-200 px-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            {preview
                ? <div className="min-h-[50vh] flex-1 overflow-y-auto rounded-lg border border-slate-200 p-4">
                    <NoteMarkdown content={content} existing={new Set()} onOpenTitle={() => undefined}/>
                </div>
                : <textarea value={content} onChange={(e) => setContent(e.target.value)} aria-label="본문"
                            placeholder={"# 생각을 적어 보세요\n\n[[다른 노트]] 로 링크, #태그, - [ ] 할 일"}
                            className="min-h-[50vh] flex-1 resize-none rounded-lg border border-slate-200 p-3 font-mono text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-blue-500"/>}
            <div className="flex items-center gap-2">
                <button type="button" onClick={save} disabled={saving}
                        className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                    {saving ? "저장 중…" : "저장"}
                </button>
                <button type="button" onClick={onCancel} className="h-10 rounded-lg px-4 text-sm text-slate-600 hover:bg-slate-50">취소</button>
                <button type="button" onClick={() => setPreview((v) => !v)} className="ml-auto h-8 rounded-lg px-3 text-xs text-slate-500 hover:bg-slate-50">
                    {preview ? "편집" : "미리보기"}
                </button>
                <span className="text-xs text-slate-400">⌘S 저장</span>
            </div>
        </div>
    );
}
