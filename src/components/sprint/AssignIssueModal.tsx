"use client";

import {useAddIssueToSprint} from "@/hooks/useSprints";
import {useIssues} from "@/hooks/useIssues";
import type {SprintResponse} from "@/types/sprint";
import {useState} from "react";

interface Props {
    projectId: string;
    sprint: SprintResponse;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function AssignIssueModal({projectId, sprint, onClose, onSuccess}: Props) {
    const [keyword, setKeyword] = useState("");
    const [adding, setAdding] = useState<string | null>(null);

    const {data: page, isLoading} = useIssues(projectId, {
        keyword: keyword || undefined,
        size: 50,
    });

    const {mutateAsync: addIssue} = useAddIssueToSprint(projectId);

    const issues = (page?.content ?? []).filter((i) => !i.sprintId);

    const handleAdd = async (issueId: string) => {
        setAdding(issueId);
        try {
            await addIssue({sprintId: sprint.id, issueId});
            onSuccess?.();
        } finally {
            setAdding(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
            <div
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">이슈 할당</h2>
                    <span className="text-sm text-slate-500">{sprint.sprintNm}</span>
                </div>

                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="이슈 검색..."
                    className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex-1 overflow-y-auto min-h-0">
                    {isLoading && (
                        <div className="text-center py-8 text-slate-400 text-sm">불러오는 중...</div>
                    )}

                    {!isLoading && issues.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm">
                            할당 가능한 이슈가 없습니다.
                        </div>
                    )}

                    {issues.map((issue) => (
                        <div
                            key={issue.id}
                            className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 border-b border-slate-100 last:border-0"
                        >
                            <div className="min-w-0">
                <span className="font-mono text-xs text-slate-400 mr-2">
                  {issue.issueKey}
                </span>
                                <span className="text-sm text-slate-800 font-medium truncate">
                  {issue.title}
                </span>
                                {issue.statusNm && (
                                    <span
                                        className="ml-2 inline-block px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">
                    {issue.statusNm}
                  </span>
                                )}
                            </div>
                            <button
                                onClick={() => handleAdd(issue.id)}
                                disabled={adding === issue.id}
                                className="ml-3 shrink-0 h-7 px-3 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60"
                            >
                                {adding === issue.id ? "..." : "추가"}
                            </button>
                        </div>
                    ))}
                </div>

                <div className="pt-4">
                    <button
                        onClick={onClose}
                        className="w-full h-10 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}
