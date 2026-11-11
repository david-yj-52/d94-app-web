"use client";

import {useEffect, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useToast} from "@/components/ui/Toast";
import {deleteWorkspace, getConfig, getTools, getWorkspaces, putConfig, putTool, putWorkspace} from "@/lib/api/ayaan";
import {CONFIG_HELP} from "../constant/help";
import HelpCard from "../components/HelpCard";
import {btnPrimary, btnSecondary, inputCls} from "../format";
import {validateConfigField} from "./validate";
import {TOOLS, type AyaanTool, type AyaanWorkspace} from "@/types/ayaan";

type Errors = Record<string, string>;

/** 라벨 + 입력 + ? 툴팁/설명 카드 + 필드 오류 */
function Field({id, helpKey, value, onChange, error, multiline}: {
    id: string; helpKey: string; value: string; onChange: (v: string) => void; error?: string; multiline?: boolean;
}) {
    const Tag = multiline ? "textarea" : "input";
    return (
        <div className="py-3">
            <label htmlFor={id} className="block text-xs font-medium text-slate-600">
                {CONFIG_HELP[helpKey].label} <span className="text-slate-400">({helpKey})</span>
            </label>
            <Tag id={id} className={multiline ? `${inputCls} h-28 py-2` : inputCls} value={value} aria-invalid={!!error}
                 aria-describedby={error ? `${id}-err` : undefined} onChange={(e) => onChange(e.target.value)}/>
            {error && <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-red-500">{error}</p>}
            <HelpCard helpKey={helpKey}/>
        </div>
    );
}

function GlobalTab() {
    const qc = useQueryClient();
    const {show, ToastComponent} = useToast();
    const q = useQuery({queryKey: ["ayaanConfig"], queryFn: getConfig});
    const [values, setValues] = useState<Record<string, string>>({});
    const [errors, setErrors] = useState<Errors>({});
    useEffect(() => { if (q.data) setValues(q.data); }, [q.data]);
    const save = useMutation({
        mutationFn: () => putConfig(values),
        onSuccess: () => { setErrors({}); show("저장되었습니다."); qc.invalidateQueries({queryKey: ["ayaanConfig"]}); },
        onError: (e: any) => {
            if (e?.response?.status === 422) setErrors(e.response.data?.data ?? {});
            show("저장에 실패했습니다.", "error");
        },
    });
    const onSave = () => {
        const local: Errors = {};
        for (const [k, v] of Object.entries(values)) {
            const m = validateConfigField(k, v ?? "");
            if (m) local[k] = m;
        }
        setErrors(local);
        if (Object.keys(local).length === 0) save.mutate();
    };
    return (
        <div className="divide-y divide-slate-100">
            {Object.keys(values).map((k) => CONFIG_HELP[k] && (
                <Field key={k} id={`cfg-${k}`} helpKey={k} value={values[k] ?? ""} error={errors[k]}
                       onChange={(v) => setValues({...values, [k]: v})}/>
            ))}
            <div className="pt-4"><button className={btnPrimary} disabled={save.isPending} onClick={onSave}>저장</button></div>
            {ToastComponent}
        </div>
    );
}

const TOOL_FIELDS: [keyof AyaanTool, string][] = [
    ["enabled", "ENABLED"], ["authMode", "AUTH_MODE"], ["planName", "PLAN_NAME"], ["apiKeyRef", "API_KEY_REF"],
    ["model", "MODEL"], ["maxConcurrency", "MAX_CONCURRENCY"], ["fallbackResetRule", "FALLBACK_RESET_RULE"],
    ["budgetTokens", "BUDGET_TOKENS"], ["budgetPeriod", "BUDGET_PERIOD"],
];

function ToolCard({tool}: { tool: AyaanTool }) {
    const qc = useQueryClient();
    const {show, ToastComponent} = useToast();
    const [t, setT] = useState<AyaanTool>(tool);
    const [errors, setErrors] = useState<Errors>({});
    const save = useMutation({
        mutationFn: () => putTool(t.toolCd, {
            ...t,
            enabled: String(t.enabled) === "true",
            maxConcurrency: Number(t.maxConcurrency),
            budgetTokens: t.budgetTokens === null || String(t.budgetTokens) === "" ? null : Number(t.budgetTokens),
        }),
        onSuccess: () => { setErrors({}); show(`${t.toolCd} 저장되었습니다.`); qc.invalidateQueries({queryKey: ["ayaanTools"]}); },
        onError: (e: any) => {
            if (e?.response?.status === 422) setErrors(e.response.data?.data ?? {});
            show("저장에 실패했습니다.", "error");
        },
    });
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">{t.toolCd}</h2>
            {TOOL_FIELDS.map(([f, helpKey]) => (
                <Field key={f} id={`tool-${t.toolCd}-${f}`} helpKey={helpKey} value={String(t[f] ?? "")}
                       error={errors[f] ?? errors[helpKey]} onChange={(v) => setT({...t, [f]: v})}/>
            ))}
            <button className={btnPrimary} disabled={save.isPending} onClick={() => save.mutate()}>{t.toolCd} 저장</button>
            {ToastComponent}
        </section>
    );
}

function ToolsTab() {
    const q = useQuery({queryKey: ["ayaanTools"], queryFn: getTools});
    const order = (q.data ?? []).slice().sort((a, b) => TOOLS.indexOf(a.toolCd) - TOOLS.indexOf(b.toolCd));
    return <div className="space-y-4">{order.map((t) => <ToolCard key={t.toolCd} tool={t}/>)}</div>;
}

const EMPTY_WS: AyaanWorkspace = {projectKey: "", workspacePath: "", defaultTool: "CLAUDE", promptTemplate: ""};
const WS_FIELDS: [keyof AyaanWorkspace, string][] = [
    ["projectKey", "PROJECT_KEY"], ["workspacePath", "WORKSPACE_PATH"], ["defaultTool", "DEFAULT_TOOL"], ["promptTemplate", "PROMPT_TEMPLATE"],
];

function WorkspacesTab() {
    const qc = useQueryClient();
    const {show, ToastComponent} = useToast();
    const q = useQuery({queryKey: ["ayaanWorkspaces"], queryFn: getWorkspaces});
    const [form, setForm] = useState<AyaanWorkspace | null>(null);
    const [errors, setErrors] = useState<Errors>({});
    const done = () => qc.invalidateQueries({queryKey: ["ayaanWorkspaces"]});
    const save = useMutation({
        mutationFn: (w: AyaanWorkspace) => putWorkspace(w.projectKey, w),
        onSuccess: () => { setForm(null); setErrors({}); show("저장되었습니다."); done(); },
        onError: (e: any) => {
            if (e?.response?.status === 422) setErrors(e.response.data?.data ?? {});
            show("저장에 실패했습니다.", "error");
        },
    });
    const remove = useMutation({mutationFn: deleteWorkspace, onSuccess: () => { show("삭제했습니다."); done(); }});
    return (
        <div className="space-y-4">
            <button className={btnSecondary} onClick={() => setForm(EMPTY_WS)}>작업공간 추가</button>
            <ul className="space-y-2">
                {(q.data ?? []).map((w) => (
                    <li key={w.projectKey} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm">
                        <span><b>{w.projectKey}</b> {w.workspacePath} · {w.defaultTool}</span>
                        <span className="flex gap-2">
                            <button className={btnSecondary} onClick={() => setForm({...w, promptTemplate: w.promptTemplate ?? ""})}>편집</button>
                            <button className={btnSecondary} onClick={() => window.confirm(`${w.projectKey} 작업공간을 삭제할까요?`) && remove.mutate(w.projectKey)}>삭제</button>
                        </span>
                    </li>
                ))}
            </ul>
            {form && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5">
                    {WS_FIELDS.map(([f, helpKey]) => (
                        <Field key={f} id={`ws-${f}`} helpKey={helpKey} value={String(form[f] ?? "")} multiline={f === "promptTemplate"}
                               error={errors[f] ?? errors[helpKey]} onChange={(v) => setForm({...form, [f]: v})}/>
                    ))}
                    <div className="flex gap-2">
                        <button className={btnPrimary} disabled={save.isPending} onClick={() => save.mutate(form)}>저장</button>
                        <button className={btnSecondary} onClick={() => setForm(null)}>취소</button>
                    </div>
                </section>
            )}
            {ToastComponent}
        </div>
    );
}

const TABS = [["global", "전역 정책"], ["tool", "Tool"], ["workspace", "작업공간"]] as const;

export default function AyaanSettingsPage() {
    const [tab, setTab] = useState<(typeof TABS)[number][0]>("global");
    return (
        <div className="mx-auto max-w-3xl space-y-4 px-4">
            <h1 className="text-2xl font-bold text-slate-900">Ayaan 기준정보</h1>
            <div role="tablist" className="flex gap-2 border-b border-slate-200">
                {TABS.map(([k, label]) => (
                    <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                            className={`px-4 py-2 text-sm ${tab === k ? "border-b-2 border-blue-600 font-semibold text-blue-600" : "text-slate-500"}`}>{label}</button>
                ))}
            </div>
            <div role="tabpanel">
                {tab === "global" && <GlobalTab/>}
                {tab === "tool" && <ToolsTab/>}
                {tab === "workspace" && <WorkspacesTab/>}
            </div>
        </div>
    );
}
