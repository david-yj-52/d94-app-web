"use client";

import {Suspense, useState} from "react";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {FolderInput, GitBranch, Pencil, Trash2} from "lucide-react";
import NoteEditor from "@/components/docs/NoteEditor";
import NoteMarkdown from "@/components/docs/NoteMarkdown";
import NoteSidePanel from "@/components/docs/NoteSidePanel";
import NoteVersionHistory from "@/components/docs/NoteVersionHistory";
import FolderPickerModal from "@/components/docs/FolderPickerModal";
import DocsDialog, {type DocsDialogSpec} from "@/components/docs/DocsDialog";
import DeriveModal from "@/components/docs/DeriveModal";
import {useOpenNote} from "@/components/docs/useOpenNote";
import {useBacklinks, useChangeNoteKind, useDeriveNote, usePromoteDocsTask, useSetDocsTaskStatus, useDeleteNote, useDocsFolders, useMoveNote, useNote, useNotes, useNoteVersions, useUpdateNote} from "@/hooks/useDocs";
import {useToast} from "@/components/ui/Toast";
import {Skeleton} from "@/components/ui/Skeleton";
import {docsError} from "@/lib/docs/error";
import type {NoteKind, NoteVersion} from "@/types/docs";
import {KIND_LABEL, KINDS} from "@/lib/docs/markdown";

/** 노트 화면: mode 하나로 보기·편집·버전 미리보기를 전환 (CIRA 위키와 같은 패턴). ?edit=1 이면 편집으로 연다 */
export default function NotePage() {
    return <Suspense><NoteContent/></Suspense>;
}

function NoteContent() {
    const {noteId} = useParams<{ noteId: string }>();
    const router = useRouter();
    const search = useSearchParams();
    const note = useNote(noteId);
    const backlinks = useBacklinks(noteId);
    const derived = useNotes(note.data ? {origin: note.data.title} : {origin: "\u0000"});
    const folders = useDocsFolders();
    const [mode, setMode] = useState<"view" | "edit">(search.get("edit") ? "edit" : "view");
    const [showVersions, setShowVersions] = useState(false);
    const [preview, setPreview] = useState<NoteVersion | null>(null);
    const [moving, setMoving] = useState(false);
    const [dialog, setDialog] = useState<DocsDialogSpec | null>(null);
    const [deriving, setDeriving] = useState(false);
    const changeKind = useChangeNoteKind(noteId);
    const derive = useDeriveNote(noteId);
    const setTask = useSetDocsTaskStatus();
    const promote = usePromoteDocsTask();
    const versions = useNoteVersions(showVersions ? noteId : null);
    const update = useUpdateNote(noteId);
    const move = useMoveNote();
    const remove = useDeleteNote();
    const openNote = useOpenNote();
    const {show, ToastComponent} = useToast();

    if (note.isLoading) return <Skeleton className="h-96"/>;
    if (!note.data) return <p className="p-8 text-center text-slate-500">노트를 찾을 수 없습니다.</p>;
    const n = note.data;
    const existing = new Set(n.links.filter((l) => l.exists).map((l) => l.title));
    const folderPath = (() => {
        const byId = new Map((folders.data ?? []).map((f) => [f.id, f]));
        const parts: string[] = [];
        for (let id = n.folderId; id; id = byId.get(id)?.parentId ?? null) parts.unshift(byId.get(id)?.name ?? "…");
        return parts.join(" / ") || "/";
    })();
    const open = (t: string) => openNote(t, n.folderId).catch((e) => show(docsError(e, "노트를 열지 못했습니다."), "error"));

    return (
        <div className="flex gap-4">
            <article className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-6 lg:h-[calc(100vh-7.5rem)] lg:overflow-y-auto">
                {mode === "edit" ? (
                    <NoteEditor initialTitle={n.title} initialContent={n.content} saving={update.isPending}
                                onCancel={() => setMode("view")}
                                onSave={(title, content) => update.mutate({title, content, version: n.version}, {
                                    onSuccess: () => {
                                        setMode("view");
                                        router.replace(`/docs/${noteId}`);
                                    },
                                    onError: (e) => show(docsError(e, "저장하지 못했습니다."), "error"),
                                })}/>
                ) : (
                    <>
                        <div className="mb-4 flex items-start gap-2 border-b border-slate-100 pb-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-slate-400">{folderPath}</p>
                                <h1 className="truncate text-2xl font-bold text-slate-900">{preview ? `${preview.title} (v${preview.version})` : n.title}</h1>
                            </div>
                            {preview ? (
                                <button type="button" onClick={() => setPreview(null)} className="h-8 rounded-lg px-3 text-xs text-blue-600 hover:bg-blue-50">현재 버전으로</button>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <select value={n.kind} aria-label="종류 (승격)" disabled={changeKind.isPending}
                                            onChange={(e) => changeKind.mutate(e.target.value as NoteKind, {onError: (er) => show(docsError(er, "종류를 바꾸지 못했습니다."), "error")})}
                                            className="h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                                    </select>
                                    <IconButton label="파생 노트 만들기" onClick={() => setDeriving(true)}><GitBranch className="h-4 w-4"/></IconButton>
                                    <IconButton label="편집" onClick={() => setMode("edit")}><Pencil className="h-4 w-4"/></IconButton>
                                    <IconButton label="폴더 이동" onClick={() => setMoving(true)}><FolderInput className="h-4 w-4"/></IconButton>
                                    <IconButton label="삭제" onClick={() => setDialog({
                                        title: "노트 삭제", message: `"${n.title}" 노트를 삭제할까요? 버전 이력도 함께 지워지고 되돌릴 수 없습니다.`,
                                        confirmLabel: "삭제", danger: true,
                                        onConfirm: () => remove.mutate(n.id, {
                                            onSuccess: () => router.push("/docs"),
                                            onError: (e) => show(docsError(e, "삭제하지 못했습니다."), "error"),
                                        }),
                                    })}><Trash2 className="h-4 w-4 text-red-500"/></IconButton>
                                </div>
                            )}
                        </div>
                        <NoteMarkdown content={preview ? preview.content : n.content} existing={existing} onOpenTitle={open}/>
                        {!preview && n.content.trim() === "" &&
                            <p className="text-sm text-slate-400">빈 노트입니다. 편집을 눌러 내용을 적어 보세요.</p>}
                    </>
                )}
            </article>
            <div className="hidden w-64 shrink-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 lg:block lg:h-[calc(100vh-7.5rem)]">
                {showVersions ? (
                    <NoteVersionHistory versions={versions.data ?? []} isLoading={versions.isLoading} selected={preview?.version ?? null}
                                        onPreview={(v) => {
                                            setMode("view");
                                            setPreview(v);
                                        }}
                                        onClose={() => {
                                            setShowVersions(false);
                                            setPreview(null);
                                        }}/>
                ) : (
                    <NoteSidePanel note={n} backlinks={backlinks.data ?? []} derived={derived.data ?? []}
                                   onOpenTitle={open} onShowVersions={() => setShowVersions(true)}
                                   onTaskStatus={(lineNo, status) => setTask.mutate({noteId: n.id, lineNo, status},
                                       {onError: (e) => show(docsError(e, "Task 를 바꾸지 못했습니다."), "error")})}
                                   onPromoteTask={(lineNo) => promote.mutate({noteId: n.id, lineNo}, {
                                       onSuccess: (created) => router.push(`/docs/${created.id}`),
                                       onError: (e) => show(docsError(e, "노트로 만들지 못했습니다."), "error"),
                                   })}/>
                )}
            </div>
            {moving && (
                <FolderPickerModal title={`"${n.title}" 노트 이동`} folders={folders.data ?? []} initial={n.folderId}
                                   onClose={() => setMoving(false)}
                                   onPick={(folderId) => {
                                       move.mutate({id: n.id, folderId}, {onError: (e) => show(docsError(e, "옮기지 못했습니다."), "error")});
                                       setMoving(false);
                                   }}/>
            )}
            {dialog && <DocsDialog spec={dialog} onClose={() => setDialog(null)}/>}
            {deriving && (
                <DeriveModal originTitle={n.title} saving={derive.isPending} onClose={() => setDeriving(false)}
                             onSubmit={(req) => derive.mutate(req, {
                                 onSuccess: (created) => {
                                     setDeriving(false);
                                     router.push(`/docs/${created.id}?edit=1`);
                                 },
                                 onError: (e) => show(docsError(e, "파생 노트를 만들지 못했습니다."), "error"),
                             })}/>
            )}
            {ToastComponent}
        </div>
    );
}

function IconButton({label, onClick, children}: { label: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button type="button" onClick={onClick} aria-label={label} title={label}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            {children}
        </button>
    );
}
