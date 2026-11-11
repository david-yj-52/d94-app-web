"use client";

import {useEffect, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useToast} from "@/components/ui/Toast";
import {deleteWorkspace, getConfig, getTools, getWorkspaces, putConfig, putTool, putWorkspace} from "@/lib/api/ayaan";
import {CONFIG_HELP} from "../constant/help";
import HelpCard from "../components/HelpCard";
import {btnPrimary, btnSecondary, inputCls} from "../format";
import {validateConfigField} from "./validate";
import {toToolBody, toToolForm, toWorkspaceBody, type ToolForm} from "./toolBody";
import {TOOLS, type AyaanTool, type AyaanWorkspace, type ToolCd} from "@/types/ayaan";

type Errors = Record<string, string>;

type Kind = "text" | "number" | "checkbox" | "select" | "textarea";

/** 라벨 + 입력(종류별) + ? 툴팁/설명 카드 + 필드 오류 */
function Field({id, helpKey, value, onChange, error, kind = "text", options}: {
    id: string; helpKey: string; value: string; onChange: (v: string) => void; error?: string; kind?: Kind; options?: string[];
}) {
    const common = {id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-err` : undefined};
    let input;
    if (kind === "checkbox") {
        input = <input {...common} type="checkbox" className="h-4 w-4" checked={value === "true"} onChange={(e) => onChange(String(e.target.checked))}/>;
    } else if (kind === "select") {
        input = (
            <select {...common} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
                {options?.map((o) => <option key={o} value={o}>{o || "(없음)"}</option>)}
            </select>
        );
    } else if (kind === "textarea") {
        input = <textarea {...common} className={`${inputCls} h-28 py-2`} value={value} onChange={(e) => onChange(e.target.value)}/>;
    } else {
        input = <input {...common} type={kind} {...(kind === "number" ? {step: 1, inputMode: "numeric" as const} : {})} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}/>;
    }
    return (
        <div className="py-3">
            <label htmlFor={id} className="mr-2 text-xs font-medium text-slate-600">
                {CONFIG_HELP[helpKey].label} <span className="text-slate-400">({helpKey})</span>
            </label>
            {input}
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

const TOOL_FIELDS: [keyof ToolForm, string, Kind, string[]?][] = [
    ["enabled", "ENABLED", "checkbox"],
    ["authMode", "AUTH_MODE", "select", ["ACCOUNT", "API_KEY"]],
    ["planName", "PLAN_NAME", "text"],
    ["apiKeyRef", "API_KEY_REF", "text"],
    ["model", "MODEL", "text"],
    ["maxConcurrency", "MAX_CONCURRENCY", "number"],
    ["fallbackResetRule", "FALLBACK_RESET_RULE", "text"],
    ["budgetTokens", "BUDGET_TOKENS", "number"],
    ["budgetPeriod", "BUDGET_PERIOD", "select", ["", "DAILY", "MONTHLY"]],
];

function ToolCard({tool}: { tool: AyaanTool }) {
    const qc = useQueryClient();
    const {show, ToastComponent} = useToast();
    const [t, setT] = useState<ToolForm>(toToolForm(tool));
    const [errors, setErrors] = useState<Errors>({});
    const save = useMutation({
        mutationFn: (body: AyaanTool) => putTool(body.toolCd, body),
        onSuccess: () => { setErrors({}); show(`${t.toolCd} 저장되었습니다.`); qc.invalidateQueries({queryKey: ["ayaanTools"]}); },
        onError: (e: any) => {
            if (e?.response?.status === 422) setErrors(e.response.data?.data ?? {});
            show("저장에 실패했습니다.", "error");
        },
    });
    const onSave = () => {
        const r = toToolBody(t);
        setErrors(r.errors);
        if (r.body) save.mutate(r.body);
    };
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="font-bold text-slate-900">{t.toolCd}</h2>
            {TOOL_FIELDS.map(([f, helpKey, kind, options]) => (
                <Field key={f} id={`tool-${t.toolCd}-${f}`} helpKey={helpKey} kind={kind} options={options}
                       value={String(t[f] ?? "")} error={errors[f] ?? errors[helpKey]}
                       onChange={(v) => setT({...t, [f]: kind === "checkbox" ? v === "true" : v})}/>
            ))}
            <button className={btnPrimary} disabled={save.isPending} onClick={onSave}>{t.toolCd} 저장</button>
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
const WS_FIELDS: [keyof AyaanWorkspace, string, Kind, string[]?][] = [
    ["projectKey", "PROJECT_KEY", "text"], ["workspacePath", "WORKSPACE_PATH", "text"],
    ["defaultTool", "DEFAULT_TOOL", "select", ["CLAUDE", "CODEX", "GEMINI", "CURSOR", "FAKE"]],
    ["promptTemplate", "PROMPT_TEMPLATE", "textarea"],
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
                    {WS_FIELDS.map(([f, helpKey, kind, options]) => (
                        <Field key={f} id={`ws-${f}`} helpKey={helpKey} kind={kind} options={options} value={String(form[f] ?? "")}
                               error={errors[f] ?? errors[helpKey]} onChange={(v) => setForm({...form, [f]: v as ToolCd & string})}/>
                    ))}
                    <div className="flex gap-2">
                        <button className={btnPrimary} disabled={save.isPending} onClick={() => save.mutate(toWorkspaceBody(form))}>저장</button>
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
