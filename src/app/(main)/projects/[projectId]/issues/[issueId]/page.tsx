"use client";

import {AttachmentSection} from "@/components/issue/AttachmentSection";
import {CommentSection} from "@/components/issue/CommentSection";
import {useToast} from "@/components/ui/Toast";
import {
    useAvailableTransitions,
    useDeleteIssue,
    useIssue,
    useUpdateIssue,
    useUpdateIssueStatus,
} from "@/hooks/useIssues";
import type {Priority, UpdateIssueRequest} from "@/types/issue";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {use, useEffect, useRef, useState} from "react";

const PRIORITY_LABELS: Record<Priority, string> = {
    HIGHEST: "⬆⬆ HIGHEST",
    HIGH: "⬆ HIGH",
    MEDIUM: "➡ MEDIUM",
    LOW: "⬇ LOW",
    LOWEST: "⬇⬇ LOWEST",
};

const PRIORITIES: Priority[] = ["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"];

function InlineText({
                        value,
                        onSave,
                        className = "",
                        multiline = false,
                    }: {
    value: string;
    onSave: (v: string) => void;
    className?: string;
    multiline?: boolean;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

    useEffect(() => {
        setDraft(value);
    }, [value]);

    useEffect(() => {
        if (editing) ref.current?.focus();
    }, [editing]);

    const save = () => {
        if (draft.trim() && draft !== value) onSave(draft.trim());
        setEditing(false);
    };

    const cancel = () => {
        setDraft(value);
        setEditing(false);
    };

    if (editing) {
        const sharedProps = {
            ref: ref as any,
            value: draft,
            onChange: (
                e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
            ) => setDraft(e.target.value),
            onBlur: save,
            onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === "Enter" && !multiline) save();
                if (e.key === "Escape") cancel();
            },
            className:
                "w-full border border-blue-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 " +
                className,
        };
        return multiline ? (
            <textarea {...sharedProps} rows={5}/>
        ) : (
            <input {...sharedProps} />
        );
    }

    return (
        <div
            onClick={() => setEditing(true)}
            className={`cursor-text rounded-lg px-3 py-2 hover:bg-slate-50 border border-transparent hover:border-slate-200 ${className}`}
        >
            {value || <span className="text-slate-400 italic">클릭하여 편집</span>}
        </div>
    );
}

export default function IssueDetailPage({
                                            params,
                                        }: {
    params: Promise<{ projectId: string; issueId: string }>;
}) {
    const {projectId, issueId} = use(params);
    const router = useRouter();
    const {show, ToastComponent} = useToast();

    const {data: issue, isLoading, isError} = useIssue(issueId);
    const {data: transitions} = useAvailableTransitions(issueId);
    const {mutate: updateIssue} = useUpdateIssue(projectId);
    const {mutate: changeStatus} = useUpdateIssueStatus(projectId);
    const {mutate: deleteIssueMutation, isPending: isDeleting} =
        useDeleteIssue(projectId);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    const update = (data: UpdateIssueRequest) => {
        updateIssue(
            {issueId, data},
            {
                onSuccess: () => show("저장되었습니다."),
                onError: () => show("저장에 실패했습니다.", "error"),
            },
        );
    };

    const handleDelete = () => {
        deleteIssueMutation(issueId, {
            onSuccess: () => router.push(`/projects/${projectId}/issues`),
            onError: () => show("삭제에 실패했습니다.", "error"),
        });
    };

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-32"/>
                    <div className="h-8 bg-slate-200 rounded w-2/3"/>
                    <div className="h-32 bg-slate-200 rounded"/>
                </div>
            </div>
        );
    }

    if (isError || !issue) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-20 text-center text-slate-400">
                이슈를 불러오는 데 실패했습니다.
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                <Link href="/projects" className="hover:text-slate-600">
                    프로젝트
                </Link>
                <span>/</span>
                <Link
                    href={`/projects/${projectId}/issues`}
                    className="hover:text-slate-600"
                >
                    이슈 목록
                </Link>
                <span>/</span>
                <span className="text-slate-700 font-mono text-xs">
          {issue.issueKey}
        </span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
        <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-widest">
          {issue.issueKey}
        </span>
                <div className="relative">
                    <button
                        onClick={() => setShowMoreMenu((v) => !v)}
                        className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
                    >
                        ···
                    </button>
                    {showMoreMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMoreMenu(false)}
                            />
                            <div
                                className="absolute right-0 mt-1 z-20 bg-white rounded-xl shadow-lg border border-slate-200 py-1 w-36">
                                <button
                                    onClick={() => {
                                        setShowMoreMenu(false);
                                        setShowDeleteConfirm(true);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                                >
                                    삭제
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left: main content */}
                <div className="flex-1 min-w-0">
                    {/* Title inline edit */}
                    <div className="mb-4">
                        <p className="text-xs font-medium text-slate-500 mb-1 px-3">
                            제목
                        </p>
                        <InlineText
                            value={issue.title}
                            onSave={(v) => update({title: v})}
                            className="text-xl font-bold text-slate-900"
                        />
                    </div>

                    {/* Description inline edit */}
                    <div className="mb-6">
                        <p className="text-xs font-medium text-slate-500 mb-1 px-3">
                            설명
                        </p>
                        <InlineText
                            value={issue.content ?? ""}
                            onSave={(v) => update({content: v})}
                            multiline
                            className="text-sm text-slate-700 whitespace-pre-wrap min-h-[80px]"
                        />
                    </div>

                    {/* Attachments */}
                    <div className="border-t border-slate-100 pt-6">
                        <AttachmentSection issueId={issueId}/>
                    </div>

                    {/* Comments */}
                    <div className="border-t border-slate-100 pt-6">
                        <CommentSection issueId={issueId}/>
                    </div>
                </div>

                {/* Right: sidebar */}
                <aside className="w-full lg:w-64 shrink-0 space-y-0 bg-white rounded-xl border border-slate-200 p-4">
                    {/* Status */}
                    <div className="mb-4">
                        <p className="text-xs font-medium text-slate-500 mb-2">상태</p>
                        <div className="flex flex-wrap gap-2">
                            {transitions && transitions.length > 0 ? (
                                transitions.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() =>
                                            changeStatus(
                                                {issueId, statusId: t.id},
                                                {
                                                    onSuccess: () => show("상태가 변경되었습니다."),
                                                    onError: () =>
                                                        show("상태 변경에 실패했습니다.", "error"),
                                                },
                                            )
                                        }
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                            issue.statusId === t.id
                                                ? "bg-blue-600 text-white border-blue-600"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                                        }`}
                                    >
                                        {t.statusNm}
                                    </button>
                                ))
                            ) : (
                                <span className="text-sm text-slate-500">
                  {issue.statusNm ?? "-"}
                </span>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3">
                        {/* Priority */}
                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">
                                우선순위
                            </p>
                            <select
                                value={issue.priority ?? ""}
                                onChange={(e) =>
                                    update({priority: (e.target.value as Priority) || undefined})
                                }
                                className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-</option>
                                {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>
                                        {PRIORITY_LABELS[p]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Assignee */}
                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">담당자</p>
                            <p className="text-sm text-slate-700">
                                {issue.assignee?.name ?? "-"}
                            </p>
                        </div>

                        {/* Reporter */}
                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">보고자</p>
                            <p className="text-sm text-slate-700">
                                {issue.reporter?.name ?? "-"}
                            </p>
                        </div>

                        {/* Story points */}
                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">
                                스토리 포인트
                            </p>
                            <InlineText
                                value={String(issue.storyPnt ?? "")}
                                onSave={(v) => update({storyPnt: parseFloat(v) || 0})}
                                className="text-sm text-slate-700"
                            />
                        </div>

                        {/* Due date */}
                        <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">마감일</p>
                            <input
                                type="date"
                                defaultValue={issue.dueDt ?? ""}
                                onBlur={(e) => {
                                    if (e.target.value !== issue.dueDt) {
                                        update({dueDt: e.target.value || undefined});
                                    }
                                }}
                                className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="border-t border-slate-100 pt-3 space-y-1">
                            <p className="text-xs text-slate-400">
                                생성:{" "}
                                {issue.createdAt
                                    ? new Date(issue.createdAt).toLocaleString("ko-KR")
                                    : "-"}
                            </p>
                            <p className="text-xs text-slate-400">
                                수정:{" "}
                                {issue.modifiedAt
                                    ? new Date(issue.modifiedAt).toLocaleString("ko-KR")
                                    : "-"}
                            </p>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Delete confirm dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/40"/>
                    <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                            이슈 삭제
                        </h3>
                        <p className="text-sm text-slate-600 mb-5">
                            이슈 <strong>{issue.issueKey}</strong>를 삭제하시겠습니까? 이
                            작업은 되돌릴 수 없습니다.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 h-10 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 h-10 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
                            >
                                {isDeleting ? "삭제 중..." : "삭제"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {ToastComponent}
        </div>
    );
}
