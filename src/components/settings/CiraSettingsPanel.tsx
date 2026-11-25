"use client";

import Dialog from "@/components/cira/ui/Dialog";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {
    useCreateProjectType,
    useDeleteGlobalField,
    useDeleteProjectType,
    useFieldCatalog,
    useFieldUsage,
    useProjectTypes,
    useReplaceProjectTypeFields,
    useSaveGlobalField,
    useUpdateProjectType,
} from "@/hooks/useFields";
import {CUSTOM_FIELD_TYPE_LABELS, FIXED_FIELD_KEYS, type FieldDef, type ProjectTypeResponse, type TypeField} from "@/types/fields";
import {isAxiosError} from "axios";
import {ArrowDown, ArrowUp, Lock, Plus, X} from "lucide-react";
import {useState} from "react";
import CustomFieldModal from "./CustomFieldModal";

const TYPE_NAME_MAX = 30;
const inputCls = "w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60";
const btnCls = "inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50";
const iconBtn = "flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30";
const errMsg = (e: unknown, fallback: string) => (isAxiosError(e) && e.response?.data?.message) || fallback;

/** 기준정보 › CIRA: 프로젝트 타입과 타입별 필드 세트, 전역 사용자 정의 필드. ADMIN 아니면 읽기 전용 */
export default function CiraSettingsPanel({readOnly}: { readOnly: boolean }) {
    const [tab, setTab] = useState<"types" | "fields">("types");
    const {data: types} = useProjectTypes();
    const {data: catalog} = useFieldCatalog();
    const {show, ToastComponent} = useToast();
    if (!types || !catalog) return <SkeletonCard/>;

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            <div role="tablist" className="mb-4 flex gap-1 border-b border-slate-100">
                {([["types", "프로젝트 타입"], ["fields", "사용자 정의 필드"]] as const).map(([id, label]) => (
                    <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
                            className={`-mb-px h-10 border-b-2 px-3 text-sm ${tab === id ? "border-blue-600 font-semibold text-blue-700" : "border-transparent text-slate-500"}`}>
                        {label}
                    </button>
                ))}
            </div>
            {readOnly && <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">관리자만 변경할 수 있습니다.</p>}
            {tab === "types"
                ? <TypesTab types={types} catalog={[...catalog.system, ...catalog.custom]} readOnly={readOnly} show={show}/>
                : <GlobalFieldsTab fields={catalog.custom} readOnly={readOnly} show={show}/>}
            {ToastComponent}
        </section>
    );
}

type Show = (msg: string, type?: "success" | "error") => void;

function TypesTab({types, catalog, readOnly, show}: {
    types: ProjectTypeResponse[];
    catalog: FieldDef[];
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
    const byKey = new Map(catalog.map((f) => [f.fieldKey, f]));
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
    const addable = catalog.filter((f) => !inSet.has(f.fieldKey));

    return (
        <div className="flex flex-col gap-6 md:flex-row">
            <div className="md:w-52 md:shrink-0">
                <ul className="mb-3 space-y-1">
                    {types.map((t) => (
                        <li key={t.id}>
                            <button onClick={() => setSelectedId(t.id)}
                                    className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm ${t.id === selected?.id ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}>
                                {t.typeNm}<span className="text-xs text-slate-400">{t.projectCount}</span>
                            </button>
                        </li>
                    ))}
                </ul>
                {!readOnly && (
                    <div className="flex gap-2">
                        <input aria-label="새 타입 이름" className={inputCls} value={draft} maxLength={TYPE_NAME_MAX}
                               placeholder="예: 영업" onChange={(e) => setDraft(e.target.value)}/>
                        <button type="button" aria-label="타입 추가" disabled={!canAdd || create.isPending} className={btnCls}
                                onClick={() => create.mutate({typeNm: name}, {
                                    onSuccess: (t) => {
                                        setDraft("");
                                        setSelectedId(t.id);
                                    },
                                    onError: (e) => show(errMsg(e, "추가하지 못했습니다."), "error"),
                                })}>
                            <Plus className="h-4 w-4"/>
                        </button>
                    </div>
                )}
            </div>

            {selected && (
                <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        {rename !== null ? (
                            <>
                                <input aria-label="타입 이름" className={`${inputCls} max-w-xs`} value={rename} maxLength={TYPE_NAME_MAX}
                                       onChange={(e) => setRename(e.target.value)}/>
                                <button type="button" className={btnCls} disabled={!rename.trim()}
                                        onClick={() => update.mutate({id: selected.id, data: {typeNm: rename.trim(), descr: selected.descr ?? undefined}}, {
                                            onSuccess: () => setRename(null),
                                            onError: (e) => show(errMsg(e, "저장하지 못했습니다."), "error"),
                                        })}>저장</button>
                                <button type="button" className={btnCls} onClick={() => setRename(null)}>취소</button>
                            </>
                        ) : (
                            <>
                                <h3 className="flex-1 text-base font-semibold text-slate-900">{selected.typeNm}</h3>
                                {!readOnly && (
                                    <>
                                        <button type="button" className={btnCls} onClick={() => setRename(selected.typeNm)}>이름 변경</button>
                                        <button type="button" className={btnCls} onClick={() => setConfirmDelete(true)}>삭제</button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <p className="mb-2 text-xs text-slate-500">
                        이 타입의 프로젝트가 물려받는 필드입니다. 바꾸면 기존 프로젝트({selected.projectCount}개)에도 바로 반영됩니다.
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
                                        {f?.kind === "cf" && <span className="ml-2 text-xs text-slate-400">전역 · {CUSTOM_FIELD_TYPE_LABELS[f.fieldType]}</span>}
                                    </span>
                                    <label className="flex items-center gap-1 text-xs text-slate-500">
                                        <input type="checkbox" checked={tf.defaultVisible} disabled={readOnly}
                                               onChange={() => setFields(selected.fields.map((x) => x.fieldKey === tf.fieldKey ? {...x, defaultVisible: !x.defaultVisible} : x))}/>
                                        기본 표시
                                    </label>
                                    <button type="button" aria-label={`${f?.name} 위로`} disabled={readOnly || i === 0} onClick={() => move(i, -1)} className={iconBtn}><ArrowUp className="h-4 w-4"/></button>
                                    <button type="button" aria-label={`${f?.name} 아래로`} disabled={readOnly || i === selected.fields.length - 1} onClick={() => move(i, 1)} className={iconBtn}><ArrowDown className="h-4 w-4"/></button>
                                    {!readOnly && (
                                        <button type="button" aria-label={`${f?.name} 빼기`} className={iconBtn}
                                                onClick={() => setFields(selected.fields.filter((x) => x.fieldKey !== tf.fieldKey))}><X className="h-4 w-4"/></button>
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
                            {addable.map((f) => <option key={f.fieldKey} value={f.fieldKey}>{f.name}{f.kind === "cf" ? " (전역 사용자 정의)" : ""}</option>)}
                        </select>
                    )}

                    <Dialog open={confirmDelete} onOpenChange={setConfirmDelete} title="타입 삭제">
                        <div className="p-4">
                            <p className="mb-5 text-sm text-slate-600">
                                {selected.projectCount > 0
                                    ? `이 타입을 쓰는 프로젝트가 ${selected.projectCount}개 있어 삭제할 수 없습니다. 먼저 프로젝트의 타입을 바꾸세요.`
                                    : `"${selected.typeNm}" 타입을 삭제합니다.`}
                            </p>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setConfirmDelete(false)} className="h-10 flex-1 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">취소</button>
                                <button type="button" disabled={selected.projectCount > 0 || remove.isPending}
                                        onClick={() => remove.mutate(selected.id, {
                                            onSuccess: () => {
                                                setConfirmDelete(false);
                                                setSelectedId(undefined);
                                            },
                                            onError: (e) => show(errMsg(e, "삭제하지 못했습니다."), "error"),
                                        })}
                                        className="h-10 flex-1 rounded-lg bg-red-500 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">삭제</button>
                            </div>
                        </div>
                    </Dialog>
                </div>
            )}
        </div>
    );
}

function GlobalFieldsTab({fields, readOnly, show}: { fields: FieldDef[]; readOnly: boolean; show: Show }) {
    const [editing, setEditing] = useState<FieldDef | null | undefined>(undefined);
    const [deleting, setDeleting] = useState<FieldDef | null>(null);
    const save = useSaveGlobalField();
    const remove = useDeleteGlobalField();
    const {data: usage} = useFieldUsage(deleting?.fieldKey.slice(3));

    return (
        <>
            <p className="mb-3 text-xs text-slate-500">모든 프로젝트에서 쓸 수 있는 필드입니다. 타입 세트에 넣거나 프로젝트가 골라 추가합니다.</p>
            {fields.length === 0 && <p className="mb-3 text-xs text-slate-400">전역 사용자 정의 필드가 없습니다.</p>}
            <ul className="mb-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {fields.map((f) => (
                    <li key={f.fieldKey} className="flex min-h-11 items-center gap-2 px-3 text-sm">
                        <span className="flex-1">{f.name}
                            <span className="ml-2 text-xs text-slate-400">{CUSTOM_FIELD_TYPE_LABELS[f.fieldType]}{f.required ? " · 필수" : ""}</span>
                        </span>
                        {!readOnly && (
                            <>
                                <button type="button" onClick={() => setEditing(f)} className="h-8 rounded px-2 text-xs text-slate-600 hover:bg-slate-100">수정</button>
                                <button type="button" onClick={() => setDeleting(f)} className="h-8 rounded px-2 text-xs text-red-600 hover:bg-red-50">삭제</button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
            {!readOnly && <button type="button" className={btnCls} onClick={() => setEditing(null)}><Plus className="h-4 w-4"/>새 필드</button>}

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
                        <strong>{deleting?.name}</strong> 필드를 삭제하면{" "}
                        {usage ? `${usage.projects}개 프로젝트, ${usage.issues}개 Task의 값이 함께 삭제됩니다.` : "값이 함께 삭제됩니다."}{" "}
                        되돌릴 수 없습니다.
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
        </>
    );
}
