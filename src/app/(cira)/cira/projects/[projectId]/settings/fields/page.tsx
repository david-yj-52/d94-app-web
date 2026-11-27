"use client";

import {useCurrentSpace} from "@/hooks/useSpaces";
import Dialog from "@/components/ui/Dialog";
import FieldLibraryDialog from "@/components/issue/FieldLibraryDialog";
import CustomFieldModal from "@/components/settings/CustomFieldModal";
import {useToast} from "@/components/ui/Toast";
import {
    useDeleteProjectField,
    useFieldCatalog,
    useFieldLibrary,
    useImportToProject,
    useProjectFields,
    useReplaceProjectFields,
    useSaveProjectField,
} from "@/hooks/useFields";
import {CUSTOM_FIELD_TYPE_LABELS, type FieldDef} from "@/types/fields";
import {isAxiosError} from "axios";
import {ArrowDown, ArrowUp, Lock} from "lucide-react";
import {use, useState} from "react";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

const errMsg = (e: unknown, fallback: string) => (isAxiosError(e) && e.response?.data?.message) || fallback;

/** 프로젝트 설정 › 필드: 고정 필드(잠김) + 지금 작업 공간의 필드 세트 (V650·V660: 프로젝트 타입 없음) */
export default function ProjectFieldsPage({params}: { params: Promise<{ projectId: string }> }) {
    const {projectId} = use(params);
    // V650: 필드 세트는 작업 공간 소유 — 지금 공간(?space=). 고정 필드 외에는 프리셋에서 온 필드도 뺄 수 있다
    const {space, spaceId} = useCurrentSpace(projectId);
    const {data: fields = []} = useProjectFields(projectId, spaceId);
    const {data: catalog} = useFieldCatalog();
    const replace = useReplaceProjectFields(projectId, spaceId);
    const save = useSaveProjectField(projectId, spaceId);
    const remove = useDeleteProjectField(projectId);
    const {show, ToastComponent} = useToast();
    const [editing, setEditing] = useState<FieldDef | null | undefined>(undefined); // undefined = 닫힘, null = 새로
    const [deleting, setDeleting] = useState<FieldDef | null>(null);
    const [showLibrary, setShowLibrary] = useState(false);
    const {data: library = []} = useFieldLibrary(showLibrary ? projectId : undefined);
    const importField = useImportToProject(projectId, spaceId);

    const inherited = fields.filter((f) => f.source !== "project");
    const added = fields.filter((f) => f.source === "project");
    const addedKeys = added.map((f) => f.fieldKey);
    const usedKeys = new Set(fields.map((f) => f.fieldKey));
    // 기본 필드만 직접 추가. 사용자 정의 필드는 라이브러리에서 가져온다(복사)
    const addable = (catalog?.system ?? []).filter((f) => !usedKeys.has(f.fieldKey));

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
                    <h3 className="text-sm font-semibold text-slate-800">고정 필드</h3>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Lock className="h-3 w-3"/>모든 작업 공간에 항상 있음</span>
                </div>
                <div className="flex flex-wrap gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                    {inherited.map((f) => (
                        <span key={f.fieldKey} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">{f.name}</span>
                    ))}
                </div>
            </section>

            <section className="max-w-2xl">
                <h3 className="mb-2 text-sm font-semibold text-slate-800">{space ? `${space.name} 작업 공간의 필드` : "작업 공간의 필드"}</h3>
                {added.length === 0 && <EmptyState size="sm" className="mb-3 p-0 text-left">필드가 없습니다.</EmptyState>}
                <ul className="mb-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                    {added.map((f, i) => (
                        <li key={f.fieldKey} className="flex min-h-11 items-center gap-2 px-3 text-sm">
                            <span className="flex-1">
                                {f.name}
                                {f.kind === "cf" && <span className="ml-2 text-xs text-slate-400">{CUSTOM_FIELD_TYPE_LABELS[f.fieldType]}{f.required ? " · 필수" : ""}</span>}
                                {f.sourceFieldId && (
                                    <span className="ml-2 text-xs text-slate-400">· {f.sourceName ? `'${f.sourceName}'에서 가져옴` : "원본 삭제됨"}</span>
                                )}
                            </span>
                            <Button variant="unstyled" type="button" aria-label={`${f.name} 위로`} disabled={i === 0} onClick={() => move(i, -1)}
                                    className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="h-4 w-4"/></Button>
                            <Button variant="unstyled" type="button" aria-label={`${f.name} 아래로`} disabled={i === added.length - 1} onClick={() => move(i, 1)}
                                    className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="h-4 w-4"/></Button>
                            {f.kind === "cf" ? (f.canEdit && (
                                <>
                                    <Button variant="unstyled" type="button" onClick={() => setEditing(f)} className="h-8 rounded px-2 text-xs text-slate-600 hover:bg-slate-100">수정</Button>
                                    <Button variant="unstyled" type="button" onClick={() => setDeleting(f)} className="h-8 rounded px-2 text-xs text-red-600 hover:bg-red-50">삭제</Button>
                                </>
                            )) : (
                                <Button variant="unstyled" type="button" onClick={() => setKeys(addedKeys.filter((k) => k !== f.fieldKey))}
                                        className="h-8 rounded px-2 text-xs text-slate-600 hover:bg-slate-100">제거</Button>
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
                        {addable.map((f) => <option key={f.fieldKey} value={f.fieldKey}>{f.name}</option>)}
                    </select>
                    <Button variant="unstyled" type="button" onClick={() => setShowLibrary(true)}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50">+ 라이브러리에서 가져오기</Button>
                    <Button variant="unstyled" type="button" onClick={() => setEditing(null)}
                            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50">+ 새 필드 만들기</Button>
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

            {showLibrary && (
                <FieldLibraryDialog
                    items={library}
                    isPending={importField.isPending}
                    onClose={() => setShowLibrary(false)}
                    onImport={(sourceFieldId) => importField.mutate(sourceFieldId, {
                        onSuccess: (f) => {
                            setShowLibrary(false);
                            show(`'${f.name}' 필드를 가져왔습니다.`);
                        },
                        onError: (e) => show(errMsg(e, "가져오지 못했습니다."), "error"),
                    })}
                />
            )}

            <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)} title="필드 삭제">
                <div className="p-4">
                    <p className="mb-5 text-sm text-slate-600">
                        <strong>{deleting?.name}</strong> 필드를 삭제하면 이 프로젝트 모든 Task의 값이 함께 삭제됩니다. 되돌릴 수 없습니다.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="unstyled" type="button" onClick={() => setDeleting(null)} className="h-10 flex-1 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">취소</Button>
                        <Button type="button" disabled={remove.isPending}
                                onClick={() => deleting && remove.mutate(deleting.fieldKey.slice(3), {
                                    onSuccess: () => setDeleting(null),
                                    onError: (e) => show(errMsg(e, "삭제하지 못했습니다."), "error"),
                                })}
                                variant="danger" className="flex-1">삭제</Button>
                    </div>
                </div>
            </Dialog>
            {ToastComponent}
        </>
    );
}
