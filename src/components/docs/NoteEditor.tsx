"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import CodeMirror, {EditorView} from "@uiw/react-codemirror";
import {markdown, markdownLanguage} from "@codemirror/lang-markdown";
import {languages} from "@codemirror/language-data";
import {autocompletion, type CompletionContext, type CompletionResult} from "@codemirror/autocomplete";
import {editorTheme, livePreview, markdownStyle} from "./livePreview";
import {type SaveState, useNoteAutosave} from "./useNoteAutosave";
import {loadDraft, type NoteDraft} from "@/lib/docs/drafts";
import {shrinkImage} from "@/lib/docs/image";
import type {Note} from "@/types/docs";
import Button from "@/components/ui/Button";

interface NoteEditorProps {
    note: Note;
    /** [[ 뒤 입력으로 노트 제목 후보를 가져온다 (useNoteTitleFetcher) */
    fetchTitles: (prefix: string) => Promise<string[]>;
    /** 이미지 Blob 을 올리고 본문에 넣을 주소를 돌려준다 */
    uploadImage: (blob: Blob) => Promise<string>;
    onError: (message: string) => void;
    /** "완료": 남은 입력을 저장한 뒤 부른다 */
    onDone: () => void;
}

/** [[ 입력 직후의 제목 접두어를 찾아 후보를 낸다. 고르면 "제목]]" 으로 닫는다 */
export function wikilinkCompletion(fetchTitles: (prefix: string) => Promise<string[]>) {
    return async (ctx: CompletionContext): Promise<CompletionResult | null> => {
        const m = ctx.matchBefore(/\[\[[^\]\n|#]*$/);
        if (!m) return null;
        const titles = await fetchTitles(m.text.slice(2));
        return {from: m.from + 2, options: titles.map((t) => ({label: t, apply: `${t}]]`, type: "text"})), validFor: /^[^\]\n|#]*$/};
    };
}

const STATE_LABEL: Record<SaveState, string> = {
    saved: "저장됨",
    pending: "입력 중…",
    saving: "저장 중…",
    offline: "서버에 저장하지 못함 — 이 브라우저에 보관 중, 곧 다시 시도",
    conflict: "다른 곳에서 먼저 수정됨 — 새로고침하면 지금 내용을 초안으로 복원할 수 있습니다",
    error: "저장 거절됨 — 내용을 확인하세요",
};

/**
 * Obsidian 처럼 쓰는 노트 편집기: CodeMirror Live Preview(입력 즉시 Markdown 스타일, 커서 밖 줄은 기호 숨김·이미지 표시),
 * 자동 저장(1.5초) + IndexedDB 초안, 이미지 붙여넣기, [[ 제목 자동완성. 제목은 입력란을 떠나거나 Enter 때 저장(이름 변경은 링크 치환을 부르므로).
 */
export default function NoteEditor({note, fetchTitles, uploadImage, onError, onDone}: NoteEditorProps) {
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [draft, setDraft] = useState<NoteDraft | null>(null);
    const committedTitle = useRef(note.title);
    const {state, change, flush} = useNoteAutosave(note, onError);
    const uploadRef = useRef(uploadImage);
    uploadRef.current = uploadImage;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    // 서버에 없는 초안이 남아 있으면 복원을 제안
    useEffect(() => {
        void loadDraft(note.id).then((d) => {
            if (d && (d.content !== note.content || d.title !== note.title)) setDraft(d);
        });
    }, [note.id]); // 처음 열 때 한 번만 (note.content 변화에는 다시 묻지 않음)

    const extensions = useMemo(() => [
        markdown({base: markdownLanguage, codeLanguages: languages}),
        markdownStyle,
        livePreview,
        editorTheme,
        EditorView.lineWrapping,
        autocompletion({override: [wikilinkCompletion(fetchTitles)]}),
        EditorView.domEventHandlers({
            paste: (event, view) => {
                const files = [...(event.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
                if (files.length === 0) return false;
                event.preventDefault();
                for (const file of files) {
                    const token = `![업로드 중…](uploading-${crypto.randomUUID()})`;
                    view.dispatch(view.state.replaceSelection(token + "\n"));
                    const replaceToken = (text: string) => {
                        const at = view.state.doc.toString().indexOf(token);
                        if (at >= 0) view.dispatch({changes: {from: at, to: at + token.length, insert: text}});
                    };
                    shrinkImage(file).then((b) => uploadRef.current(b))
                        .then((url) => replaceToken(`![이미지](${url})`))
                        .catch((e: unknown) => {
                            replaceToken("");
                            onErrorRef.current(e instanceof Error ? e.message : "이미지를 올리지 못했습니다.");
                        });
                }
                return true;
            },
        }),
    ], [fetchTitles]);

    const commitTitle = () => {
        const t = title.trim();
        if (!t || t === committedTitle.current) return setTitle(committedTitle.current);
        committedTitle.current = t;
        change(t, content);
        void flush();
    };

    return (
        <div className="flex h-full flex-col gap-3"
             onKeyDown={(e) => {
                 if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                     e.preventDefault();
                     void flush();
                 }
             }}>
            {draft && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800" role="status">
                    <span className="flex-1">저장되지 않은 초안이 있습니다 ({new Date(draft.savedAt).toLocaleString("ko-KR")}).</span>
                    <Button variant="unstyled" type="button" className="h-8 rounded-lg bg-amber-600 px-3 text-xs font-medium text-white hover:bg-amber-700"
                            onClick={() => {
                                setTitle(draft.title);
                                setContent(draft.content);
                                committedTitle.current = draft.title;
                                change(draft.title, draft.content);
                                setDraft(null);
                            }}>복원</Button>
                    <Button variant="unstyled" type="button" className="h-8 rounded-lg px-3 text-xs text-amber-800 hover:bg-amber-100" onClick={() => setDraft(null)}>버리기</Button>
                </div>
            )}
            <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={commitTitle} aria-label="제목"
                   onKeyDown={(e) => e.key === "Enter" && (e.currentTarget.blur())}
                   className="h-10 rounded-lg border border-slate-200 px-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-d94-brand"/>
            <div className="min-h-[50vh] flex-1 overflow-hidden rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-d94-brand">
                <CodeMirror value={content} extensions={extensions} height="100%" minHeight="50vh" aria-label="본문"
                            onChange={(v) => {
                                setContent(v);
                                change(committedTitle.current, v);
                            }}
                            placeholder={"# 생각을 적어 보세요\n\n[[ 로 노트 링크, #태그, - [ ] 할 일, 이미지는 붙여넣기"}
                            basicSetup={{lineNumbers: false, foldGutter: false, highlightActiveLine: false}}/>
            </div>
            <div className="flex items-center gap-3">
                <Button type="button" disabled={state === "saving"}
                        onClick={() => void flush().then((ok) => ok && onDone())}
                        className="font-medium">완료</Button>
                <span aria-live="polite"
                      className={`text-xs ${state === "offline" || state === "conflict" || state === "error" ? "text-red-500" : "text-slate-400"}`}>
                    {STATE_LABEL[state]}
                </span>
                <span className="ml-auto text-xs text-slate-400">자동 저장 · ⌘S 바로 저장 · [[ 링크 · 이미지 붙여넣기</span>
            </div>
        </div>
    );
}
