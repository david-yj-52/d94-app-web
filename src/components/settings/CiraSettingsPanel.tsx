"use client";

import {useState} from "react";
import {isAxiosError} from "axios";
import {Plus, X} from "lucide-react";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {useSettings, useUpdateSettings} from "@/hooks/useSettings";
import {CIRA_PROJECT_TYPES_KEY, parseCiraProjectTypes} from "@/types/settings";

const TYPE_NAME_MAX = 30;
const inputCls = "w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60";

/** CIRA 그룹: 프로젝트 생성·설정 시 선택 가능한 프로젝트 유형 관리 */
export default function CiraSettingsPanel({readOnly}: { readOnly: boolean }) {
    const {data} = useSettings();
    if (!data) return <SkeletonCard/>;
    return <ProjectTypesForm key={data[CIRA_PROJECT_TYPES_KEY] ?? ""} readOnly={readOnly}
                             initialTypes={parseCiraProjectTypes(data[CIRA_PROJECT_TYPES_KEY])}/>;
}

function ProjectTypesForm({readOnly, initialTypes}: { readOnly: boolean; initialTypes: string[] }) {
    const [types, setTypes] = useState<string[]>(initialTypes);
    const [draft, setDraft] = useState("");
    const update = useUpdateSettings();
    const {show, ToastComponent} = useToast();

    const trimmedDraft = draft.trim();
    const canAdd = trimmedDraft.length > 0 && trimmedDraft.length <= TYPE_NAME_MAX && !types.includes(trimmedDraft);
    const isDirty = JSON.stringify(types) !== JSON.stringify(initialTypes);

    const addType = () => {
        if (!canAdd || readOnly) return;
        setTypes((prev) => [...prev, trimmedDraft]);
        setDraft("");
    };

    const removeType = (target: string) => {
        if (readOnly) return;
        setTypes((prev) => prev.filter((t) => t !== target));
    };

    const save = () => update.mutate(
        {[CIRA_PROJECT_TYPES_KEY]: JSON.stringify(types)},
        {
            onSuccess: () => show("저장했습니다"),
            onError: (e) => show((isAxiosError(e) && e.response?.data?.message) || "저장하지 못했습니다", "error"),
        },
    );

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="mb-1 text-sm font-semibold text-slate-900">프로젝트 유형</h3>
            <p className="mb-4 text-xs text-slate-500">
                CIRA 프로젝트 생성 및 설정 시 선택할 수 있는 유형을 관리합니다. 비어 있으면 기본값(SCRUM, KANBAN)이 사용됩니다.
            </p>
            {readOnly && <p className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">관리자만 변경할 수 있습니다.</p>}

            <div className="flex gap-2">
                <input
                    id="cira-project-type-input"
                    className={inputCls}
                    value={draft}
                    maxLength={TYPE_NAME_MAX}
                    disabled={readOnly}
                    placeholder="예: 웹개발, 인프라, R&D (최대 30자)"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            addType();
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={addType}
                    disabled={readOnly || !canAdd}
                    className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    <Plus className="h-4 w-4"/>
                    추가
                </button>
            </div>
            {trimmedDraft.length > 0 && types.includes(trimmedDraft) && (
                <p className="mt-1 text-xs text-amber-600">이미 등록된 유형입니다.</p>
            )}

            <div className="mt-4 min-h-12 rounded-lg border border-slate-100 bg-slate-50 p-3">
                {types.length === 0 ? (
                    <p className="text-xs text-slate-400">등록된 유형이 없습니다. (기본값: SCRUM, KANBAN 사용 중)</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {types.map((t) => (
                            <span
                                key={t}
                                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                            >
                                {t}
                                {!readOnly && (
                                    <button
                                        type="button"
                                        aria-label={`${t} 삭제`}
                                        onClick={() => removeType(t)}
                                        className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                    >
                                        <X className="h-3 w-3"/>
                                    </button>
                                )}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-5 flex justify-end">
                <button
                    type="button"
                    onClick={save}
                    disabled={readOnly || !isDirty || update.isPending}
                    className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                    저장
                </button>
            </div>
            {ToastComponent}
        </section>
    );
}
