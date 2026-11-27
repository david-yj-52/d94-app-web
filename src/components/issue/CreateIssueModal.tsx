"use client";

import {useProjectFields} from "@/hooks/useFields";
import {useCreateIssue} from "@/hooks/useIssues";
import {useIssueTypes} from "@/hooks/useCiraDocs";
import {useFeatures, useSpaces} from "@/hooks/useSpaces";
import type {FeatureNode} from "@/types/space";
import {useProjectMembers, useWorkflowStatuses} from "@/hooks/useProjectSettings";
import type {CustomFieldValue, Priority} from "@/types/issue";
import CustomFieldInput from "./CustomFieldInput";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect, useMemo, useState} from "react";
import {useForm} from "react-hook-form";
import {z} from "zod";
import Button from "@/components/ui/Button";
import {Input, Select, Textarea} from "@/components/ui/Input";
import FormField from "@/components/ui/FormField";

const PRIORITIES: Priority[] = ["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"];

const schema = z.object({
    title: z
        .string()
        .min(1, "제목을 입력해주세요.")
        .max(500, "제목은 500자 이내로 입력해주세요."),
    content: z.string().optional(),
    priority: z.enum(["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"]).optional(),
    assigneeId: z.string().optional(),
    storyPnt: z.number().min(0).optional(),
    dueDt: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
    projectId: string;
    /** 처음 고를 작업 공간 (없으면 기본 공간) */
    spaceId?: string;
    onClose: () => void;
    onSuccess?: () => void;
}

/** 트리를 평평하게: 공통 먼저(트리 순서 그대로) */
function flatten(nodes: FeatureNode[]): FeatureNode["feature"][] {
    return nodes.flatMap((n) => [n.feature, ...flatten(n.children)]);
}

export default function CreateIssueModal({
                                             projectId,
                                             spaceId: initialSpaceId,
                                             onClose,
                                             onSuccess,
                                         }: Props) {
    const {mutate, isPending, isSuccess, isError} = useCreateIssue(projectId);
    const {data: members = []} = useProjectMembers(projectId);
    // V650: 작업 공간 · 유형 · Feature(공통/단위)
    const {data: spaces = []} = useSpaces(projectId);
    const {data: issueTypes = []} = useIssueTypes();
    const {data: featureTree = []} = useFeatures(projectId);
    const [spaceId, setSpaceId] = useState(initialSpaceId ?? "");
    const effectiveSpaceId = spaceId || spaces.find((sp) => sp.isDefault)?.id || "";
    const [issueTypeId, setIssueTypeId] = useState("");
    const isFeature = issueTypes.find((t) => t.id === issueTypeId)?.typeNm === "Feature";
    const [common, setCommon] = useState(false);
    const [featureId, setFeatureId] = useState("");
    // 고를 수 있는 Feature: 공통 + (Task 면) 같은 공간 단위. 단위 Feature 는 공통 아래에만, 공통 Feature 는 연결 없음
    const featureOptions = flatten(featureTree).filter((f) =>
        isFeature ? !common && f.featureScope === "COMMON" : f.featureScope === "COMMON" || f.spaceId === effectiveSpaceId);
    const {data: statuses = []} = useWorkflowStatuses(projectId, isFeature && common ? null : effectiveSpaceId || null);
    // 필수 사용자 정의 필드만 여기서 받는다. 나머지는 상세에서
    const {data: fields = []} = useProjectFields(projectId, effectiveSpaceId || null);
    const requiredFields = fields.filter((f) => f.kind === "cf" && f.required);
    const [cfValues, setCfValues] = useState<Record<string, CustomFieldValue>>({});
    const [cfError, setCfError] = useState<string>();
    // 새 Task 의 상태 = 워크플로우 첫 상태 (d94-query 는 statusId 가 없으면 500)
    const initialStatusId = useMemo(
        () => [...statuses].sort((a, b) => a.sortOrd - b.sortOrd)[0]?.id,
        [statuses],
    );

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm<FormData>({resolver: zodResolver(schema)});

    useEffect(() => {
        if (isSuccess) {
            onSuccess?.();
            onClose();
        }
    }, [isSuccess, onClose, onSuccess]);

    const onSubmit = (data: FormData) => {
        const missing = requiredFields.find((f) => cfValues[f.fieldKey] === undefined || cfValues[f.fieldKey] === null);
        if (missing) {
            setCfError(`${missing.name} 값을 입력해주세요.`);
            return;
        }
        setCfError(undefined);
        mutate({
            customFields: requiredFields.length ? cfValues : undefined,
            title: data.title,
            content: data.content || undefined,
            issueTypeId: issueTypeId || undefined,
            spaceId: effectiveSpaceId || undefined,
            featureScope: isFeature ? (common ? "COMMON" : "UNIT") : undefined,
            featureId: (isFeature && common) ? undefined : featureId || undefined,
            priority: data.priority,
            statusId: initialStatusId,
            assigneeId: data.assigneeId || undefined,
            storyPnt: data.storyPnt,
            dueDt: data.dueDt || undefined,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-bold text-slate-900 mb-5">Task 생성</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <FormField label="제목" required error={errors.title?.message}>
                        <Input
                            {...register("title")}
                            placeholder="Task 제목을 입력하세요"
                        />
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="작업 공간">
                            <Select value={effectiveSpaceId} onChange={(e) => setSpaceId(e.target.value)} aria-label="작업 공간"
                                    disabled={isFeature && common}>
                                {spaces.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
                            </Select>
                        </FormField>
                        <FormField label="유형">
                            <Select value={issueTypeId} onChange={(e) => setIssueTypeId(e.target.value)} aria-label="유형">
                                <option value="">Issue (기본)</option>
                                {issueTypes.map((t) => <option key={t.id} value={t.id}>{t.typeNm}</option>)}
                            </Select>
                        </FormField>
                    </div>

                    {isFeature && (
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input type="checkbox" checked={common} onChange={(e) => setCommon(e.target.checked)}/>
                            공통 Feature (여러 작업 공간을 아우르고 항상 최상위로 정렬)
                        </label>
                    )}
                    {!(isFeature && common) && (
                        <FormField label={isFeature ? "상위 공통 Feature" : "Feature"}>
                            <Select value={featureId} onChange={(e) => setFeatureId(e.target.value)} aria-label="Feature">
                                <option value="">연결 안 함</option>
                                {featureOptions.map((f) => (
                                    <option key={f.id} value={f.id}>
                                        {f.featureScope === "COMMON" ? "[공통] " : ""}{f.issueKey} {f.title}
                                    </option>
                                ))}
                            </Select>
                        </FormField>
                    )}

                    <FormField label="설명">
                        <Textarea
                            {...register("content")}
                            rows={4}
                            placeholder="Task 설명을 입력하세요... (Team Docs 의 메인 문서로 저장됩니다)"
                        />
                    </FormField>

                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="우선순위">
                            <select
                                {...register("priority", {setValueAs: (v: string) => v || undefined})}
                                aria-label="우선순위"
                                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand"
                            >
                                <option value="">선택 안 함</option>
                                {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                        </FormField>

                        <FormField label="스토리 포인트">
                            <input
                                {...register("storyPnt", {
                                    // 빈 칸이면 NaN 대신 undefined (z.number().optional() 은 NaN 을 거부한다)
                                    setValueAs: (v: string) => (v === "" ? undefined : Number(v)),
                                })}
                                type="number"
                                min={0}
                                placeholder="0"
                                className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand"
                            />
                        </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="담당자">
                            {/* 값은 사용자 objId(userId). d94-query assigneeId 는 이메일이 아니다 */}
                            <Select
                                {...register("assigneeId")}
                                aria-label="담당자"
                            >
                                <option value="">담당자 없음</option>
                                {members.map((m) => (
                                    <option key={m.userId} value={m.userId}>
                                        {m.userNm || m.email}
                                    </option>
                                ))}
                            </Select>
                        </FormField>

                        <FormField label="마감일">
                            <Input
                                {...register("dueDt")}
                                type="date"
                            />
                        </FormField>
                    </div>

                    {requiredFields.map((f) => (
                        <div key={f.fieldKey}>
                            <label htmlFor={`cf-${f.fieldKey}`} className="block text-xs font-medium text-slate-600 mb-1">
                                {f.name} <span className="text-red-500">*</span>
                            </label>
                            <CustomFieldInput id={`cf-${f.fieldKey}`} field={f} value={cfValues[f.fieldKey]} members={members}
                                              onChange={(v) => setCfValues((prev) => ({...prev, [f.fieldKey]: v}))}/>
                        </div>
                    ))}
                    {cfError && <p className="text-xs text-red-500">{cfError}</p>}

                    {isError && (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                            Task 생성에 실패했습니다.
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="secondary" className="flex-1"
                        >
                            취소
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending}
                            className="flex-1"
                        >
                            {isPending ? "생성 중..." : "Task 생성"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
