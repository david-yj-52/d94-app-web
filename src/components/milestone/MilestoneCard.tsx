"use client";

import {useMilestoneProgress} from "@/hooks/useMilestones";
import type {MilestoneResponse, MilestoneStatus} from "@/types/milestone";

const STATUS_LABEL: Record<MilestoneStatus, string> = {
    OPEN: "진행 중",
    CLOSED: "완료",
};

const STATUS_COLOR: Record<MilestoneStatus, string> = {
    OPEN: "bg-blue-100 text-blue-700",
    CLOSED: "bg-slate-100 text-slate-600",
};

function formatDate(dt?: string | null) {
    if (!dt) return "-";
    return new Date(dt).toLocaleDateString("ko-KR");
}

interface Props {
    milestone: MilestoneResponse;
    onEdit: (milestone: MilestoneResponse) => void;
    onDelete: (milestoneId: string) => void;
    isDeleting?: boolean;
}

function ProgressBar({milestoneId}: { milestoneId: string }) {
    const {data} = useMilestoneProgress(milestoneId);

    if (!data) return null;

    const pct = data.percentage ?? 0;

    return (
        <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>
          {data.completed} / {data.total} 이슈 완료
        </span>
                <span>{pct}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{width: `${pct}%`}}
                />
            </div>
        </div>
    );
}

export default function MilestoneCard({milestone, onEdit, onDelete, isDeleting}: Props) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base font-semibold text-slate-900">{milestone.name}</h3>
                        <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[milestone.status]}`}
                        >
              {STATUS_LABEL[milestone.status]}
            </span>
                    </div>

                    {milestone.description && (
                        <p className="text-sm text-slate-500 mt-1">{milestone.description}</p>
                    )}

                    <div className="mt-1 text-xs text-slate-400">
                        마감일: {formatDate(milestone.dueDate)}
                    </div>

                    <ProgressBar milestoneId={milestone.id}/>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => onEdit(milestone)}
                        className="h-8 px-3 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                    >
                        수정
                    </button>
                    <button
                        onClick={() => onDelete(milestone.id)}
                        disabled={isDeleting}
                        className="h-8 px-3 rounded-lg border border-red-200 text-xs text-red-500 hover:bg-red-50 disabled:opacity-60"
                    >
                        삭제
                    </button>
                </div>
            </div>
        </div>
    );
}
