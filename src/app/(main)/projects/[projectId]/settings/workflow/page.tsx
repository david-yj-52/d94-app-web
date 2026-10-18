"use client";

import {useToast} from "@/components/ui/Toast";
import {
    useCreateWorkflowStatus,
    useDeleteWorkflowStatus,
    useProjectMembers,
    useUpdateWorkflowTransitions,
    useWorkflowStatuses,
    useWorkflowTransitions,
} from "@/hooks/useProjectSettings";
import type {WorkflowCategory, WorkflowStatusResponse} from "@/types/workflow";
import {useSession} from "next-auth/react";
import {use, useEffect, useState} from "react";

const CATEGORY_LABEL: Record<WorkflowCategory, string> = {
    TODO: "할 일",
    IN_PROGRESS: "진행 중",
    DONE: "완료",
};

const CATEGORY_COLOR: Record<WorkflowCategory, string> = {
    TODO: "bg-slate-100 text-slate-600",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    DONE: "bg-green-100 text-green-700",
};

interface AddStatusFormProps {
    projectId: string;
    onSuccess: () => void;
    onError: () => void;
}

function AddStatusForm({projectId, onSuccess, onError}: AddStatusFormProps) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState<WorkflowCategory>("TODO");
    const {mutate: createStatus, isPending} = useCreateWorkflowStatus(projectId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        createStatus(
            {statusNm: name.trim(), category},
            {
                onSuccess: () => {
                    setName("");
                    onSuccess();
                },
                onError,
            },
        );
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="새 상태 이름"
                className="flex-1 h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WorkflowCategory)}
                className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <option value="TODO">할 일</option>
                <option value="IN_PROGRESS">진행 중</option>
                <option value="DONE">완료</option>
            </select>
            <button
                type="submit"
                disabled={isPending || !name.trim()}
                className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 shrink-0"
            >
                {isPending ? "추가 중..." : "추가"}
            </button>
        </form>
    );
}

interface TransitionMatrixProps {
    statuses: WorkflowStatusResponse[];
    enabledPairs: Set<string>;
    onChange: (pairs: Set<string>) => void;
    isAdmin: boolean;
}

function TransitionMatrix({
                              statuses,
                              enabledPairs,
                              onChange,
                              isAdmin,
                          }: TransitionMatrixProps) {
    const toggle = (fromId: string, toId: string) => {
        if (!isAdmin) return;
        const key = `${fromId}:${toId}`;
        const next = new Set(enabledPairs);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        onChange(next);
    };

    if (statuses.length === 0) return null;

    return (
        <div className="overflow-x-auto">
            <table className="text-xs border-collapse">
                <thead>
                <tr>
                    <th className="w-32 min-w-32 border border-slate-200 bg-slate-50 p-2 text-left font-medium text-slate-500">
                        출발 \ 도착
                    </th>
                    {statuses.map((s) => (
                        <th
                            key={s.id}
                            className="border border-slate-200 bg-slate-50 p-2 font-medium text-slate-600 text-center min-w-24"
                        >
                            {s.statusNm}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {statuses.map((from) => (
                    <tr key={from.id}>
                        <td className="border border-slate-200 bg-slate-50 p-2 font-medium text-slate-600">
                            {from.statusNm}
                        </td>
                        {statuses.map((to) => {
                            const isSelf = from.id === to.id;
                            const key = `${from.id}:${to.id}`;
                            const checked = enabledPairs.has(key);
                            return (
                                <td
                                    key={to.id}
                                    className={`border border-slate-200 p-2 text-center ${
                                        isSelf ? "bg-slate-50" : "hover:bg-blue-50"
                                    } ${isAdmin && !isSelf ? "cursor-pointer" : ""}`}
                                    onClick={() => !isSelf && toggle(from.id, to.id)}
                                >
                                    {isSelf ? (
                                        <span className="text-slate-200">—</span>
                                    ) : (
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            readOnly
                                            disabled={!isAdmin}
                                            className="w-4 h-4 rounded text-blue-600 cursor-pointer disabled:cursor-default"
                                        />
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}

export default function SettingsWorkflowPage({
                                                 params,
                                             }: {
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const {data: session} = useSession();
    const {data: members} = useProjectMembers(projectId);
    const {
        data: statuses,
        isLoading: statusLoading,
        isError: statusError,
    } = useWorkflowStatuses(projectId);
    const {
        data: transitions,
        isLoading: transitionLoading,
    } = useWorkflowTransitions(projectId);
    const {mutate: deleteStatus} = useDeleteWorkflowStatus(projectId);
    const {mutate: saveTransitions, isPending: isSaving} =
        useUpdateWorkflowTransitions(projectId);
    const {show, ToastComponent} = useToast();

    const [enabledPairs, setEnabledPairs] = useState<Set<string>>(new Set());

    const currentUserEmail = session?.user?.email;
    const isAdmin =
        currentUserEmail != null &&
        members?.some(
            (m) => m.email === currentUserEmail && m.role === "ADMIN",
        ) === true;

    useEffect(() => {
        if (transitions) {
            setEnabledPairs(
                new Set(transitions.map((t) => `${t.fromStatusId}:${t.toStatusId}`)),
            );
        }
    }, [transitions]);

    const handleDeleteStatus = (statusId: string, name: string) => {
        if (!confirm(`"${name}" 상태를 삭제하시겠습니까?`)) return;
        deleteStatus(statusId, {
            onSuccess: () => show("상태가 삭제되었습니다."),
            onError: () => show("상태 삭제에 실패했습니다.", "error"),
        });
    };

    const handleSaveTransitions = () => {
        const transitionList = Array.from(enabledPairs).map((key) => {
            const [fromStatusId, toStatusId] = key.split(":");
            return {fromStatusId, toStatusId};
        });
        saveTransitions(
            {transitions: transitionList},
            {
                onSuccess: () => show("전이 규칙이 저장되었습니다."),
                onError: () => show("저장에 실패했습니다.", "error"),
            },
        );
    };

    const isLoading = statusLoading || transitionLoading;

    return (
        <>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">워크플로우</h2>
                <p className="text-sm text-slate-500 mt-1">
                    이슈 상태와 전이 규칙을 관리합니다.
                </p>
            </div>

            {isLoading && (
                <div className="space-y-3">
                    {Array.from({length: 4}).map((_, i) => (
                        <div key={i} className="h-10 rounded-lg bg-slate-100 animate-pulse"/>
                    ))}
                </div>
            )}

            {statusError && (
                <div className="text-center py-10 text-slate-400 text-sm">
                    워크플로우 정보를 불러오는 데 실패했습니다.
                </div>
            )}

            {!isLoading && !statusError && (
                <>
                    {/* 상태 목록 */}
                    <section className="mb-8">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">
                            상태 목록
                        </h3>
                        <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                            {(!statuses || statuses.length === 0) && (
                                <div className="py-8 text-center text-slate-400 text-sm">
                                    등록된 상태가 없습니다.
                                </div>
                            )}
                            {statuses?.map((status) => (
                                <div
                                    key={status.id}
                                    className="flex items-center justify-between px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-800 text-sm">
                      {status.statusNm}
                    </span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLOR[status.category]}`}
                                        >
                      {CATEGORY_LABEL[status.category]}
                    </span>
                                    </div>
                                    {isAdmin && (
                                        <button
                                            onClick={() =>
                                                handleDeleteStatus(status.id, status.statusNm)
                                            }
                                            className="text-xs text-red-400 hover:text-red-600"
                                        >
                                            삭제
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {isAdmin && statuses !== undefined && (
                            <AddStatusForm
                                projectId={projectId}
                                onSuccess={() => show("상태가 추가되었습니다.")}
                                onError={() => show("상태 추가에 실패했습니다.", "error")}
                            />
                        )}
                    </section>

                    {/* 전이 규칙 매트릭스 */}
                    {statuses && statuses.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-slate-700">
                                    전이 규칙
                                </h3>
                                {isAdmin && (
                                    <button
                                        onClick={handleSaveTransitions}
                                        disabled={isSaving}
                                        className="h-8 px-4 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60"
                                    >
                                        {isSaving ? "저장 중..." : "저장"}
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mb-3">
                                체크된 칸은 해당 상태 간 전이가 허용됨을 의미합니다.
                            </p>
                            <TransitionMatrix
                                statuses={statuses}
                                enabledPairs={enabledPairs}
                                onChange={setEnabledPairs}
                                isAdmin={isAdmin}
                            />
                        </section>
                    )}
                </>
            )}

            {ToastComponent}
        </>
    );
}
