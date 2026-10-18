"use client";

import AssignIssueModal from "@/components/sprint/AssignIssueModal";
import CompleteSprintModal from "@/components/sprint/CompleteSprintModal";
import CreateSprintModal from "@/components/sprint/CreateSprintModal";
import EditSprintModal from "@/components/sprint/EditSprintModal";
import ProjectNav from "@/components/project/ProjectNav";
import {useToast} from "@/components/ui/Toast";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {useDeleteSprint, useRemoveIssueFromSprint, useSprints, useStartSprint,} from "@/hooks/useSprints";
import {useIssues} from "@/hooks/useIssues";
import {useProject} from "@/hooks/useProjects";
import type {SprintResponse, SprintStatus} from "@/types/sprint";
import Link from "next/link";
import {use, useState} from "react";

const STATUS_LABEL: Record<SprintStatus, string> = {
    CREATED: "대기",
    ACTIVE: "진행 중",
    COMPLETED: "완료",
};

const STATUS_COLOR: Record<SprintStatus, string> = {
    CREATED: "bg-slate-100 text-slate-600",
    ACTIVE: "bg-green-100 text-green-700",
    COMPLETED: "bg-blue-100 text-blue-700",
};

function formatDate(dt?: string) {
    if (!dt) return "-";
    return new Date(dt).toLocaleDateString("ko-KR");
}

interface SprintCardProps {
    sprint: SprintResponse;
    projectId: string;
    onEdit: (sprint: SprintResponse) => void;
    onAssign: (sprint: SprintResponse) => void;
    onStart: (sprintId: string) => void;
    onComplete: (sprint: SprintResponse) => void;
    onDelete: (sprintId: string) => void;
    isStarting: boolean;
    isDeleting: boolean;
}

function SprintCard({
                        sprint,
                        projectId,
                        onEdit,
                        onAssign,
                        onStart,
                        onComplete,
                        onDelete,
                        isStarting,
                        isDeleting,
                    }: SprintCardProps) {
    const [expanded, setExpanded] = useState(false);
    const {data: page} = useIssues(projectId, {sprintId: sprint.id, size: 100});
    const {mutate: removeIssue} = useRemoveIssueFromSprint(projectId);
    const issues = page?.content ?? [];

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-start gap-4 p-5">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-base font-semibold text-slate-900">{sprint.sprintNm}</h3>
                        <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[sprint.status]}`}
                        >
              {STATUS_LABEL[sprint.status]}
            </span>
                    </div>

                    {sprint.goal && (
                        <p className="text-sm text-slate-500 mt-1">{sprint.goal}</p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span>
              {formatDate(sprint.startDt)} ~ {formatDate(sprint.endDt)}
            </span>
                        <button
                            onClick={() => setExpanded((v) => !v)}
                            className="text-blue-500 hover:text-blue-700 font-medium"
                        >
                            이슈 {issues.length}개 {expanded ? "▲" : "▼"}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {sprint.status === "CREATED" && (
                        <button
                            onClick={() => onStart(sprint.id)}
                            disabled={isStarting}
                            className="h-8 px-3 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-60"
                        >
                            {isStarting ? "시작 중..." : "시작"}
                        </button>
                    )}
                    {sprint.status === "ACTIVE" && (
                        <button
                            onClick={() => onComplete(sprint)}
                            className="h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                        >
                            완료
                        </button>
                    )}
                    {sprint.status !== "COMPLETED" && (
                        <button
                            onClick={() => onAssign(sprint)}
                            className="h-8 px-3 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                        >
                            이슈 할당
                        </button>
                    )}
                    {sprint.status !== "ACTIVE" && (
                        <button
                            onClick={() => onEdit(sprint)}
                            className="h-8 px-3 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                        >
                            수정
                        </button>
                    )}
                    {sprint.status === "CREATED" && (
                        <button
                            onClick={() => onDelete(sprint.id)}
                            disabled={isDeleting}
                            className="h-8 px-3 rounded-lg border border-red-200 text-xs text-red-500 hover:bg-red-50 disabled:opacity-60"
                        >
                            삭제
                        </button>
                    )}
                </div>
            </div>

            {expanded && (
                <div className="border-t border-slate-100">
                    {issues.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">
                            할당된 이슈가 없습니다.
                        </p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="bg-slate-50 text-left">
                                <th className="py-2 pl-5 font-medium text-slate-500 text-xs w-24">키</th>
                                <th className="py-2 font-medium text-slate-500 text-xs">제목</th>
                                <th className="py-2 font-medium text-slate-500 text-xs w-24 text-center">상태</th>
                                <th className="py-2 font-medium text-slate-500 text-xs w-24">담당자</th>
                                {sprint.status !== "COMPLETED" && (
                                    <th className="py-2 pr-4 font-medium text-slate-500 text-xs w-16"/>
                                )}
                            </tr>
                            </thead>
                            <tbody>
                            {issues.map((issue) => (
                                <tr key={issue.id} className="border-t border-slate-100">
                                    <td className="py-2.5 pl-5 font-mono text-xs text-slate-400">
                                        {issue.issueKey}
                                    </td>
                                    <td className="py-2.5 text-slate-800">
                                        <Link
                                            href={`/projects/${projectId}/issues/${issue.id}`}
                                            className="hover:text-blue-600 hover:underline"
                                        >
                                            {issue.title}
                                        </Link>
                                    </td>
                                    <td className="py-2.5 text-center">
                                        {issue.statusNm && (
                                            <span
                                                className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">
                          {issue.statusNm}
                        </span>
                                        )}
                                    </td>
                                    <td className="py-2.5 text-xs text-slate-500">
                                        {issue.assignee?.name ?? "-"}
                                    </td>
                                    {sprint.status !== "COMPLETED" && (
                                        <td className="py-2.5 pr-4 text-right">
                                            <button
                                                onClick={() =>
                                                    removeIssue({sprintId: sprint.id, issueId: issue.id})
                                                }
                                                className="text-xs text-red-400 hover:text-red-600"
                                            >
                                                제거
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
}

export default function SprintsPage({
                                        params,
                                    }: {
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const {show, ToastComponent} = useToast();

    const {data: project} = useProject(projectId);
    const {data: sprints, isLoading, isError} = useSprints(projectId);

    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<SprintResponse | null>(null);
    const [assignTarget, setAssignTarget] = useState<SprintResponse | null>(null);
    const [completeTarget, setCompleteTarget] = useState<SprintResponse | null>(null);
    const [actionId, setActionId] = useState<string | null>(null);

    const {mutate: startSprint, isPending: isStarting} = useStartSprint(projectId);
    const {mutate: deleteSprint, isPending: isDeleting} = useDeleteSprint(projectId);

    const handleStart = (sprintId: string) => {
        setActionId(sprintId);
        startSprint(sprintId, {
            onSuccess: () => show("스프린트가 시작되었습니다."),
            onError: () => show("스프린트 시작에 실패했습니다.", "error"),
            onSettled: () => setActionId(null),
        });
    };

    const handleDelete = (sprintId: string) => {
        if (!confirm("스프린트를 삭제하시겠습니까?")) return;
        setActionId(sprintId);
        deleteSprint(sprintId, {
            onSuccess: () => show("스프린트가 삭제되었습니다."),
            onError: () => show("스프린트 삭제에 실패했습니다.", "error"),
            onSettled: () => setActionId(null),
        });
    };

    return (
        <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                <Link href="/projects" className="hover:text-slate-600">
                    프로젝트
                </Link>
                <span>/</span>
                <span className="text-slate-700 font-medium">{project?.name ?? "..."}</span>
            </div>

            <ProjectNav projectId={projectId}/>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">스프린트</h1>
                    {sprints && (
                        <p className="text-sm text-slate-500 mt-0.5">총 {sprints.length}개</p>
                    )}
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >
                    + 스프린트 생성
                </button>
            </div>

            {isLoading && (
                <div className="space-y-4">
                    {Array.from({length: 3}).map((_, i) => (
                        <SkeletonCard key={i}/>
                    ))}
                </div>
            )}

            {isError && (
                <div className="text-center py-20 text-slate-400">
                    스프린트를 불러오는 데 실패했습니다.
                </div>
            )}

            {!isLoading && !isError && sprints?.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <p className="text-lg font-medium text-slate-600 mb-1">스프린트가 없습니다.</p>
                    <p className="text-sm mb-6">새 스프린트를 생성해서 작업을 계획하세요.</p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="h-10 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                    >
                        + 스프린트 생성
                    </button>
                </div>
            )}

            {sprints && sprints.length > 0 && (
                <div className="space-y-4">
                    {sprints.map((sprint) => (
                        <SprintCard
                            key={sprint.id}
                            sprint={sprint}
                            projectId={projectId}
                            onEdit={setEditTarget}
                            onAssign={setAssignTarget}
                            onStart={handleStart}
                            onComplete={setCompleteTarget}
                            onDelete={handleDelete}
                            isStarting={isStarting && actionId === sprint.id}
                            isDeleting={isDeleting && actionId === sprint.id}
                        />
                    ))}
                </div>
            )}

            {showCreate && (
                <CreateSprintModal
                    projectId={projectId}
                    onClose={() => setShowCreate(false)}
                    onSuccess={() => show("스프린트가 생성되었습니다.")}
                />
            )}

            {editTarget && (
                <EditSprintModal
                    projectId={projectId}
                    sprint={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSuccess={() => show("스프린트가 수정되었습니다.")}
                />
            )}

            {completeTarget && (
                <CompleteSprintModal
                    projectId={projectId}
                    sprint={completeTarget}
                    onClose={() => setCompleteTarget(null)}
                    onSuccess={() => show("스프린트가 완료되었습니다.")}
                />
            )}

            {assignTarget && (
                <AssignIssueModal
                    projectId={projectId}
                    sprint={assignTarget}
                    onClose={() => setAssignTarget(null)}
                    onSuccess={() => show("이슈가 할당되었습니다.")}
                />
            )}

            {ToastComponent}
        </div>
    );
}
