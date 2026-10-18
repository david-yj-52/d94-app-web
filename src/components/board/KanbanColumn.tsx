"use client";

import type {BoardColumnResponse, BoardIssueResponse} from "@/types/board";
import KanbanCard from "./KanbanCard";

const TOP_BORDER: Record<string, string> = {
    TODO: "border-t-slate-400",
    IN_PROGRESS: "border-t-blue-500",
    DONE: "border-t-green-500",
};

interface Props {
    column: BoardColumnResponse;
    projectId: string;
    isDragOver: boolean;
    draggingIssueId: string | null;
    dropBeforeIssueId: string | null;
    onDrop: (e: React.DragEvent, targetColumnId: string) => void;
    onDragOver: (e: React.DragEvent, columnId: string) => void;
    onDragLeave: (e: React.DragEvent, columnId: string) => void;
    onIssueDragStart: (
        e: React.DragEvent,
        issue: BoardIssueResponse,
        columnId: string,
    ) => void;
    onIssueDragOver: (e: React.DragEvent, issueId: string, columnId: string) => void;
    onEditColumn?: (column: BoardColumnResponse) => void;
    onDeleteColumn?: (columnId: string) => void;
}

export default function KanbanColumn({
                                         column,
                                         projectId,
                                         isDragOver,
                                         draggingIssueId,
                                         dropBeforeIssueId,
                                         onDrop,
                                         onDragOver,
                                         onDragLeave,
                                         onIssueDragStart,
                                         onIssueDragOver,
                                         onEditColumn,
                                         onDeleteColumn,
                                     }: Props) {
    const topBorder = TOP_BORDER[column.statusCategory ?? ""] ?? "border-t-slate-300";
    const issueCount = column.issues.length;
    const isOverWip = column.wipLimit != null && issueCount > column.wipLimit;

    return (
        <div
            className={[
                "group flex flex-col w-72 shrink-0 rounded-xl border border-t-4 transition-all",
                topBorder,
                isDragOver
                    ? "border-blue-400 bg-blue-50/50 shadow-lg shadow-blue-100"
                    : "border-slate-200 bg-slate-50",
            ].join(" ")}
            onDragOver={(e) => onDragOver(e, column.id)}
            onDragLeave={(e) => onDragLeave(e, column.id)}
            onDrop={(e) => onDrop(e, column.id)}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-slate-700 truncate">
            {column.columnNm}
          </span>
                    <span
                        className={[
                            "text-xs font-medium px-1.5 py-0.5 rounded-full tabular-nums",
                            isOverWip
                                ? "bg-red-100 text-red-600"
                                : "bg-white border border-slate-200 text-slate-500",
                        ].join(" ")}
                    >
            {issueCount}
                        {column.wipLimit != null && (
                            <span className="text-slate-400">/{column.wipLimit}</span>
                        )}
          </span>
                </div>

                {(onEditColumn || onDeleteColumn) && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEditColumn && (
                            <button
                                onClick={() => onEditColumn(column)}
                                className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white text-xs transition-colors"
                                title="컬럼 편집"
                            >
                                ✎
                            </button>
                        )}
                        {onDeleteColumn && (
                            <button
                                onClick={() => onDeleteColumn(column.id)}
                                className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white text-base leading-none transition-colors"
                                title="컬럼 삭제"
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1.5 min-h-[80px]">
                {column.issues.map((issue) => (
                    <KanbanCard
                        key={issue.id}
                        issue={issue}
                        projectId={projectId}
                        isDragging={draggingIssueId === issue.id}
                        showDropBefore={dropBeforeIssueId === issue.id}
                        onDragStart={(e) => onIssueDragStart(e, issue, column.id)}
                        onDragOver={(e) => onIssueDragOver(e, issue.id, column.id)}
                    />
                ))}

                {isDragOver && dropBeforeIssueId === null && (
                    <div className="h-0.5 bg-blue-500 rounded-full pointer-events-none mt-1"/>
                )}
            </div>
        </div>
    );
}
