"use client";

import type {BoardIssueResponse} from "@/types/board";
import Link from "next/link";

const PRIORITY_BADGE: Record<string, { cls: string; icon: string }> = {
    HIGHEST: {cls: "text-red-600 bg-red-50", icon: "⬆⬆"},
    HIGH: {cls: "text-orange-600 bg-orange-50", icon: "⬆"},
    MEDIUM: {cls: "text-amber-600 bg-amber-50", icon: "→"},
    LOW: {cls: "text-blue-600 bg-blue-50", icon: "⬇"},
    LOWEST: {cls: "text-slate-500 bg-slate-100", icon: "⬇⬇"},
};

interface Props {
    issue: BoardIssueResponse;
    projectId: string;
    isDragging: boolean;
    showDropBefore: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent, issueId: string) => void;
}

export default function KanbanCard({
                                       issue,
                                       projectId,
                                       isDragging,
                                       showDropBefore,
                                       onDragStart,
                                       onDragOver,
                                   }: Props) {
    const pBadge = issue.priority ? PRIORITY_BADGE[issue.priority] : null;

    const initials = issue.assignee?.name
        ? issue.assignee.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : null;

    return (
        <>
            {showDropBefore && (
                <div className="h-0.5 bg-blue-500 rounded-full pointer-events-none"/>
            )}
            <div
                draggable
                onDragStart={onDragStart}
                onDragOver={(e) => onDragOver(e, issue.id)}
                className={[
                    "bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing",
                    "shadow-sm hover:shadow-md hover:border-slate-300 transition-all select-none",
                    isDragging ? "opacity-30 scale-[0.98] border-blue-300" : "border-slate-200",
                ].join(" ")}
            >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                    <Link
                        href={`/projects/${projectId}/issues/${issue.id}`}
                        className="text-[11px] font-mono text-slate-400 hover:text-blue-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {issue.issueKey}
                    </Link>
                    {pBadge && (
                        <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${pBadge.cls}`}
                        >
              {pBadge.icon}
            </span>
                    )}
                </div>

                <p className="text-sm text-slate-800 line-clamp-2 leading-snug mb-2">
                    {issue.title}
                </p>

                <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            {issue.issueTypeNm ?? ""}
          </span>
                    {initials && (
                        <div
                            className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-[9px] font-bold text-white">
                            {initials}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
