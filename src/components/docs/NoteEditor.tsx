"use client";

import {useMemo, useState} from "react";
import CodeMirror, {EditorView} from "@uiw/react-codemirror";
import {markdown} from "@codemirror/lang-markdown";
import {autocompletion, type CompletionContext, type CompletionResult} from "@codemirror/autocomplete";
import NoteMarkdown from "./NoteMarkdown";

interface NoteEditorProps {
    initialTitle: string;
    initialContent: string;
    saving?: boolean;
    onSave: (title: string, content: string) => void;
    onCancel: () => void;
    /** [[ 뒤 입력으로 노트 제목 후보를 가져온다 (useNoteTitleFetcher) */
    fetchTitles: (prefix: string) => Promise<string[]>;
}

/** [[ 입력 직후의 제목 접두어를 찾아 후보를 낸다. 고르면 "제목]]" 으로 닫는다 */
export function wikilinkCompletion(fetchTitles: (prefix: string) => Promise<string[]>) {
    return async (ctx: CompletionContext): Promise<CompletionResult | null> => {
        const m = ctx.matchBefore(/\[\[[^\]\n|#]*$/);
        if (!m) return null;
        const prefix = m.text.slice(2);
        const titles = await fetchTitles(prefix);
        return {
            from: m.from + 2,
            options: titles.map((t) => ({label: t, apply: `${t}]]`, type: "text"})),
            validFor: /^[^\]\n|#]*$/,
        };
    };
}

/** 제목 + CodeMirror Markdown 편집(줄바꿈, [[ 자동완성). Ctrl/Cmd+S 저장, 미리보기 토글. */
export default function NoteEditor({initialTitle, initialContent, saving, onSave, onCancel, fetchTitles}: NoteEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [preview, setPreview] = useState(false);
    const extensions = useMemo(() => [
        markdown(),
        EditorView.lineWrapping,
        autocompletion({override: [wikilinkCompletion(fetchTitles)]}),
    ], [fetchTitles]);
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
                : <div className="min-h-[50vh] flex-1 overflow-hidden rounded-lg border border-slate-200 text-sm focus-within:ring-2 focus-within:ring-blue-500">
                    <CodeMirror value={content} onChange={setContent} extensions={extensions} height="100%" minHeight="50vh"
                                placeholder={"# 생각을 적어 보세요\n\n[[ 로 노트 링크, #태그, - [ ] 할 일"}
                                basicSetup={{lineNumbers: false, foldGutter: false, highlightActiveLine: false}}
                                aria-label="본문"/>
                </div>}
            <div className="flex items-center gap-2">
                <button type="button" onClick={save} disabled={saving}
                        className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                    {saving ? "저장 중…" : "저장"}
                </button>
                <button type="button" onClick={onCancel} className="h-10 rounded-lg px-4 text-sm text-slate-600 hover:bg-slate-50">취소</button>
                <button type="button" onClick={() => setPreview((v) => !v)} className="ml-auto h-8 rounded-lg px-3 text-xs text-slate-500 hover:bg-slate-50">
                    {preview ? "편집" : "미리보기"}
                </button>
                <span className="text-xs text-slate-400">⌘S 저장 · [[ 링크 자동완성</span>
            </div>
        </div>
    );
}
