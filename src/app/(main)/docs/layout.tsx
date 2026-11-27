"use client";

import {useEffect, useState} from "react";
import {useParams, usePathname} from "next/navigation";
import Link from "next/link";
import {FolderTree, ListChecks} from "lucide-react";
import DocsSidebar from "@/components/docs/DocsSidebar";
import FolderPickerModal from "@/components/docs/FolderPickerModal";
import QuickSwitcher from "@/components/docs/QuickSwitcher";
import DocsDialog, {type DocsDialogSpec} from "@/components/docs/DocsDialog";
import {useOpenNote} from "@/components/docs/useOpenNote";
import {useCreateDocsFolder, useDeleteDocsFolder, useDocsFolders, useDocsVaults, useMoveDocsFolder, useMoveNote, useNotes, useRenameDocsFolder} from "@/hooks/useDocs";
import {useToast} from "@/components/ui/Toast";
import Dialog from "@/components/ui/Dialog";
import {Skeleton} from "@/components/ui/Skeleton";
import type {DocsFolder, VaultScope} from "@/types/docs";
import {docsError} from "@/lib/docs/error";
import Button from "@/components/ui/Button";

/** Docs 3단 레이아웃의 왼쪽(vault 선택 + 폴더 트리)과 Cmd+K. 가운데·오른쪽은 각 page 가 그린다. */
export default function DocsLayout({children}: { children: React.ReactNode }) {
    const params = useParams<{ noteId?: string }>();
    // ponytail: vault 선택은 이 layout 상태만 (/docs 안에서 이동해도 유지, 새로고침하면 통합 뷰). 저장이 필요하면 URL 쿼리로
    const [scope, setScope] = useState<VaultScope>("ALL");
    const vaults = useDocsVaults();
    // 저장된 vault 를 더 이상 못 보면(프로젝트 탈퇴 등) 통합 뷰로
    const validScope = scope === "ALL" || vaults.data?.some((v) => v.id === scope) !== false ? scope : "ALL";
    const folders = useDocsFolders(validScope);
    const notes = useNotes({vaultId: validScope});
    const openNote = useOpenNote();
    const createFolder = useCreateDocsFolder();
    const renameFolder = useRenameDocsFolder();
    const deleteFolder = useDeleteDocsFolder();
    const moveFolder = useMoveDocsFolder();
    const moveNote = useMoveNote();
    const {show, ToastComponent} = useToast();
    const [switcher, setSwitcher] = useState(false);
    const [moving, setMoving] = useState<DocsFolder | null>(null);
    const [dialog, setDialog] = useState<DocsDialogSpec | null>(null);
    // 모바일(< lg) 폴더 트리 서랍. 화면을 옮기거나 다른 창(빠른 전환·이름 입력·폴더 이동)을 열면 닫는다
    // (Radix 서랍이 포커스를 가둬 서랍 밖에 그려지는 그 창들을 막지 않도록)
    const pathname = usePathname();
    const [treeOpen, setTreeOpen] = useState(false);
    useEffect(() => setTreeOpen(false), [pathname, switcher, moving, dialog]);

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

    const tree = (
        <>
            <Button variant="unstyled" type="button" onClick={() => setSwitcher(true)}
                    className="mb-3 flex h-8 w-full items-center rounded-lg bg-slate-50 px-2 text-left text-xs text-slate-400 hover:bg-slate-100">
                노트 찾기 <span className="ml-auto">⌘K</span>
            </Button>
            <Link href="/docs/tasks" className="mb-3 flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-slate-600 hover:bg-slate-100">
                <ListChecks className="h-4 w-4"/> Task 모아보기
            </Link>
            <select value={validScope} onChange={(e) => setScope(e.target.value)} aria-label="vault 선택"
                    className="mb-3 h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-d94-brand">
                <option value="ALL">전체 통합</option>
                {(vaults.data ?? []).map((v) => (
                    <option key={v.id} value={v.id}>{v.type === "PRIVATE" ? "🔒 " : "👥 "}{v.name}</option>
                ))}
            </select>
            {folders.isLoading || notes.isLoading || vaults.isLoading ? <Skeleton className="h-40"/> : (
                <DocsSidebar
                    vaults={(vaults.data ?? []).filter((v) => validScope === "ALL" || v.id === validScope)}
                    folders={folders.data ?? []} notes={notes.data ?? []} selectedNoteId={params.noteId ?? null}
                    onNewNote={(folderId, vaultId) => setDialog({
                        title: "새 노트", input: {placeholder: "노트 제목"}, confirmLabel: "만들기",
                        onConfirm: (title) => openNote(title, folderId, vaultId).catch(fail("노트를 만들지 못했습니다.")),
                    })}
                    onNewFolder={(parentId, vaultId) => setDialog({
                        title: "새 폴더", input: {placeholder: "폴더 이름"}, confirmLabel: "만들기",
                        onConfirm: (name) => createFolder.mutate({name, parentId, vaultId}, {onError: fail("폴더를 만들지 못했습니다.")}),
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
                    onDropItem={(item, folderId) => item.kind === "note"
                        ? moveNote.mutate({id: item.id, folderId}, {onError: fail("노트를 옮기지 못했습니다.")})
                        : moveFolder.mutate({id: item.id, parentId: folderId}, {onError: fail("폴더를 옮기지 못했습니다.")})}
                />
            )}
        </>
    );

    return (
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-3 md:px-4 lg:flex-row">
            <Button variant="unstyled" type="button" onClick={() => setTreeOpen(true)}
                    className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 lg:hidden">
                <FolderTree className="h-4 w-4"/> 폴더 · 노트
            </Button>
            <div className="hidden w-60 shrink-0 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 lg:block lg:h-[calc(100vh-7.5rem)]">
                {tree}
            </div>
            <Dialog open={treeOpen} onOpenChange={setTreeOpen} title="폴더 · 노트" side="left">
                <div className="p-3">{tree}</div>
            </Dialog>
            <div className="min-w-0 flex-1">{children}</div>
            {switcher && <QuickSwitcher onClose={() => setSwitcher(false)}
                                        onOpenTitle={(t) => openNote(t).catch(fail("노트를 열지 못했습니다."))}/>}
            {moving && (
                <FolderPickerModal title={`"${moving.name}" 폴더 이동`} folders={(folders.data ?? []).filter((f) => f.vaultId === moving.vaultId)} initial={moving.parentId}
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
