"use client";

import {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import DocsSidebar from "@/components/docs/DocsSidebar";
import FolderPickerModal from "@/components/docs/FolderPickerModal";
import QuickSwitcher from "@/components/docs/QuickSwitcher";
import DocsDialog, {type DocsDialogSpec} from "@/components/docs/DocsDialog";
import {useOpenNote} from "@/components/docs/useOpenNote";
import {useCreateDocsFolder, useDeleteDocsFolder, useDocsFolders, useMoveDocsFolder, useNotes, useRenameDocsFolder} from "@/hooks/useDocs";
import {useToast} from "@/components/ui/Toast";
import {Skeleton} from "@/components/ui/Skeleton";
import type {DocsFolder} from "@/types/docs";
import {docsError} from "@/lib/docs/error";

/** Docs 3단 레이아웃의 왼쪽(폴더 트리)과 Cmd+K. 가운데·오른쪽은 각 page 가 그린다. */
export default function DocsLayout({children}: { children: React.ReactNode }) {
    const params = useParams<{ noteId?: string }>();
    const folders = useDocsFolders();
    const notes = useNotes();
    const openNote = useOpenNote();
    const createFolder = useCreateDocsFolder();
    const renameFolder = useRenameDocsFolder();
    const deleteFolder = useDeleteDocsFolder();
    const moveFolder = useMoveDocsFolder();
    const {show, ToastComponent} = useToast();
    const [switcher, setSwitcher] = useState(false);
    const [moving, setMoving] = useState<DocsFolder | null>(null);
    const [dialog, setDialog] = useState<DocsDialogSpec | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setSwitcher(true);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const fail = (fallback: string) => (e: unknown) => show(docsError(e, fallback), "error");
    const descendants = (id: string): Set<string> => {
        const out = new Set([id]);
        for (let grew = true; grew;) {
            grew = false;
            for (const f of folders.data ?? []) if (f.parentId && out.has(f.parentId) && !out.has(f.id)) out.add(f.id), grew = true;
        }
        return out;
    };

    return (
        <div className="mx-auto flex max-w-[1400px] gap-4 px-4">
            <div className="w-60 shrink-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 lg:h-[calc(100vh-7.5rem)]">
                <button type="button" onClick={() => setSwitcher(true)}
                        className="mb-3 flex h-8 w-full items-center rounded-lg bg-slate-50 px-2 text-left text-xs text-slate-400 hover:bg-slate-100">
                    노트 찾기 <span className="ml-auto">⌘K</span>
                </button>
                {folders.isLoading || notes.isLoading ? <Skeleton className="h-40"/> : (
                    <DocsSidebar
                        folders={folders.data ?? []} notes={notes.data ?? []} selectedNoteId={params.noteId ?? null}
                        onNewNote={(folderId) => setDialog({
                            title: "새 노트", input: {placeholder: "노트 제목"}, confirmLabel: "만들기",
                            onConfirm: (title) => openNote(title, folderId).catch(fail("노트를 만들지 못했습니다.")),
                        })}
                        onNewFolder={(parentId) => setDialog({
                            title: "새 폴더", input: {placeholder: "폴더 이름"}, confirmLabel: "만들기",
                            onConfirm: (name) => createFolder.mutate({name, parentId}, {onError: fail("폴더를 만들지 못했습니다.")}),
                        })}
                        onRenameFolder={(f) => setDialog({
                            title: "폴더 이름 변경", input: {initial: f.name}, confirmLabel: "변경",
                            onConfirm: (name) => name !== f.name && renameFolder.mutate({id: f.id, name}, {onError: fail("이름을 바꾸지 못했습니다.")}),
                        })}
                        onDeleteFolder={(f) => setDialog({
                            title: "폴더 삭제", message: `"${f.name}" 폴더를 삭제할까요? 비어 있는 폴더만 삭제됩니다.`, confirmLabel: "삭제", danger: true,
                            onConfirm: () => deleteFolder.mutate(f.id, {onError: fail("폴더를 삭제하지 못했습니다.")}),
                        })}
                        onMoveFolder={setMoving}
                    />
                )}
            </div>
            <div className="min-w-0 flex-1">{children}</div>
            {switcher && <QuickSwitcher onClose={() => setSwitcher(false)}
                                        onOpenTitle={(t) => openNote(t).catch(fail("노트를 열지 못했습니다."))}/>}
            {moving && (
                <FolderPickerModal title={`"${moving.name}" 폴더 이동`} folders={folders.data ?? []} initial={moving.parentId}
                                   disabledIds={descendants(moving.id)} onClose={() => setMoving(null)}
                                   onPick={(parentId) => {
                                       moveFolder.mutate({id: moving.id, parentId}, {onError: fail("폴더를 옮기지 못했습니다.")});
                                       setMoving(null);
                                   }}/>
            )}
            {dialog && <DocsDialog spec={dialog} onClose={() => setDialog(null)}/>}
            {ToastComponent}
        </div>
    );
}
