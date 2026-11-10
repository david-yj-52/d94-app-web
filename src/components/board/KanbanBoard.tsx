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
    const [showBoardMenu, setShowBoardMenu] = useState(false);
    const [showDeleteBoardConfirm, setShowDeleteBoardConfirm] = useState(false);
    const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null);
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
                onError: () => show("이슈 이동에 실패했습니다.", "error"),
            },
        );
    };

    // 모바일(터치)은 HTML5 DnD 가 안 되므로 카드 메뉴로 컬럼 이동
    const handleMoveTo = (issueId: string, targetColumnId: string) =>
        moveIssue({issueId, data: {targetColumnId}}, {onError: () => show("이슈 이동에 실패했습니다.", "error")});

    const handleDragEnd = () => {
        setDragging(null);
        setDragOver(null);
    };

    const handleDeleteColumn = (columnId: string) => {
        deleteColumnMutation(columnId, {
            onSuccess: () => show("컬럼이 삭제되었습니다."),
            onError: () => show("컬럼 삭제에 실패했습니다.", "error"),
        });
        setDeletingColumnId(null);
    };

    const handleDeleteBoard = () => {
        deleteBoard(boardId, {
            onSuccess: () => {
                show("보드가 삭제되었습니다.");
                router.push(`/cira/projects/${projectId}/boards`);
            },
            onError: () => show("보드 삭제에 실패했습니다.", "error"),
        });
        setShowDeleteBoardConfirm(false);
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
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {board.boardType}
          </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAddColumn(true)}
                        className="h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                        + 컬럼 추가
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowBoardMenu((v) => !v)}
                            className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 text-sm"
                        >
                            ···
                        </button>
                        {showBoardMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowBoardMenu(false)}
                                />
                                <div
                                    className="absolute right-0 mt-1 z-20 bg-white rounded-xl shadow-lg border border-slate-200 py-1 w-36">
                                    <button
                                        onClick={() => {
                                            setShowBoardMenu(false);
                                            setShowDeleteBoardConfirm(true);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                                    >
                                        보드 삭제
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
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
                    <button
                        onClick={() => setMineOnly((v) => !v)}
                        aria-pressed={mineOnly}
                        className={`h-9 rounded-md border px-3 text-sm transition-colors ${
                            mineOnly ? "border-indigo-300 bg-indigo-50 font-semibold text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                    >
                        내 이슈만
                    </button>
                </div>
            )}

            {/* Columns */}
            {board.columns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <p className="text-base font-medium mb-1">컬럼이 없습니다.</p>
                    <p className="text-sm mb-4">컬럼을 추가해서 보드를 구성하세요.</p>
                    <button
                        onClick={() => setShowAddColumn(true)}
                        className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                        + 첫 컬럼 추가
                    </button>
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
                            onDeleteColumn={(colId) => setDeletingColumnId(colId)}
                            moveTargets={board.columns.filter((c) => c.id !== column.id).map((c) => ({id: c.id, columnNm: c.columnNm}))}
                            onMoveTo={handleMoveTo}
                        />
                    ))}

                    {/* Add column ghost */}
                    <button
                        onClick={() => setShowAddColumn(true)}
                        className="w-[85vw] shrink-0 snap-start rounded-xl border-2 border-dashed md:w-72 border-slate-200 h-24 flex items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all text-sm font-medium"
                    >
                        + 컬럼 추가
                    </button>
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

            {/* Delete Column Confirm */}
            {deletingColumnId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setDeletingColumnId(null)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            컬럼 삭제
                        </h3>
                        <p className="text-sm text-slate-600 mb-5">
                            이 컬럼을 삭제하시겠습니까? 컬럼의 이슈는 삭제되지 않습니다.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingColumnId(null)}
                                className="flex-1 h-10 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={() => handleDeleteColumn(deletingColumnId)}
                                className="flex-1 h-10 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Board Confirm */}
            {showDeleteBoardConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setShowDeleteBoardConfirm(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4">
                        <h3 className="text-base font-bold text-slate-900 mb-2">
                            보드 삭제
                        </h3>
                        <p className="text-sm text-slate-600 mb-5">
                            보드 <strong>{board.boardNm}</strong>를 삭제하시겠습니까?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteBoardConfirm(false)}
                                className="flex-1 h-10 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDeleteBoard}
                                className="flex-1 h-10 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {ToastComponent}
        </div>
    );
}
