"use client";

import Dialog from "@/components/cira/ui/Dialog";
import CustomFieldModal from "@/components/settings/CustomFieldModal";
import {useToast} from "@/components/ui/Toast";
import {
    useDeleteProjectField,
    useFieldCatalog,
    useProjectFields,
    useReplaceProjectFields,
    useSaveProjectField,
} from "@/hooks/useFields";
import {useProject} from "@/hooks/useProjects";
import {CUSTOM_FIELD_TYPE_LABELS, type FieldDef} from "@/types/fields";
import {isAxiosError} from "axios";
import {ArrowDown, ArrowUp, Lock} from "lucide-react";
import Link from "next/link";
import {use, useState} from "react";

const errMsg = (e: unknown, fallback: string) => (isAxiosError(e) && e.response?.data?.message) || fallback;

/** 프로젝트 설정 › 필드: 타입이 물려준 필드(잠김) + 이 프로젝트가 추가한 필드 */
export default function ProjectFieldsPage({params}: { params: Promise<{ projectId: string }> }) {
    const {projectId} = use(params);
    const {data: project} = useProject(projectId);
    const {data: fields = []} = useProjectFields(projectId);
    const {data: catalog} = useFieldCatalog();
    const replace = useReplaceProjectFields(projectId);
    const save = useSaveProjectField(projectId);
    const remove = useDeleteProjectField(projectId);
    const {show, ToastComponent} = useToast();
    const [editing, setEditing] = useState<FieldDef | null | undefined>(undefined); // undefined = 닫힘, null = 새로
    const [deleting, setDeleting] = useState<FieldDef | null>(null);

    const inherited = fields.filter((f) => f.source !== "project");
    const added = fields.filter((f) => f.source === "project");
    const addedKeys = added.map((f) => f.fieldKey);
    const usedKeys = new Set(fields.map((f) => f.fieldKey));
    const addable = [...(catalog?.system ?? []), ...(catalog?.custom ?? [])].filter((f) => !usedKeys.has(f.fieldKey));

    const setKeys = (keys: string[]) =>
        replace.mutate(keys, {onError: (e) => show(errMsg(e, "저장하지 못했습니다."), "error")});
    const move = (i: number, d: -1 | 1) => {
        const next = [...addedKeys];
        [next[i], next[i + d]] = [next[i + d], next[i]];
        setKeys(next);
    };

    return (
        <>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">필드</h2>
                <p className="mt-1 text-sm text-slate-500">이 프로젝트의 Task가 관리하는 값입니다. 목록에 보일 컬럼은 각자 Task 목록의 [컬럼]에서 고릅니다.</p>
            </div>

            <section className="mb-8 max-w-2xl">
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">
                        타입({project?.projectTypeNm ?? project?.projectType ?? "-"})에서 물려받은 필드
                    </h3>
                    <Link href="/settings?group=cira" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:underline">
                        <Lock className="h-3 w-3"/>기준정보에서 관리
                    </Link>
                </div>
                <div className="flex flex-wrap gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                    {inherited.map((f) => (
                        <span key={f.fieldKey} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">{f.name}</span>
                    ))}
                </div>
            </section>

            <section className="max-w-2xl">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">이 프로젝트에 추가한 필드</h3>
                {added.length === 0 && <p className="mb-3 text-xs text-slate-400">추가한 필드가 없습니다.</p>}
                <ul className="mb-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                    {added.map((f, i) => (
                        <li key={f.fieldKey} className="flex min-h-11 items-center gap-2 px-3 text-sm">
                            <span className="flex-1">
                                {f.name}
                                {f.kind === "cf" && <span className="ml-2 text-xs text-slate-400">{CUSTOM_FIELD_TYPE_LABELS[f.fieldType]}{f.required ? " · 필수" : ""}</span>}
                            </span>
                            <button type="button" aria-label={`${f.name} 위로`} disabled={i === 0} onClick={() => move(i, -1)}
                                    className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-4 w-4"/></button>
                            <button type="button" aria-label={`${f.name} 아래로`} disabled={i === added.length - 1} onClick={() => move(i, 1)}
                                    className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-4 w-4"/></button>
                            {f.projectId ? (
                                <>
                                    <button type="button" onClick={() => setEditing(f)} className="h-8 rounded px-2 text-xs text-slate-600 hover:bg-slate-100">수정</button>
                                    <button type="button" onClick={() => setDeleting(f)} className="h-8 rounded px-2 text-xs text-red-600 hover:bg-red-50">삭제</button>
                                </>
                            ) : (
                                <button type="button" onClick={() => setKeys(addedKeys.filter((k) => k !== f.fieldKey))}
                                        className="h-8 rounded px-2 text-xs text-slate-600 hover:bg-slate-100">제거</button>
                            )}
                        </li>
                    ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                    <select
                        aria-label="제공 필드 추가"
                        value=""
                        disabled={addable.length === 0}
                        onChange={(e) => e.target.value && setKeys([...addedKeys, e.target.value])}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                    >
                        <option value="">+ 제공 필드 추가</option>
                        {addable.map((f) => <option key={f.fieldKey} value={f.fieldKey}>{f.name}{f.kind === "cf" ? " (전역)" : ""}</option>)}
                    </select>
                    <button type="button" onClick={() => setEditing(null)}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50">+ 새 필드 만들기</button>
                </div>
            </section>

            {editing !== undefined && (
                <CustomFieldModal
                    editTarget={editing}
                    isPending={save.isPending}
                    onClose={() => setEditing(undefined)}
                    onSubmit={(data) => save.mutate({id: editing?.fieldKey.slice(3), data}, {
                        onSuccess: () => {
                            setEditing(undefined);
                            show("저장했습니다.");
                        },
                        onError: (e) => show(errMsg(e, "저장하지 못했습니다."), "error"),
                    })}
                />
            )}

            <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="필드 삭제">
                <div className="p-4">
                    <p className="mb-5 text-sm text-slate-600">
                        <strong>{deleting?.name}</strong> 필드를 삭제하면 이 프로젝트 모든 Task의 값이 함께 삭제됩니다. 되돌릴 수 없습니다.
                    </p>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setDeleting(null)} className="h-10 flex-1 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">취소</button>
                        <button type="button" disabled={remove.isPending}
                                onClick={() => deleting && remove.mutate(deleting.fieldKey.slice(3), {
                                    onSuccess: () => setDeleting(null),
                                    onError: (e) => show(errMsg(e, "삭제하지 못했습니다."), "error"),
                                })}
                                className="h-10 flex-1 rounded-lg bg-red-500 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">삭제</button>
                    </div>
                </div>
            </Dialog>
            {ToastComponent}
        </>
    );
}
