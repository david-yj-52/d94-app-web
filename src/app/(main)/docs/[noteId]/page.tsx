"use client";

import {Suspense, useState} from "react";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {FolderInput, GitBranch, Pencil, SquareKanban, Trash2} from "lucide-react";
import NoteEditor from "@/components/docs/NoteEditor";
import NoteMarkdown from "@/components/docs/NoteMarkdown";
import NoteSidePanel from "@/components/docs/NoteSidePanel";
import NoteVersionHistory from "@/components/docs/NoteVersionHistory";
import FolderPickerModal from "@/components/docs/FolderPickerModal";
import DocsDialog, {type DocsDialogSpec} from "@/components/docs/DocsDialog";
import DeriveModal from "@/components/docs/DeriveModal";
import PromoteToCiraModal from "@/components/docs/PromoteToCiraModal";
import {useIssueTypes, usePromoteNoteToCira} from "@/hooks/useCiraDocs";
import {useProjects} from "@/hooks/useProjects";
import {useOpenNote} from "@/components/docs/useOpenNote";
import {useBacklinks, useChangeNoteKind, useDeriveNote, usePromoteDocsTask, useSetDocsTaskStatus, useDeleteNote, useDocsFolders, useMoveNote, useNote, useNotes, useNoteTitleFetcher, useNoteVersions, useInvalidateDocs, useUploadDocsImage} from "@/hooks/useDocs";
import {useToast} from "@/components/ui/Toast";
import {Skeleton} from "@/components/ui/Skeleton";
import {docsError} from "@/lib/docs/error";
import type {NoteKind, NoteVersion} from "@/types/docs";
import {KIND_LABEL, KINDS} from "@/lib/docs/markdown";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

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
    // 파생·이동 대상은 이 노트의 vault 안에서만 (링크·계보가 vault 단위)
    const derived = useNotes({origin: note.data?.title, vaultId: note.data?.vaultId}, !!note.data);
    const folders = useDocsFolders(note.data?.vaultId ?? "ALL");
    const [mode, setMode] = useState<"view" | "edit">(search.get("edit") ? "edit" : "view");
    const [showVersions, setShowVersions] = useState(false);
    const [preview, setPreview] = useState<NoteVersion | null>(null);
    const [moving, setMoving] = useState(false);
    const [dialog, setDialog] = useState<DocsDialogSpec | null>(null);
    const [deriving, setDeriving] = useState(false);
    const [promoting, setPromoting] = useState(false);
    // 등록 창의 프로젝트·타입 선택지 (캐시는 CIRA 화면과 공유)
    const projects = useProjects();
    const issueTypes = useIssueTypes();
    const toCira = usePromoteNoteToCira();
    const changeKind = useChangeNoteKind(noteId);
    const derive = useDeriveNote(noteId);
    const setTask = useSetDocsTaskStatus();
    const promote = usePromoteDocsTask();
    const versions = useNoteVersions(showVersions ? noteId : null);
    const uploadImage = useUploadDocsImage();
    const invalidate = useInvalidateDocs();
    const move = useMoveNote();
    const remove = useDeleteNote();
    const openNote = useOpenNote();
    const fetchTitles = useNoteTitleFetcher();
    const {show, ToastComponent} = useToast();

    if (note.isLoading) return <Skeleton className="h-96"/>;
    if (!note.data) return <EmptyState className="text-slate-500">노트를 찾을 수 없습니다.</EmptyState>;
    const n = note.data;
    const existing = new Set(n.links.filter((l) => l.exists).map((l) => l.title));
    const folderPath = (() => {
        const byId = new Map((folders.data ?? []).map((f) => [f.id, f]));
        const parts: string[] = [];
        for (let id = n.folderId; id; id = byId.get(id)?.parentId ?? null) parts.unshift(byId.get(id)?.name ?? "…");
        return parts.join(" / ") || "/";
    })();
    const open = (t: string) => openNote(t, n.folderId, n.vaultId).catch((e) => show(docsError(e, "노트를 열지 못했습니다."), "error"));

    return (
        <div className="flex flex-col gap-4 lg:flex-row">
            <article className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4 md:p-6 lg:h-[calc(100vh-7.5rem)] lg:overflow-y-auto">
                {mode === "edit" ? (
                    <NoteEditor note={n} fetchTitles={fetchTitles}
                                uploadImage={uploadImage.mutateAsync}
                                onError={(m) => show(m, "error")}
                                onDone={() => {
                                    setMode("view");
                                    invalidate();
                                    router.replace(`/docs/${noteId}`);
                                }}/>
                ) : (
                    <>
                        <div className="mb-4 flex flex-wrap items-start gap-2 border-b border-slate-100 pb-3">
                            <div className="min-w-0 basis-full flex-1 sm:basis-auto">
                                <p className="text-xs text-slate-400">{folderPath}</p>
                                <h1 className="truncate text-xl font-semibold md:text-2xl md:font-bold text-slate-900">{preview ? `${preview.title} (v${preview.version})` : n.title}</h1>
                            </div>
                            {preview ? (
                                <Button variant="unstyled" type="button" onClick={() => setPreview(null)} className="h-8 rounded-lg px-3 text-xs text-d94-brand hover:bg-d94-brand-soft">현재 버전으로</Button>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <select value={n.kind} aria-label="종류 (승격)" disabled={changeKind.isPending}
                                            onChange={(e) => changeKind.mutate(e.target.value as NoteKind, {onError: (er) => show(docsError(er, "종류를 바꾸지 못했습니다."), "error")})}
                                            className="h-8 rounded-lg border border-slate-200 px-2 text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-d94-brand">
                                        {KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                                    </select>
                                    <IconButton label="파생 노트 만들기" onClick={() => setDeriving(true)}><GitBranch className="h-4 w-4"/></IconButton>
                                    <IconButton label="CIRA Task로 등록" onClick={() => setPromoting(true)}><SquareKanban className="h-4 w-4"/></IconButton>
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
            <div className="w-full shrink-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 lg:w-64 lg:h-[calc(100vh-7.5rem)]">
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
            {promoting && (
                <PromoteToCiraModal noteTitle={n.title} saving={toCira.isPending} onClose={() => setPromoting(false)}
                                    projects={(projects.data ?? []).map((p) => ({id: p.id, label: `[${p.key}] ${p.name}`}))}
                                    issueTypes={(issueTypes.data ?? []).map((t) => ({id: t.id, label: t.typeNm}))}
                                    onSubmit={({projectId, issueTypeId, title, spaceId}) => toCira.mutate({projectId, noteId: n.id, issueTypeId, title, spaceId}, {
                                        onSuccess: (issue) => {
                                            setPromoting(false);
                                            router.push(`/cira/projects/${projectId}/issues/${issue.id}`);
                                        },
                                        onError: (e) => show(docsError(e, "CIRA Task로 등록하지 못했습니다."), "error"),
                                    })}/>
            )}
            {ToastComponent}
        </div>
    );
}

function IconButton({label, onClick, children}: { label: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <Button variant="unstyled" type="button" onClick={onClick} aria-label={label} title={label}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 md:h-8 md:w-8 hover:bg-slate-100">
            {children}
        </Button>
    );
}
