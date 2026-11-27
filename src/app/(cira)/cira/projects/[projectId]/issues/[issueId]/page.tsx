"use client";

import {AttachmentSection} from "@/components/issue/AttachmentSection";
import {CommentSection} from "@/components/issue/CommentSection";
import {IssueDocsSection} from "@/components/issue/IssueDocsSection";
import CustomFieldInput from "@/components/issue/CustomFieldInput";
import DropdownMenu from "@/components/ui/DropdownMenu";
import PageHeader from "@/components/cira/ui/PageHeader";
import {STATUS_TONE_CLASS, statusTone} from "@/components/cira/ui/tones";
import {useToast} from "@/components/ui/Toast";
import {useProjectFields} from "@/hooks/useFields";
import {useFeatures} from "@/hooks/useSpaces";
import NoteMarkdown from "@/components/docs/NoteMarkdown";
import {useOpenNote} from "@/components/docs/useOpenNote";
import {useNote} from "@/hooks/useDocs";
import Link from "next/link";
import {useProjectMembers} from "@/hooks/useProjectSettings";
import {
    useAvailableTransitions,
    useDeleteIssue,
    useIssue,
    useUpdateIssue,
    useUpdateIssueStatus,
} from "@/hooks/useIssues";
import type {Priority, UpdateIssueRequest} from "@/types/issue";
import {useRouter} from "next/navigation";
import {use, useEffect, useRef, useState} from "react";
import Button from "@/components/ui/Button";
import {useConfirm} from "@/components/ui/ConfirmDialog";

const PRIORITY_LABELS: Record<Priority, string> = {
    HIGHEST: "⬆⬆ HIGHEST",
    HIGH: "⬆ HIGH",
    MEDIUM: "➡ MEDIUM",
    LOW: "⬇ LOW",
    LOWEST: "⬇⬇ LOWEST",
};

const PRIORITIES: Priority[] = ["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"];

/**
 * 설명 = Docs 메인 노트 본문 (설계 5, V650 단일 원본). 보기는 Docs 와 같은 렌더링([[링크]] 이동·없는 노트 흐리게),
 * [편집] 은 본문만 고쳐 메인 노트에 저장한다(버전 이력·파생은 Docs 화면/연결 문서 섹션).
 */
function IssueDescription({content, mainNoteId, onSave}: { content: string; mainNoteId?: string; onSave: (v: string) => void }) {
    const {data: note} = useNote(mainNoteId ?? "");
    const openNote = useOpenNote();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(content);
    useEffect(() => setDraft(content), [content]);
    const existing = new Set((note?.links ?? []).filter((l) => l.exists).map((l) => l.title));

    if (editing) {
        return (
            <div className="px-3">
                <textarea aria-label="설명 편집" value={draft} onChange={(e) => setDraft(e.target.value)} rows={10}
                          className="w-full rounded-lg border border-slate-200 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand"/>
                <div className="mt-2 flex gap-2">
                    <Button type="button" size="sm" onClick={() => {
                        if (draft !== content) onSave(draft);
                        setEditing(false);
                    }}>저장</Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => {
                        setDraft(content);
                        setEditing(false);
                    }}>취소</Button>
                </div>
            </div>
        );
    }
    return (
        <div className="group relative min-h-[80px] rounded-lg px-3 py-1 text-sm text-slate-700 hover:bg-slate-50">
            {content.trim()
                ? <NoteMarkdown content={content} existing={existing} onOpenTitle={(t) => openNote(t, null, note?.vaultId)}/>
                : <p className="text-slate-400">설명이 없습니다.</p>}
            <Button type="button" size="sm" variant="secondary" aria-label="설명 편집하기"
                    className="absolute right-2 top-1 opacity-0 group-hover:opacity-100 focus:opacity-100" onClick={() => setEditing(true)}>편집</Button>
        </div>
    );
}

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
                "w-full border border-blue-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand " +
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

    const {confirm, ConfirmComponent} = useConfirm();
    // 유효 필드 중 사용자 정의 필드 (타입이 바뀌어 빠진 필드의 값은 서버에 보관만 되고 여기 안 보인다)
    const {data: fields = []} = useProjectFields(projectId, issue?.spaceId);
    // V650: 상단 경로 "공통 Feature > 단위 Feature"
    const {data: featureTree = []} = useFeatures(projectId);
    const featurePath = (() => {
        if (!issue?.featureId) return [];
        for (const c of featureTree) {
            if (c.feature.id === issue.featureId) return [c.feature];
            const u = c.children.find((x) => x.feature.id === issue.featureId);
            if (u) return [c.feature, u.feature];
        }
        return [];
    })();
    const customFields = fields.filter((f) => f.kind === "cf");
    const {data: members = []} = useProjectMembers(projectId);

    const update = (data: UpdateIssueRequest) => {
        updateIssue(
            {issueId, data},
            {
                onSuccess: () => show("저장되었습니다."),
                onError: () => show("저장에 실패했습니다.", "error"),
            },
        );
    };

    const handleDelete = async () => {
        if (isDeleting) return;
        if (!(await confirm(`Task ${issue?.issueKey ?? ""}를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
            {title: "Task 삭제", confirmLabel: "삭제", danger: true}))) return;
        deleteIssueMutation(issueId, {
            onSuccess: () => router.push(`/cira/projects/${projectId}/issues`),
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
                Task를 불러오는 데 실패했습니다.
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4">
            <PageHeader
                breadcrumbs={[
                    {label: "프로젝트", href: "/cira/projects"},
                    {label: "Task", href: `/cira/projects/${projectId}/issues`},
                ]}
                title={issue.issueKey}
                actions={
                    <DropdownMenu
                        trigger={
                            <Button variant="unstyled" aria-label="더보기"
                                    className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50">
                                ···
                            </Button>
                        }
                        items={[{label: "삭제", onSelect: handleDelete, danger: true}]}
                    />
                }
            />

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

                    {featurePath.length > 0 && (
                        <p className="mb-3 px-3 text-xs text-slate-500" aria-label="Feature 경로">
                            {featurePath.map((f, i) => (
                                <span key={f.id}>
                                    {i > 0 && " › "}
                                    <Link href={`/cira/projects/${projectId}/issues/${f.id}`} className="hover:underline">
                                        {f.featureScope === "COMMON" ? "공통 " : ""}Feature {f.issueKey} {f.title}
                                    </Link>
                                </span>
                            ))}
                        </p>
                    )}

                    {/* 설명 = Docs 메인 노트 본문 (V650 단일 원본). 여기서 고치면 메인 노트가 바뀐다 */}
                    <div className="mb-6">
                        <p className="text-xs font-medium text-slate-500 mb-1 px-3">
                            설명
                            {issue.mainNoteId && (
                                <Link href={`/docs/${issue.mainNoteId}`} className="ml-2 font-normal text-d94-brand hover:underline">
                                    Docs 에서 열기 (버전·링크·파생)
                                </Link>
                            )}
                        </p>
                        <IssueDescription content={issue.content ?? ""} mainNoteId={issue.mainNoteId ?? undefined}
                                          onSave={(v) => update({content: v})}/>
                    </div>

                    {/* Attachments */}
                    <div className="border-t border-slate-100 pt-6">
                        <AttachmentSection issueId={issueId}/>
                    </div>

                    {/* 연결 문서 & 계보 (Docs) */}
                    <div className="border-t border-slate-100 pt-6">
                        <IssueDocsSection projectId={projectId} issueId={issueId}/>
                    </div>

                    {/* Comments */}
                    <div className="border-t border-slate-100 pt-6">
                        <CommentSection issueId={issueId}/>
                    </div>
                </div>

                {/* Right: sidebar */}
                <aside className="order-first w-full shrink-0 rounded-md border border-slate-200 bg-white p-4 lg:order-none lg:w-72">
                    {/* Status (모바일은 상단 바 아래 고정) */}
                    <div className="sticky top-12 z-10 -mx-4 -mt-4 mb-4 bg-white px-4 pb-2 pt-4 lg:static">
                        <p className="mb-2 text-xs font-medium text-slate-500">상태</p>
                        <DropdownMenu
                            align="start"
                            trigger={
                                <Button variant="unstyled"
                                    className={`flex h-10 items-center gap-1 rounded-md px-3 text-sm font-semibold ${STATUS_TONE_CLASS[statusTone(transitions?.find((t) => t.id === issue.statusId)?.category)]}`}>
                                    {issue.statusNm ?? "-"} ▾
                                </Button>
                            }
                            items={(transitions ?? []).filter((t) => t.id !== issue.statusId).map((t) => ({
                                label: t.statusNm,
                                onSelect: () =>
                                    changeStatus(
                                        {issueId, statusId: t.id},
                                        {
                                            onSuccess: () => show("상태가 변경되었습니다."),
                                            onError: () => show("상태 변경에 실패했습니다.", "error"),
                                        },
                                    ),
                            }))}
                        />
                    </div>

                    <details open className="group border-t border-slate-100 pt-3">
                        <summary className="mb-3 cursor-pointer list-none text-xs font-semibold text-slate-600">세부 정보 ▾</summary>
                    <div className="space-y-3">
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
                                className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-d94-brand"
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
                                className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-d94-brand"
                            />
                        </div>

                        {customFields.map((f) => (
                            <div key={f.fieldKey}>
                                <label htmlFor={`cf-${f.fieldKey}`} className="text-xs font-medium text-slate-500 mb-1 block">
                                    {f.name}{f.required && <span className="text-red-500"> *</span>}
                                </label>
                                <CustomFieldInput id={`cf-${f.fieldKey}`} field={f} members={members}
                                                  value={issue.customFields?.[f.fieldKey]}
                                                  onChange={(v) => update({customFields: {[f.fieldKey]: v}})}/>
                            </div>
                        ))}

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
                    </details>
                </aside>
            </div>


            {ToastComponent}
            {ConfirmComponent}
        </div>
    );
}
