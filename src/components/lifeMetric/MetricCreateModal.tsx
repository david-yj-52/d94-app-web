"use client";

import {useCreateMetric, useFormulaPreview, useMetrics, useMetricTemplates} from "@/hooks/useLifeMetric";
import type {InputField, Metric, MetricTemplate} from "@/types/lifeMetric";
import {isAxiosError} from "axios";
import {useState} from "react";
import FormulaEditor from "./FormulaEditor";
import {formatValue} from "./formulaRef";

const inputCls = "w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";
const EMPTY_FIELD: InputField = {key: "", label: "", type: "NUMBER", mode: "BASELINE"};

/**
 * 새 지표. 기본 = 템플릿 고르고 코드·이름만, 고급 = 입력 항목 정의 + 수식 빌더(@code 자동완성·미리보기).
 * 템플릿에서 "수식 고치기"를 누르면 템플릿 내용을 채운 채 고급 모드로 넘어간다.
 */
export default function MetricCreateModal({onClose, onCreated}: {
    onClose: () => void;
    onCreated: (m: Metric) => void;
}) {
    const {data: templates = []} = useMetricTemplates();
    const {data: metrics = []} = useMetrics();
    const create = useCreateMetric();
    const [mode, setMode] = useState<"template" | "custom">("template");
    const [templateId, setTemplateId] = useState<string | null>(null);
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [fields, setFields] = useState<InputField[]>([]);
    const [formula, setFormula] = useState("");
    const [unit, setUnit] = useState("");
    const [sample, setSample] = useState<Record<string, string>>({});
    const [error, setError] = useState("");

    const sampleInputs = Object.fromEntries(Object.entries(sample).filter(([, v]) => v !== "")
        .map(([k, v]) => [k, isNaN(Number(v)) ? v : Number(v)]));
    const preview = useFormulaPreview(mode === "custom" ? formula : "", sampleInputs);

    const chooseTemplate = (t: MetricTemplate) => {
        setTemplateId(t.id);
        if (!code) setCode(t.code);
        if (!name) setName(t.name);
    };

    const customize = () => {
        const t = templates.find((x) => x.id === templateId);
        if (t) {
            setFields(t.inputSchema);
            setFormula(t.defaultFormula);
            setUnit(t.outputUnit ?? "");
        }
        setMode("custom");
    };

    const submit = () => {
        setError("");
        const req = mode === "template"
            ? {templateId, code, name}
            : {templateId, code, name, inputSchema: fields.filter((f) => f.key), formula, outputUnit: unit || null};
        create.mutate(req, {
            onSuccess: onCreated,
            onError: (e) => setError(isAxiosError(e) ? e.response?.data?.message ?? e.message : String(e)),
        });
    };

    const setField = (i: number, patch: Partial<InputField>) =>
        setFields((fs) => fs.map((f, j) => (j === i ? {...f, ...patch} : f)));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>
            <div className="relative mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-lg font-bold text-slate-900">새 지표</h2>

                <div role="tablist" className="mb-5 inline-flex rounded-lg bg-slate-100 p-1 text-sm">
                    {(["template", "custom"] as const).map((m) => (
                        <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                                className={`rounded-md px-3 py-1.5 ${mode === m ? "bg-white font-semibold text-slate-900 shadow-sm" : "text-slate-500"}`}>
                            {m === "template" ? "템플릿" : "커스텀 수식"}
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    {mode === "template" && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {templates.map((t) => (
                                <button key={t.id} type="button" onClick={() => chooseTemplate(t)}
                                        className={`rounded-xl border p-3 text-left text-sm ${templateId === t.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                                    <span className="block font-semibold text-slate-900">{t.name}</span>
                                    <code className="mt-1 block truncate text-xs text-slate-500">{t.defaultFormula}</code>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>코드 (@참조용, 생성 후 변경 불가) <span className="text-red-500">*</span></label>
                            <input className={inputCls} value={code} aria-label="코드" placeholder="hourly_wage"
                                   onChange={(e) => setCode(e.target.value.toLowerCase())}/>
                        </div>
                        <div>
                            <label className={labelCls}>이름</label>
                            <input className={inputCls} value={name} aria-label="이름" onChange={(e) => setName(e.target.value)}/>
                        </div>
                    </div>

                    {mode === "template" && templateId && (
                        <button type="button" onClick={customize} className="text-sm text-blue-600 hover:underline">
                            이 템플릿의 수식 고치기 →
                        </button>
                    )}

                    {mode === "custom" && (
                        <>
                            <div>
                                <label className={labelCls}>입력 항목 (기준값 = 고정값, 기록 = 수시로 쌓는 값)</label>
                                <div className="space-y-2">
                                    {fields.map((f, i) => (
                                        <div key={i} className="grid grid-cols-[1fr_1fr_6rem_6rem_5rem_2rem] gap-2">
                                            <input className={inputCls} aria-label="키" placeholder="key" value={f.key}
                                                   onChange={(e) => setField(i, {key: e.target.value})}/>
                                            <input className={inputCls} aria-label="라벨" placeholder="라벨" value={f.label}
                                                   onChange={(e) => setField(i, {label: e.target.value})}/>
                                            <select className={inputCls} aria-label="모드" value={f.mode}
                                                    onChange={(e) => setField(i, {mode: e.target.value as InputField["mode"]})}>
                                                <option value="BASELINE">기준값</option>
                                                <option value="LOG">기록</option>
                                            </select>
                                            <select className={inputCls} aria-label="타입" value={f.type}
                                                    onChange={(e) => setField(i, {type: e.target.value as InputField["type"]})}>
                                                <option value="NUMBER">숫자</option>
                                                <option value="DATE">날짜</option>
                                            </select>
                                            <input className={inputCls} aria-label="단위" placeholder="단위" value={f.unit ?? ""}
                                                   onChange={(e) => setField(i, {unit: e.target.value})}/>
                                            <button type="button" aria-label="항목 삭제" className="text-slate-400 hover:text-red-500"
                                                    onClick={() => setFields((fs) => fs.filter((_, j) => j !== i))}>✕</button>
                                        </div>
                                    ))}
                                    <button type="button" className="text-sm text-blue-600 hover:underline"
                                            onClick={() => setFields((fs) => [...fs, EMPTY_FIELD])}>+ 입력 항목</button>
                                </div>
                            </div>

                            <div>
                                <label className={labelCls}>수식 <span className="text-red-500">*</span></label>
                                <FormulaEditor value={formula} onChange={setFormula}
                                               codes={metrics.map((m) => m.code).filter((c) => c !== code)}/>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelCls}>결과 단위</label>
                                    <input className={inputCls} aria-label="결과 단위" value={unit} placeholder="원/시간"
                                           onChange={(e) => setUnit(e.target.value)}/>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <p className="mb-2 text-xs font-medium text-slate-600">미리보기 (기록 집계는 0으로 계산)</p>
                                <div className="mb-2 flex flex-wrap gap-2">
                                    {fields.filter((f) => f.key && f.mode === "BASELINE").map((f) => (
                                        <input key={f.key} className="h-8 w-36 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                                               aria-label={`예시 ${f.key}`} placeholder={f.type === "DATE" ? `${f.key} (yyyy-MM-dd)` : f.key}
                                               type={f.type === "DATE" ? "date" : "text"} value={sample[f.key] ?? ""}
                                               onChange={(e) => setSample((s) => ({...s, [f.key]: e.target.value}))}/>
                                    ))}
                                </div>
                                <p aria-live="polite" className="text-sm">
                                    {!formula.trim() ? <span className="text-slate-400">수식을 입력하세요</span>
                                        : !preview.data ? <span className="text-slate-400">계산 중…</span>
                                        : preview.data.error ?<span className="text-amber-600">{preview.data.error}</span>
                                            : <span className="font-semibold text-slate-900">= {formatValue(preview.data?.value ?? null)} {unit}</span>}
                                </p>
                            </div>
                        </>
                    )}

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                                className="h-10 flex-1 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">취소</button>
                        <button type="button" onClick={submit}
                                disabled={create.isPending || !code || (mode === "template" ? !templateId : !formula.trim())}
                                className="h-10 flex-1 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                            만들기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
