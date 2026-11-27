"use client";

import CreateBoardModal from "@/components/board/CreateBoardModal";
import {useConfirm} from "@/components/ui/ConfirmDialog";
import {useToast} from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import {useBoards, useDeleteBoard} from "@/hooks/useBoards";
import {useCurrentSpace} from "@/hooks/useSpaces";
import {isAxiosError} from "axios";
import {Plus} from "lucide-react";
import Link from "next/link";
import {use, useState} from "react";

const errMsg = (e: unknown, fallback: string) => (isAxiosError(e) && e.response?.data?.message) || fallback;
const TYPE_LABEL: Record<string, string> = {KANBAN: "칸반", SCRUM: "스크럼"};

/** 작업 공간 설정 › 보드·뷰 (설계 7.2): 이 공간의 보드 목록·추가·삭제. 컬럼은 보드 화면에서 고친다 */
export default function SpaceBoardsPage({params}: { params: Promise<{ projectId: string }> }) {
    const {projectId} = use(params);
    const {space, spaceId, withSpace} = useCurrentSpace(projectId);
    const {data: boards = [], isLoading} = useBoards(projectId, spaceId);
    const remove = useDeleteBoard(projectId);
    const [creating, setCreating] = useState(false);
    const {show, ToastComponent} = useToast();
    const {confirm, ConfirmComponent} = useConfirm();
    const canManage = !!space?.canManage;

    return (
        <>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">보드 · 뷰</h2>
                <p className="mt-1 text-sm text-slate-500">{space?.name ?? "작업 공간"}의 보드입니다. 컬럼(상태 매핑)은 보드 화면에서 바꿉니다.</p>
            </div>
            <section className="max-w-2xl">
            {!isLoading && boards.length === 0 && <EmptyState size="sm" className="mb-3 p-0 text-left">보드가 없습니다.</EmptyState>}
            <ul className="mb-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                {boards.map((b) => (
                    <li key={b.id} className="flex min-h-11 items-center gap-2 px-3 text-sm">
                        <Link href={withSpace(`/cira/projects/${projectId}/boards/${b.id}`)} className="flex-1 text-slate-800 hover:underline">{b.boardNm}</Link>
                        <span className="text-xs text-slate-400">{TYPE_LABEL[b.boardType] ?? b.boardType}</span>
                        {canManage && (
                            <Button variant="ghost" size="sm" type="button" className="text-red-500 hover:bg-red-50"
                                    onClick={async () => {
                                        if (!(await confirm(`"${b.boardNm}" 보드를 삭제할까요? Task 는 지워지지 않습니다.`, {confirmLabel: "삭제", danger: true}))) return;
                                        remove.mutate(b.id, {onError: (e) => show(errMsg(e, "삭제하지 못했습니다."), "error")});
                                    }}>삭제</Button>
                        )}
                    </li>
                ))}
            </ul>
            {canManage && <Button type="button" variant="secondary" size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4"/>보드 추가</Button>}
            </section>
            {creating && (
                <CreateBoardModal projectId={projectId} spaceId={spaceId} onClose={() => setCreating(false)}
                                  onSuccess={() => show("보드를 만들었습니다.")}/>
            )}
            {ToastComponent}
            {ConfirmComponent}
        </>
    );
}
