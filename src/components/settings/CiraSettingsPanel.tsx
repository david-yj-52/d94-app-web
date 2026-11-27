"use client";

import Dialog from "@/components/ui/Dialog";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {
    useCreateProjectType,
    useDeleteGlobalField,
    useDeleteProjectType,
    useFieldCatalog,
    useDeleteTypeField,
    useFieldUsage,
    useImportToType,
    useProjectTypes,
    useSaveTypeField,
    useReplaceProjectTypeFields,
    useSaveGlobalField,
    useUpdateProjectType,
} from "@/hooks/useFields";
import {
    CUSTOM_FIELD_TYPE_LABELS,
    FIXED_FIELD_KEYS,
    type FieldCatalog,
    type FieldDef,
    type PresetBoardType,
    type PresetStatus,
    type ProjectTypeResponse,
    type StatusCategory,
    type TypeField,
} from "@/types/fields";
import {useIssueTypes} from "@/hooks/useCiraDocs";
import {useGlobalDocRules, useSaveGlobalDocRules} from "@/hooks/useSpaces";
import type {DocRule} from "@/types/ciraDocs";
import {isAxiosError} from "axios";
import {ArrowDown, ArrowUp, Lock, Plus, X} from "lucide-react";
import {useEffect, useState} from "react";
import CustomFieldModal from "./CustomFieldModal";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

const TYPE_NAME_MAX = 30;
const inputCls = "w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand disabled:opacity-60";
const btnCls = "inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50";
const iconBtn = "flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30";
const errMsg = (e: unknown, fallback: string) => (isAxiosError(e) && e.response?.data?.message) || fallback;

/**
 * 기준정보 › CIRA: 작업 공간 프리셋(구 프로젝트 타입)과 프리셋별 필드 세트, 전역 사용자 정의 필드, 공통 산출물 규칙(V650).
 * 프리셋은 작업 공간을 만들 때 1회 복사된다. ADMIN 아니면 읽기 전용
 */
export default function CiraSettingsPanel({readOnly}: { readOnly: boolean }) {
    const [tab, setTab] = useState<"types" | "fields" | "docRules">("types");
    const {data: types} = useProjectTypes();
    const {data: catalog} = useFieldCatalog();
    const {show, ToastComponent} = useToast();
    if (!types || !catalog) return <SkeletonCard/>;

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div role="tablist" className="mb-4 flex gap-1 border-b border-slate-100">
                {([["types", "작업 공간 프리셋"], ["fields", "사용자 정의 필드"], ["docRules", "공통 산출물 규칙"]] as const).map(([id, label]) => (
                    <Button variant="unstyled" key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                            className={`-mb-px h-10 border-b-2 px-3 text-sm ${tab === id ? "border-d94-brand font-semibold text-blue-700" : "border-transparent text-slate-500"}`}>
                        {label}
                    </Button>
                ))}
            </div>
            {readOnly && <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">관리자만 변경할 수 있습니다.</p>}
            {tab === "types" && <TypesTab types={types} catalog={catalog} readOnly={readOnly} show={show}/>}
            {tab === "fields" && <GlobalFieldsTab fields={catalog.custom} copies={catalog.copies} types={types} readOnly={readOnly} show={show}/>}
            {tab === "docRules" && <GlobalDocRulesTab readOnly={readOnly} show={show}/>}
            {ToastComponent}
        </section>
    );
}

type Show = (msg: string, type?: "success" | "error") => void;

const CATEGORY_LABELS: Record<StatusCategory, string> = {TODO: "할 일", IN_PROGRESS: "진행 중", DONE: "완료"};

/**
 * 프리셋 기본 워크플로·보드 유형 (설계 2.2, V670). 새 작업 공간을 만들 때 1회 복사되고, 이미 만든 공간에는 반영되지 않는다.
 * 전이는 이웃 상태끼리 앞뒤 + 처음 → 마지막. 첫 상태는 "할 일", "완료" 하나 이상, 2~10개.
 */
function PresetWorkflow({preset, readOnly, show}: { preset: ProjectTypeResponse; readOnly: boolean; show: Show }) {
    const update = useUpdateProjectType();
    const [boardType, setBoardType] = useState<PresetBoardType>(preset.boardType);
    const [rows, setRows] = useState<PresetStatus[]>(preset.statuses);
    const dirty = boardType !== preset.boardType || JSON.stringify(rows) !== JSON.stringify(preset.statuses);
    const names = rows.map((r) => r.name.trim());
    const problem = rows.length < 2 || rows.length > 10 ? "상태는 2~10개입니다."
        : names.some((n) => !n || n.length > 30) ? "상태 이름은 1~30자입니다."
        : new Set(names).size !== names.length ? "상태 이름이 겹칩니다."
        : rows[0].category !== "TODO" ? "첫 상태는 '할 일'이어야 합니다."
        : !rows.some((r) => r.category === "DONE") ? "'완료' 상태가 하나 이상 있어야 합니다." : null;
    const set = (i: number, patch: Partial<PresetStatus>) => setRows(rows.map((r, k) => k === i ? {...r, ...patch} : r));
    const move = (i: number, d: -1 | 1) => {
        const next = [...rows];
        [next[i], next[i + d]] = [next[i + d], next[i]];
        setRows(next);
    };

    return (
        <section aria-label="기본 워크플로">
            <h4 className="mb-1 text-sm font-semibold text-slate-800">기본 워크플로 · 보드</h4>
            <p className="mb-2 text-xs text-slate-500">
                새 작업 공간에 복사되는 상태와 보드 유형입니다. 전이는 이웃 상태끼리 앞뒤로, 그리고 첫 상태에서 마지막 상태로 바로 갈 수 있습니다.
            </p>
            <label className="mb-2 flex items-center gap-2 text-sm text-slate-700">
                보드 유형
                <select aria-label="보드 유형" className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm" disabled={readOnly}
                        value={boardType} onChange={(e) => setBoardType(e.target.value as PresetBoardType)}>
                    <option value="KANBAN">칸반</option>
                    <option value="SCRUM">스크럼</option>
                </select>
            </label>
            <ol className="mb-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {rows.map((r, i) => (
                    <li key={i} className="flex min-h-11 items-center gap-2 px-3 text-sm">
                        <span className="w-5 text-xs text-slate-400">{i + 1}</span>
                        <input aria-label={`상태 ${i + 1} 이름`} className={`${inputCls} h-9 flex-1`} value={r.name} maxLength={30} disabled={readOnly}
                               onChange={(e) => set(i, {name: e.target.value})}/>
                        <select aria-label={`상태 ${i + 1} 분류`} className="h-9 w-24 shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-sm" disabled={readOnly}
                                value={r.category} onChange={(e) => set(i, {category: e.target.value as StatusCategory})}>
                            {(Object.keys(CATEGORY_LABELS) as StatusCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                        </select>
                        {!readOnly && (
                            <>
                                <Button variant="ghost" size="icon" type="button" aria-label={`상태 ${i + 1} 위로`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" type="button" aria-label={`상태 ${i + 1} 아래로`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4"/></Button>
                                <Button variant="ghost" size="icon" type="button" aria-label={`상태 ${i + 1} 빼기`} onClick={() => setRows(rows.filter((_, k) => k !== i))}><X className="h-4 w-4"/></Button>
                            </>
                        )}
                    </li>
                ))}
            </ol>
            {problem && <p className="mb-2 text-xs text-red-500">{problem}</p>}
            {!readOnly && (
                <div className="flex gap-2">
                    <Button variant="unstyled" type="button" className={btnCls} disabled={rows.length >= 10}
                            onClick={() => setRows([...rows, {name: "", category: "IN_PROGRESS"}])}><Plus className="h-4 w-4"/>상태 추가</Button>
                    <Button type="button" size="sm" disabled={!dirty || !!problem || update.isPending}
                            onClick={() => update.mutate({id: preset.id, data: {
                                typeNm: preset.typeNm, descr: preset.descr ?? undefined, boardType,
                                statuses: rows.map((r) => ({name: r.name.trim(), category: r.category})),
                            }}, {
                                onSuccess: () => show("워크플로를 저장했습니다. 새로 만드는 작업 공간부터 적용됩니다."),
                                onError: (e) => show(errMsg(e, "저장하지 못했습니다."), "error"),
                            })}>워크플로 저장</Button>
                </div>
            )}
        </section>
    );
}

function TypesTab({types, catalog, readOnly, show}: {
    types: ProjectTypeResponse[];
    catalog: FieldCatalog;
    readOnly: boolean;
    show: Show;
}) {
    const [selectedId, setSelectedId] = useState<string | undefined>(types[0]?.id);
    const [draft, setDraft] = useState("");
    const [rename, setRename] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const create = useCreateProjectType();
    const update = useUpdateProjectType();
    const remove = useDeleteProjectType();
    const replace = useReplaceProjectTypeFields();
    const selected = types.find((t) => t.id === selectedId) ?? types[0];
    const ownFields = (selected && catalog.typeFields[selected.id]) ?? [];
    const byKey = new Map([...catalog.system, ...ownFields].map((f) => [f.fieldKey, f]));
    const [editingField, setEditingField] = useState<FieldDef | null | undefined>(undefined); // undefined 닫힘, null 새로
    const [deletingField, setDeletingField] = useState<FieldDef | null>(null);
    const saveField = useSaveTypeField();
    const deleteField = useDeleteTypeField();
    const importField = useImportToType();
    const {data: deletingUsage} = useFieldUsage(deletingField?.fieldKey.slice(3));
    const importable = catalog.custom.filter((g) => !ownFields.some((f) => f.sourceFieldId === g.fieldKey.slice(3)));
    const name = draft.trim();
    const canAdd = name.length > 0 && name.length <= TYPE_NAME_MAX && !types.some((t) => t.typeNm === name);

    const setFields = (fields: TypeField[]) => selected && replace.mutate(
        {id: selected.id, fields},
        {onError: (e) => show(errMsg(e, "저장하지 못했습니다."), "error")},
    );
    const move = (i: number, d: -1 | 1) => {
        const next = [...selected.fields];
        [next[i], next[i + d]] = [next[i + d], next[i]];
        setFields(next);
    };
    const inSet = new Set([...FIXED_FIELD_KEYS, ...(selected?.fields.map((f) => f.fieldKey) ?? [])]);
    // 세트에는 기본 필드와 이 프리셋의 필드만 (전역 필드는 먼저 "전역에서 가져오기")
    const addable = [...catalog.system, ...ownFields].filter((f) => !inSet.has(f.fieldKey));

    return (
        <div className="flex flex-col gap-6 md:flex-row">
            <div className="md:w-52 md:shrink-0">
                <ul className="mb-3 space-y-1">
                    {types.map((t) => (
                        <li key={t.id}>
                            <Button variant="unstyled" onClick={() => setSelectedId(t.id)}
                                    className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm ${t.id === selected?.id ? "bg-d94-brand-soft font-semibold text-d94-brand" : "text-slate-700 hover:bg-slate-50"}`}>
                                {t.typeNm}<span className="text-xs text-slate-400" title="이 프리셋으로 만든 작업 공간">{t.spaceCount}</span>
                            </Button>
                        </li>
                    ))}
                </ul>
                {!readOnly && (
                    <div className="flex gap-2">
                        <input aria-label="새 프리셋 이름" className={inputCls} value={draft} maxLength={TYPE_NAME_MAX}
                               placeholder="예: 영업" onChange={(e) => setDraft(e.target.value)}/>
                        <Button variant="unstyled" type="button" aria-label="프리셋 추가" disabled={!canAdd || create.isPending} className={btnCls}
                                onClick={() => create.mutate({typeNm: name}, {
                                    onSuccess: (t) => {
                                        setDraft("");
                                        setSelectedId(t.id);
                                    },
                                    onError: (e) => show(errMsg(e, "추가하지 못했습니다."), "error"),
                                })}>
                            <Plus className="h-4 w-4"/>
                        </Button>
                    </div>
                )}
            </div>

            {selected && (
                <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        {rename !== null ? (
                            <>
                                <input aria-label="프리셋 이름" className={`${inputCls} max-w-xs`} value={rename} maxLength={TYPE_NAME_MAX}
                                       onChange={(e) => setRename(e.target.value)}/>
                                <Button variant="unstyled" type="button" className={btnCls} disabled={!rename.trim()}
                                        onClick={() => update.mutate({id: selected.id, data: {typeNm: rename.trim(), descr: selected.descr ?? undefined}}, {
                                            onSuccess: () => setRename(null),
                                            onError: (e) => show(errMsg(e, "저장하지 못했습니다."), "error"),
                                        })}>저장</Button>
                                <Button variant="unstyled" type="button" className={btnCls} onClick={() => setRename(null)}>취소</Button>
                            </>
                        ) : (
                            <>
                                <h3 className="flex-1 text-base font-semibold text-slate-900">{selected.typeNm}</h3>
                                {!readOnly && (
                                    <>
                                        <Button variant="unstyled" type="button" className={btnCls} onClick={() => setRename(selected.typeNm)}>이름 변경</Button>
                                        <Button variant="unstyled" type="button" className={btnCls} onClick={() => setConfirmDelete(true)}>삭제</Button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <PresetWorkflow key={selected.id} preset={selected} readOnly={readOnly} show={show}/>

                    <h4 className="mb-1 mt-6 text-sm font-semibold text-slate-800">기본 필드 세트</h4>
                    <p className="mb-2 text-xs text-slate-500">
                        이 프리셋으로 새 작업 공간을 만들 때 복사되는 필드입니다. 바꿔도 이미 만든 작업 공간({selected.spaceCount}개)에는 반영되지 않습니다.
                    </p>
                    <ul className="mb-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                        <li className="flex min-h-10 items-center gap-2 px-3 text-sm text-slate-500">
                            <Lock className="h-3 w-3"/><span className="flex-1">유형 · 키 · 요약 · 상태 (고정, 항상 표시)</span>
                        </li>
                        {selected.fields.map((tf, i) => {
                            const f = byKey.get(tf.fieldKey);
                            return (
                                <li key={tf.fieldKey} className="flex min-h-10 items-center gap-2 px-3 text-sm">
                                    <span className="flex-1">
                                        {f?.name ?? tf.fieldKey}
                                        {f?.kind === "cf" && <span className="ml-2 text-xs text-slate-400">프리셋 필드 · {CUSTOM_FIELD_TYPE_LABELS[f.fieldType]}</span>}
                                    </span>
                                    <label className="flex items-center gap-1 text-xs text-slate-500">
                                        <input type="checkbox" checked={tf.defaultVisible} disabled={readOnly}
                                               onChange={() => setFields(selected.fields.map((x) => x.fieldKey === tf.fieldKey ? {...x, defaultVisible: !x.defaultVisible} : x))}/>
                                        기본 표시
                                    </label>
                                    <Button variant="unstyled" type="button" aria-label={`${f?.name} 위로`} disabled={readOnly || i === 0} onClick={() => move(i, -1)} className={iconBtn}><ArrowUp className="h-4 w-4"/></Button>
                                    <Button variant="unstyled" type="button" aria-label={`${f?.name} 아래로`} disabled={readOnly || i === selected.fields.length - 1} onClick={() => move(i, 1)} className={iconBtn}><ArrowDown className="h-4 w-4"/></Button>
                                    {!readOnly && (
                                        <Button variant="unstyled" type="button" aria-label={`${f?.name} 빼기`} className={iconBtn}
                                                onClick={() => setFields(selected.fields.filter((x) => x.fieldKey !== tf.fieldKey))}><X className="h-4 w-4"/></Button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                    {!readOnly && (
                        <select aria-label="필드 추가" value="" disabled={addable.length === 0}
                                onChange={(e) => e.target.value && setFields([...selected.fields, {fieldKey: e.target.value, defaultVisible: true}])}
                                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm">
                            <option value="">+ 필드 추가</option>
                            {addable.map((f) => <option key={f.fieldKey} value={f.fieldKey}>{f.name}{f.kind === "cf" ? " (이 프리셋의 필드)" : ""}</option>)}
                        </select>
                    )}

                    <h4 className="mb-1 mt-6 text-sm font-semibold text-slate-800">이 프리셋의 필드</h4>
                    <p className="mb-2 text-xs text-slate-500">
                        기본 세트에 넣으면 새 작업 공간에 복사본으로 들어가고, 넣지 않으면 어느 작업 공간이든 라이브러리에서 골라 가져갑니다.
                    </p>
                    {ownFields.length === 0 && <EmptyState size="sm" className="mb-2 p-0 text-left">이 프리셋의 필드가 없습니다.</EmptyState>}
                    <ul className="mb-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                        {ownFields.map((f) => (
                            <li key={f.fieldKey} aria-label={f.name} className="flex min-h-10 items-center gap-2 px-3 text-sm">
                                <span className="flex-1">
                                    {f.name}
                                    <span className="ml-2 text-xs text-slate-400">
                                        {CUSTOM_FIELD_TYPE_LABELS[f.fieldType]}
                                        {inSet.has(f.fieldKey) ? " · 기본 세트" : " · 라이브러리"}
                                        {f.sourceFieldId && ` · ${f.sourceName ?? "원본 삭제됨"}에서 가져옴`}
                                    </span>
                                </span>
                                {!readOnly && (
                                    <>
                                        <Button variant="unstyled" type="button" onClick={() => setEditingField(f)} className="h-8 rounded px-2 text-xs text-slate-600 hover:bg-slate-100">수정</Button>
                                        <Button variant="unstyled" type="button" onClick={() => setDeletingField(f)} className="h-8 rounded px-2 text-xs text-red-600 hover:bg-red-50">삭제</Button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                    {!readOnly && (
                        <div className="flex flex-wrap gap-2">
                            <Button variant="unstyled" type="button" aria-label="이 프리셋에 새 필드" className={btnCls} onClick={() => setEditingField(null)}>
                                <Plus className="h-4 w-4"/>새 필드
                            </Button>
                            <select aria-label="전역에서 가져오기" value="" disabled={importable.length === 0 || importField.isPending}
                                    onChange={(e) => e.target.value && importField.mutate({typeId: selected.id, sourceFieldId: e.target.value}, {
                                        onSuccess: (f) => show(`'${f.name}' 필드를 이 프리셋으로 가져왔습니다.`),
                                        onError: (err) => show(errMsg(err, "가져오지 못했습니다."), "error"),
                                    })}
                                    className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm">
                                <option value="">+ 전역에서 가져오기</option>
                                {importable.map((g) => <option key={g.fieldKey} value={g.fieldKey.slice(3)}>{g.name}</option>)}
                            </select>
                        </div>
                    )}

                    {editingField !== undefined && (
                        <CustomFieldModal
                            editTarget={editingField}
                            isPending={saveField.isPending}
                            onClose={() => setEditingField(undefined)}
                            onSubmit={(data) => saveField.mutate({typeId: selected.id, id: editingField?.fieldKey.slice(3), data}, {
                                onSuccess: () => {
                                    setEditingField(undefined);
                                    show("저장했습니다.");
                                },
                                onError: (e) => show(errMsg(e, "저장하지 못했습니다."), "error"),
                            })}
                        />
                    )}

                    <Dialog open={!!deletingField} onOpenChange={(o) => !o && setDeletingField(null)} title="프리셋 필드 삭제">
                        <div className="p-4">
                            <p className="mb-5 text-sm text-slate-600">
                                <strong>{deletingField?.name}</strong> 필드를 삭제하면{" "}
                                {deletingUsage ? `이 필드를 직접 쓰는 프로젝트 ${deletingUsage.projects}개, Task ${deletingUsage.issues}개의 값이 함께 삭제됩니다. 작업 공간에 복사된 필드는 남습니다.` : "값이 함께 삭제됩니다."}{" "}
                                가져간 복사본은 남습니다.
                            </p>
                            <div className="flex gap-3">
                                <Button variant="unstyled" type="button" onClick={() => setDeletingField(null)} className="h-10 flex-1 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">취소</Button>
                                <Button type="button" disabled={deleteField.isPending}
                                        onClick={() => deletingField && deleteField.mutate({typeId: selected.id, id: deletingField.fieldKey.slice(3)}, {
                                            onSuccess: () => setDeletingField(null),
                                            onError: (e) => show(errMsg(e, "삭제하지 못했습니다."), "error"),
                                        })}
                                        variant="danger" className="flex-1">삭제</Button>
                            </div>
                        </div>
                    </Dialog>

                    <Dialog open={confirmDelete} onOpenChange={setConfirmDelete} title="프리셋 삭제">
                        <div className="p-4">
                            <p className="mb-5 text-sm text-slate-600">
                                {`"${selected.typeNm}" 프리셋을 삭제합니다.`}
                                {selected.spaceCount > 0 && ` 이 프리셋으로 만든 작업 공간 ${selected.spaceCount}개의 워크플로·필드·보드는 그대로 남습니다.`}
                            </p>
                            <div className="flex gap-3">
                                <Button variant="unstyled" type="button" onClick={() => setConfirmDelete(false)} className="h-10 flex-1 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">취소</Button>
                                <Button type="button" disabled={remove.isPending}
                                        onClick={() => remove.mutate(selected.id, {
                                            onSuccess: () => {
                                                setConfirmDelete(false);
                                                setSelectedId(undefined);
                                            },
                                            onError: (e) => show(errMsg(e, "삭제하지 못했습니다."), "error"),
                                        })}
                                        variant="danger" className="flex-1">삭제</Button>
                            </div>
                        </div>
                    </Dialog>
                </div>
            )}
        </div>
    );
}

function GlobalFieldsTab({fields, copies, types, readOnly, show}: {
    fields: FieldDef[];
    copies: Record<string, number>;
    types: ProjectTypeResponse[];
    readOnly: boolean;
    show: Show;
}) {
    const [editing, setEditing] = useState<FieldDef | null | undefined>(undefined);
    const [deleting, setDeleting] = useState<FieldDef | null>(null);
    const save = useSaveGlobalField();
    const remove = useDeleteGlobalField();
    const {data: usage} = useFieldUsage(deleting?.fieldKey.slice(3));

    return (
        <>
            <p className="mb-3 text-xs text-slate-500">
                라이브러리 필드입니다. 프리셋으로 가져가거나(만들 때 "넣을 프리셋") 작업 공간이 가져가야 적용되고, 가져가면 복사본이 생깁니다.
            </p>
            {fields.length === 0 && <EmptyState size="sm" className="mb-3 p-0 text-left">전역 사용자 정의 필드가 없습니다.</EmptyState>}
            <ul className="mb-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {fields.map((f) => (
                    <li key={f.fieldKey} aria-label={f.name} className="flex min-h-11 items-center gap-2 px-3 text-sm">
                        <span className="flex-1">{f.name}
                            <span className="ml-2 text-xs text-slate-400">{CUSTOM_FIELD_TYPE_LABELS[f.fieldType]}{f.required ? " · 필수" : ""}</span>
                        </span>
                        {(copies[f.fieldKey.slice(3)] ?? 0) === 0
                            ? <span className="text-xs text-amber-600">아직 어디에도 적용되지 않음</span>
                            : <span className="text-xs text-slate-400">복사본 {copies[f.fieldKey.slice(3)]}개</span>}
                        {!readOnly && (
                            <>
                                <Button variant="unstyled" type="button" onClick={() => setEditing(f)} className="h-8 rounded px-2 text-xs text-slate-600 hover:bg-slate-100">수정</Button>
                                <Button variant="unstyled" type="button" onClick={() => setDeleting(f)} className="h-8 rounded px-2 text-xs text-red-600 hover:bg-red-50">삭제</Button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
            {!readOnly && <Button variant="unstyled" type="button" className={btnCls} onClick={() => setEditing(null)}><Plus className="h-4 w-4"/>새 필드</Button>}

            {editing !== undefined && (
                <CustomFieldModal
                    editTarget={editing}
                    typeOptions={types.map((t) => ({id: t.id, typeNm: t.typeNm}))}
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
                        <strong>{deleting?.name}</strong> 필드를 라이브러리에서 삭제합니다.{" "}
                        가져간 작업 공간·프리셋의 복사본{usage ? `(${usage.copies}개)` : ""}은 남습니다. 되돌릴 수 없습니다.
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
        </>
    );
}

/**
 * 전사 공통 산출물 규칙(Task 타입별 파생 문서 폴더 슬롯). 프로젝트 ADMIN 이 [기준정보에서 가져오기] 하면 프로젝트에 🔒 잠금 복사된다.
 * 여기서 바꿔도 이미 가져간 프로젝트 복사본은 그대로다.
 */
function GlobalDocRulesTab({readOnly, show}: { readOnly: boolean; show: Show }) {
    const {data: issueTypes = []} = useIssueTypes();
    const {data: rules = []} = useGlobalDocRules();
    const save = useSaveGlobalDocRules();
    const [typeId, setTypeId] = useState("");
    const current = typeId || issueTypes[0]?.id || "";
    const [rows, setRows] = useState<DocRule[]>([]);
    useEffect(() => setRows(rules.filter((r) => r.issueTypeId === current)), [rules, current]);
    const set = (i: number, patch: Partial<DocRule>) => setRows((rs) => rs.map((r, j) => (j === i ? {...r, ...patch} : r)));
    const submit = () => save.mutate({issueTypeId: current, rules: rows.map((r, i) => ({...r, sortOrder: i}))}, {
        onSuccess: () => show("저장했습니다."),
        onError: (e) => show(errMsg(e, "저장하지 못했습니다."), "error"),
    });

    return (
        <div className="max-w-3xl">
            <p className="mb-3 text-sm text-slate-500">
                모든 프로젝트 팀이 공통으로 남겨야 하는 산출물(예: 요구사항 정의서·시험성적서·릴리즈 노트)입니다.
                프로젝트에서 가져가면 잠금(🔒)으로 복사되어 공간 관리자가 지우거나 바꿀 수 없습니다.
            </p>
            <select aria-label="Task 타입" value={current} onChange={(e) => setTypeId(e.target.value)} className={`${inputCls} mb-3 w-48`}>
                {issueTypes.map((t) => <option key={t.id} value={t.id}>{t.typeNm}</option>)}
            </select>
            {rows.length === 0 && <EmptyState size="sm" className="mb-3 p-0 text-left">이 타입의 공통 산출물 규칙이 없습니다.</EmptyState>}
            <ul className="mb-3 space-y-2">
                {rows.map((r, i) => (
                    <li key={r.id ?? `new-${i}`} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm">
                        <input aria-label="산출물 폴더 이름" value={r.folderName} disabled={readOnly}
                               onChange={(e) => set(i, {folderName: e.target.value})} className={`${inputCls} w-48`} placeholder="요구사항 정의서"/>
                        <label className="flex items-center gap-1 text-xs text-slate-600">
                            <input type="checkbox" checked={r.autoCreate} disabled={readOnly} onChange={(e) => set(i, {autoCreate: e.target.checked})}/>
                            Task 생성 때 폴더 만들기
                        </label>
                        {!readOnly && (
                            <Button variant="unstyled" type="button" aria-label="빼기" className={`${iconBtn} ml-auto`}
                                    onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}><X className="h-4 w-4"/></Button>
                        )}
                    </li>
                ))}
            </ul>
            {!readOnly && (
                <div className="flex gap-2">
                    <Button variant="unstyled" type="button" className={btnCls}
                            onClick={() => setRows((rs) => [...rs, {id: null, issueTypeId: null, folderName: "", sortOrder: null, defaultKind: null,
                                defaultStream: null, templateContent: null, autoCreate: false}])}>
                        <Plus className="h-4 w-4"/> 규칙 추가
                    </Button>
                    <Button type="button" onClick={submit} disabled={!current || save.isPending || rows.some((r) => !r.folderName.trim())}>저장</Button>
                </div>
            )}
        </div>
    );
}
