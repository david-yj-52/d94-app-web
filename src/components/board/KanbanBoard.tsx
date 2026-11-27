"use client";

import AddColumnModal from "@/components/board/AddColumnModal";
import KanbanColumn from "@/components/board/KanbanColumn";
import {filterColumns} from "@/components/board/boardFilters";
import {useToast} from "@/components/ui/Toast";
import {useBoardDetail, useDeleteBoard, useDeleteColumn, useMoveIssue,} from "@/hooks/useBoards";
import type {BoardColumnResponse, BoardIssueResponse} from "@/types/board";
import {useSession} from "next-auth/react";
import {useRouter} from "next/navigation";
import {useState} from "react";
import Button from "@/components/ui/Button";
import {useConfirm} from "@/components/ui/ConfirmDialog";
import DropdownMenu from "@/components/ui/DropdownMenu";
import Badge from "@/components/ui/Badge";

interface DragState {
    issueId: string;
    sourceColumnId: string;
}

interface DragOverState {
    columnId: string;
    beforeIssueId: string | null;
}

interface Props {
    boardId: string;
    projectId: string;
}

export default function KanbanBoard({boardId, projectId}: Props) {
    const router = useRouter();
    const {show, ToastComponent} = useToast();

    const {data: board, isLoading, isError} = useBoardDetail(boardId);
    const {mutate: moveIssue} = useMoveIssue(boardId);
    const {mutate: deleteColumnMutation} = useDeleteColumn(boardId);
    const {mutate: deleteBoard} = useDeleteBoard(projectId);

    const [dragging, setDragging] = useState<DragState | null>(null);
    const [dragOver, setDragOver] = useState<DragOverState | null>(null);
    const [showAddColumn, setShowAddColumn] = useState(false);
    const [editingColumn, setEditingColumn] = useState<
        BoardColumnResponse | undefined
    >(undefined);
    const {confirm, ConfirmComponent} = useConfirm();
    const {data: session} = useSession();
    const [mineOnly, setMineOnly] = useState(false);
    const [keyword, setKeyword] = useState("");

    const handleIssueDragStart = (
        e: React.DragEvent,
        issue: BoardIssueResponse,
        columnId: string,
    ) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(
            "text/plain",
            JSON.stringify({issueId: issue.id, sourceColumnId: columnId}),
        );
        setDragging({issueId: issue.id, sourceColumnId: columnId});
    };

    const handleIssueDragOver = (
        e: React.DragEvent,
        issueId: string,
        columnId: string,
    ) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        setDragOver({columnId, beforeIssueId: issueId});
    };

    const handleColumnDragOver = (e: React.DragEvent, columnId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOver((prev) => {
            if (prev?.columnId === columnId && prev?.beforeIssueId === null)
                return prev;
            return {columnId, beforeIssueId: null};
        });
    };

    const handleColumnDragLeave = (e: React.DragEvent, columnId: string) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOver((prev) =>
                prev?.columnId === columnId ? null : prev,
            );
        }
    };

    const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
        e.preventDefault();
        const raw = e.dataTransfer.getData("text/plain");
        if (!raw) return;

        const {issueId} = JSON.parse(raw) as DragState;
        const beforeIssueId = dragOver?.beforeIssueId ?? null;

        setDragging(null);
        setDragOver(null);

        // 제자리 드롭: 끌던 카드 자신 위의 dragover 가 beforeIssueId 로 잡힌 경우
        if (beforeIssueId === issueId) return;

        moveIssue(
            {
                issueId,
                data: {
                    targetColumnId,
                    beforeIssueId: beforeIssueId ?? undefined,
                },
            },
            {
                onError: () => show("Task 이동에 실패했습니다.", "error"),
            },
        );
    };

    // 모바일(터치)은 HTML5 DnD 가 안 되므로 카드 메뉴로 컬럼 이동
    const handleMoveTo = (issueId: string, targetColumnId: string) =>
        moveIssue({issueId, data: {targetColumnId}}, {onError: () => show("Task 이동에 실패했습니다.", "error")});

    const handleDragEnd = () => {
        setDragging(null);
        setDragOver(null);
    };

    const handleDeleteColumn = async (columnId: string) => {
        if (!(await confirm("이 컬럼을 삭제하시겠습니까? 컬럼의 Task는 삭제되지 않습니다.",
            {title: "컬럼 삭제", confirmLabel: "삭제", danger: true}))) return;
        deleteColumnMutation(columnId, {
            onSuccess: () => show("컬럼이 삭제되었습니다."),
            onError: () => show("컬럼 삭제에 실패했습니다.", "error"),
        });
    };

    const handleDeleteBoard = async () => {
        if (!(await confirm(`보드 ${board?.boardNm ?? ""}를 삭제하시겠습니까?`,
            {title: "보드 삭제", confirmLabel: "삭제", danger: true}))) return;
        deleteBoard(boardId, {
            onSuccess: () => {
                show("보드가 삭제되었습니다.");
                router.push(`/cira/projects/${projectId}/boards`);
            },
            onError: () => show("보드 삭제에 실패했습니다.", "error"),
        });
    };

    if (isLoading) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
                {Array.from({length: 3}).map((_, i) => (
                    <div
                        key={i}
                        className="w-72 shrink-0 h-64 bg-slate-100 rounded-xl animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (isError || !board) {
        return (
            <div className="text-center py-20 text-slate-400">
                보드를 불러오는 데 실패했습니다.
            </div>
        );
    }

    return (
        <div onDragEnd={handleDragEnd}>
            {/* Board header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-800">{board.boardNm}</h2>
                    <Badge className="text-slate-400">
            {board.boardType}
          </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setShowAddColumn(true)}
                        size="sm"
                    >
                        + 컬럼 추가
                    </Button>

                    <DropdownMenu
                        trigger={
                            <Button variant="unstyled" type="button" aria-label="보드 메뉴"
                                    className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-sm">
                                ···
                            </Button>
                        }
                        items={[{label: "보드 삭제", onSelect: () => void handleDeleteBoard(), danger: true}]}
                    />
                </div>
            </div>

            {/* Quick filters */}
            {board.columns.length > 0 && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="보드 검색"
                        aria-label="보드 검색"
                        className="h-9 w-44 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Button variant="unstyled"
                        onClick={() => setMineOnly((v) => !v)}
                        aria-pressed={mineOnly}
                        className={`h-9 rounded-md border px-3 text-sm transition-colors ${
                            mineOnly ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        내 Task만
                    </Button>
                </div>
            )}

            {/* Columns */}
            {board.columns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <p className="text-base font-medium mb-1">컬럼이 없습니다.</p>
                    <p className="text-sm mb-4">컬럼을 추가해서 보드를 구성하세요.</p>
                    <Button
                        onClick={() => setShowAddColumn(true)}
                        className="h-9"
                    >
                        + 첫 컬럼 추가
                    </Button>
                </div>
            ) : (
                <div className="flex snap-x snap-mandatory items-start gap-3 overflow-x-auto pb-6 pt-1 md:snap-none md:gap-4">
                    {filterColumns(board.columns, {mineEmail: mineOnly ? session?.user?.email : undefined, keyword}).map((column) => (
                        <KanbanColumn
                            key={column.id}
                            column={column}
                            projectId={projectId}
                            isDragOver={dragOver?.columnId === column.id}
                            draggingIssueId={dragging?.issueId ?? null}
                            dropBeforeIssueId={
                                dragOver?.columnId === column.id
                                    ? (dragOver?.beforeIssueId ?? null)
                                    : null
                            }
                            onDrop={handleDrop}
                            onDragOver={handleColumnDragOver}
                            onDragLeave={handleColumnDragLeave}
                            onIssueDragStart={handleIssueDragStart}
                            onIssueDragOver={handleIssueDragOver}
                            onEditColumn={(col) => {
                                setEditingColumn(col);
                                setShowAddColumn(true);
                            }}
                            onDeleteColumn={(colId) => void handleDeleteColumn(colId)}
                            moveTargets={board.columns.filter((c) => c.id !== column.id).map((c) => ({id: c.id, columnNm: c.columnNm}))}
                            onMoveTo={handleMoveTo}
                        />
                    ))}

                    {/* Add column ghost */}
                    <Button variant="unstyled"
                        onClick={() => setShowAddColumn(true)}
                        className="w-[85vw] shrink-0 snap-start rounded-xl border-2 border-dashed md:w-72 border-slate-200 h-24 flex items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-d94-brand-soft/30 transition-all text-sm font-medium"
                    >
                        + 컬럼 추가
                    </Button>
                </div>
            )}

            {/* Add / Edit Column Modal */}
            {showAddColumn && (
                <AddColumnModal
                    boardId={boardId}
                    editingColumn={editingColumn}
                    onClose={() => {
                        setShowAddColumn(false);
                        setEditingColumn(undefined);
                    }}
                    onSuccess={() =>
                        show(editingColumn ? "컬럼이 수정되었습니다." : "컬럼이 추가되었습니다.")
                    }
                />
            )}

            {ToastComponent}
            {ConfirmComponent}
        </div>
    );
}
