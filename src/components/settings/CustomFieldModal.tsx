"use client";

import Dialog from "@/components/ui/Dialog";
import {CUSTOM_FIELD_TYPE_LABELS, type CustomFieldType, type FieldDef, type SaveCustomField} from "@/types/fields";
import {useState} from "react";
import Button from "@/components/ui/Button";

const TYPES = Object.keys(CUSTOM_FIELD_TYPE_LABELS) as CustomFieldType[];
const inputCls = "w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand disabled:opacity-60";

/**
 * 사용자 정의 필드 생성/수정 (전역·프로젝트 공용). 저장은 부모가 onSubmit 으로.
 * 필드 타입은 만든 뒤 바꿀 수 없다.
 */
export default function CustomFieldModal({editTarget, onSubmit, isPending, onClose, typeOptions}: {
    editTarget?: FieldDef | null;
    onSubmit: (data: SaveCustomField) => void;
    isPending?: boolean;
    onClose: () => void;
    /** 전역 필드를 새로 만들 때만: 바로 복사해 넣을 타입 목록 */
    typeOptions?: { id: string; typeNm: string }[];
}) {
    const [copyTo, setCopyTo] = useState<string[]>([]);
    const [fieldNm, setFieldNm] = useState(editTarget?.name ?? "");
    const [fieldType, setFieldType] = useState<CustomFieldType>(editTarget?.fieldType ?? "TEXT");
    const [required, setRequired] = useState(editTarget?.required ?? false);
    const [options, setOptions] = useState((editTarget?.options ?? []).join("\n"));
    const hasOptions = fieldType === "SELECT" || fieldType === "MULTI_SELECT";
    const optionList = options.split("\n").map((o) => o.trim()).filter(Boolean);
    const valid = fieldNm.trim().length > 0 && fieldNm.trim().length <= 100 && (!hasOptions || optionList.length > 0);

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()} title={editTarget ? "필드 수정" : "새 필드 만들기"}>
            <form
                className="space-y-4 p-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (valid) onSubmit({
                        fieldNm: fieldNm.trim(), fieldType, required, options: hasOptions ? optionList : undefined,
                        copyToTypeIds: copyTo.length ? copyTo : undefined,
                    });
                }}
            >
                <div>
                    <label htmlFor="cf-name" className="mb-1 block text-xs font-medium text-slate-600">이름</label>
                    <input id="cf-name" className={inputCls} value={fieldNm} maxLength={100}
                           onChange={(e) => setFieldNm(e.target.value)} placeholder="예: 고객사"/>
                </div>
                <div>
                    <label htmlFor="cf-type" className="mb-1 block text-xs font-medium text-slate-600">필드 타입</label>
                    <select id="cf-type" className={inputCls} value={fieldType} disabled={!!editTarget}
                            onChange={(e) => setFieldType(e.target.value as CustomFieldType)}>
                        {TYPES.map((t) => <option key={t} value={t}>{CUSTOM_FIELD_TYPE_LABELS[t]}</option>)}
                    </select>
                    {editTarget && <p className="mt-1 text-[11px] text-slate-400">필드 타입은 만든 뒤 바꿀 수 없습니다.</p>}
                </div>
                {hasOptions && (
                    <div>
                        <label htmlFor="cf-options" className="mb-1 block text-xs font-medium text-slate-600">선택지 (한 줄에 하나)</label>
                        <textarea id="cf-options" rows={4} value={options} onChange={(e) => setOptions(e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand"/>
                    </div>
                )}
                {typeOptions && !editTarget && typeOptions.length > 0 && (
                    <fieldset>
                        <legend className="mb-1 block text-xs font-medium text-slate-600">넣을 타입 (선택)</legend>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {typeOptions.map((t) => (
                                <label key={t.id} className="flex items-center gap-1.5 text-sm text-slate-700">
                                    <input type="checkbox" checked={copyTo.includes(t.id)}
                                           onChange={(e) => setCopyTo((prev) => e.target.checked ? [...prev, t.id] : prev.filter((x) => x !== t.id))}/>
                                    {t.typeNm}
                                </label>
                            ))}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                            고른 타입마다 이 필드의 복사본이 타입 필드로 생깁니다. 고르지 않으면 라이브러리에만 있고, 프로젝트가 가져가야 적용됩니다.
                        </p>
                    </fieldset>
                )}
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)}/>
                    필수 입력 (Task 생성 시 입력해야 함)
                </label>
                <div className="flex gap-3 pt-2">
                    <Button type="button" onClick={onClose}
                            variant="secondary" className="flex-1">취소</Button>
                    <Button type="submit" disabled={!valid || isPending}
                            className="flex-1">
                        {isPending ? "저장 중..." : "저장"}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
