"use client";

import {useState} from "react";
import {useCompleteSprint, useSprints} from "@/hooks/useSprints";
import {useIssues} from "@/hooks/useIssues";
import type {CompleteSprintIncompleteAction, SprintResponse} from "@/types/sprint";

interface CompleteSprintModalProps {
    projectId: string;
    sprint: SprintResponse;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CompleteSprintModal({
                                                projectId,
                                                sprint,
                                                onClose,
                                                onSuccess,
                                            }: CompleteSprintModalProps) {
    const [action, setAction] =
        useState<CompleteSprintIncompleteAction>("BACKLOG");
    const [nextSprintId, setNextSprintId] = useState("");
    const [error, setError] = useState<string | null>(null);

    const {data: page} = useIssues(projectId, {
        sprintId: sprint.id,
        size: 100,
    });
    const {data: allSprints} = useSprints(projectId);
    const {mutate: completeSprint, isPending} = useCompleteSprint(projectId);

    const issues = page?.content ?? [];
    const incompleteIssues = issues.filter((issue) => {
        const nm = issue.statusNm?.toLowerCase() ?? "";
        return !nm.includes("done") && !nm.includes("완료");
    });
    const completedCount = issues.length - incompleteIssues.length;

    const nextSprints =
        allSprints?.filter(
            (s) => s.status === "CREATED" && s.id !== sprint.id,
        ) ?? [];

    const canConfirm =
        incompleteIssues.length === 0 ||
        action === "BACKLOG" ||
        (action === "NEXT_SPRINT" && !!nextSprintId);

    const handleConfirm = () => {
        setError(null);
        completeSprint(
            {
                sprintId: sprint.id,
                data: {
                    incompleteIssueAction: action,
                    nextSprintId:
                        action === "NEXT_SPRINT" ? nextSprintId || undefined : undefined,
                },
            },
            {
                onSuccess: () => {
                    onSuccess();
                    onClose();
                },
                onError: () => setError("스프린트 완료에 실패했습니다."),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-1">스프린트 완료</h2>
                <p className="text-sm text-slate-500 mb-5">{sprint.sprintNm}</p>

                {/* 통계 */}
                <div className="flex gap-4 mb-5 p-4 bg-slate-50 rounded-xl">
                    <div className="flex-1 text-center">
                        <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                        <p className="text-xs text-slate-500 mt-0.5">완료된 이슈</p>
                    </div>
                    <div className="w-px bg-slate-200"/>
                    <div className="flex-1 text-center">
                        <p className="text-2xl font-bold text-slate-700">{issues.length}</p>
                        <p className="text-xs text-slate-500 mt-0.5">전체 이슈</p>
                    </div>
                </div>

                {/* 미완료 이슈 처리 */}
                {incompleteIssues.length > 0 ? (
                    <div className="mb-4">
                        <p className="text-sm font-medium text-slate-700 mb-2">
                            미완료 이슈{" "}
                            <span className="text-amber-600">{incompleteIssues.length}개</span>{" "}
                            처리 방법
                        </p>

                        <div className="max-h-32 overflow-y-auto space-y-1 mb-4 pr-1">
                            {incompleteIssues.map((issue) => (
                                <div
                                    key={issue.id}
                                    className="flex items-center gap-2 text-xs bg-amber-50 rounded-lg px-3 py-1.5"
                                >
                  <span className="font-mono text-slate-400 shrink-0">
                    {issue.issueKey}
                  </span>
                                    <span className="truncate text-slate-700">{issue.title}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <label
                                className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50">
                                <input
                                    type="radio"
                                    name="action"
                                    value="BACKLOG"
                                    checked={action === "BACKLOG"}
                                    onChange={() => setAction("BACKLOG")}
                                    className="mt-0.5 accent-blue-600"
                                />
                                <div>
                                    <p className="text-sm font-medium text-slate-800">
                                        백로그로 이동
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        미완료 이슈를 백로그로 돌려보냅니다.
                                    </p>
                                </div>
                            </label>

                            <label
                                className="flex items-start gap-3 cursor-pointer p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors has-[:checked]:border-blue-400 has-[:checked]:bg-blue-50">
                                <input
                                    type="radio"
                                    name="action"
                                    value="NEXT_SPRINT"
                                    checked={action === "NEXT_SPRINT"}
                                    onChange={() => setAction("NEXT_SPRINT")}
                                    className="mt-0.5 accent-blue-600"
                                />
                                <div>
                                    <p className="text-sm font-medium text-slate-800">
                                        다음 스프린트로 이동
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        미완료 이슈를 다음 스프린트에 추가합니다.
                                    </p>
                                </div>
                            </label>
                        </div>

                        {action === "NEXT_SPRINT" && (
                            <div className="mt-3">
                                <select
                                    value={nextSprintId}
                                    onChange={(e) => setNextSprintId(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">스프린트 선택...</option>
                                    {nextSprints.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.sprintNm}
                                        </option>
                                    ))}
                                </select>
                                {nextSprints.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1.5">
                                        대기 중인 스프린트가 없습니다.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 mb-4">
                        모든 이슈가 완료되었습니다. 스프린트를 종료합니다.
                    </p>
                )}

                {error && (
                    <p className="text-xs text-red-500 mb-3 bg-red-50 rounded-lg px-3 py-2">
                        {error}
                    </p>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 h-10 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isPending || !canConfirm}
                        className="flex-1 h-10 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                        {isPending ? "처리 중..." : "완료"}
                    </button>
                </div>
            </div>
        </div>
    );
}
