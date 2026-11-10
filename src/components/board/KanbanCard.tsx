"use client";

import {Avatar, IssueTypeIcon, PriorityIcon} from "@/components/cira/ui/Badges";
import Menu from "@/components/cira/ui/Menu";
import type {BoardIssueResponse} from "@/types/board";
import {MoveRight} from "lucide-react";
import Link from "next/link";

interface Props {
    issue: BoardIssueResponse;
    projectId: string;
    isDragging: boolean;
    showDropBefore: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent, issueId: string) => void;
    moveTargets?: { id: string; columnNm: string }[];
    onMoveTo?: (targetColumnId: string) => void;
}

export default function KanbanCard({
                                       issue,
                                       projectId,
                                       isDragging,
                                       showDropBefore,
                                       onDragStart,
                                       onDragOver,
                                       moveTargets = [],
                                       onMoveTo,
                                   }: Props) {
    return (
        <>
            {showDropBefore && (
                <div className="h-0.5 bg-indigo-500 rounded-full pointer-events-none"/>
            )}
            <div
                draggable
                onDragStart={onDragStart}
                onDragOver={(e) => onDragOver(e, issue.id)}
                className={[
                    "bg-white rounded-md border p-3 cursor-grab active:cursor-grabbing",
                    "shadow-sm hover:bg-slate-50 transition-all select-none",
                    isDragging ? "opacity-30 scale-[0.98] border-indigo-300" : "border-slate-200",
                ].join(" ")}
            >
                <p className="mb-2 text-sm leading-snug text-slate-800 line-clamp-2">
                    <Link
                        href={`/cira/projects/${projectId}/issues/${issue.id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {issue.title}
                    </Link>
                </p>

                <div className="flex items-center gap-1.5">
                    <IssueTypeIcon typeName={issue.issueTypeNm}/>
                    <span className="text-[11px] font-mono text-slate-500">{issue.issueKey}</span>
                    <span className="flex-1"/>
                    <PriorityIcon priority={issue.priority}/>
                    {onMoveTo && moveTargets.length > 0 && (
                        <span className="md:hidden">
                            <Menu
                                trigger={
                                    <button aria-label={`${issue.issueKey} 이동`}
                                            className="flex h-8 items-center gap-1 rounded border border-slate-200 px-2 text-xs text-slate-600">
                                        <MoveRight className="h-3.5 w-3.5"/>이동
                                    </button>
                                }
                                items={moveTargets.map((t) => ({label: t.columnNm, onSelect: () => onMoveTo(t.id)}))}
                            />
                        </span>
                    )}
                    <Avatar name={issue.assignee?.name}/>
                </div>
            </div>
        </>
    );
}
