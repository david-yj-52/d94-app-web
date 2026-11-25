"use client";

import {useEffect, useRef, useState} from "react";
import {useSearchParams} from "next/navigation";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useToast} from "@/components/ui/Toast";
import {deleteWorkspace, getConfig, getTools, getWorkspaces, putConfig, putTool, putWorkspace} from "@/lib/api/ayaan";
import {CONFIG_HELP} from "@/app/(main)/ayaan/constant/help";
import HelpCard from "@/app/(main)/ayaan/components/HelpCard";
import {btnPrimary, btnSecondary, inputCls} from "@/app/(main)/ayaan/format";
import {validateConfigField} from "@/app/(main)/ayaan/settings/validate";
import {toToolBody, toToolForm, toWorkspaceBody, type ToolForm} from "@/app/(main)/ayaan/settings/toolBody";
import {TOOLS, type AyaanRepo, type AyaanTool, type AyaanWorkspace, type ToolCd} from "@/types/ayaan";

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

const EMPTY_REPO: AyaanRepo = {repoNm: "", gitUrl: "", baseBranch: "main", deployBranch: null, sortOrd: 0};
const newWs = (projectKey = ""): AyaanWorkspace => ({projectKey, workspacePath: null, defaultTool: "CLAUDE", promptTemplate: "", repos: [{...EMPTY_REPO}]});
const WS_FIELDS: [keyof AyaanWorkspace, string, Kind, string[]?][] = [
    ["projectKey", "PROJECT_KEY", "text"],
    ["defaultTool", "DEFAULT_TOOL", "select", ["CLAUDE", "CODEX", "ANTIGRAVITY", "CURSOR", "FAKE"]],
    ["promptTemplate", "PROMPT_TEMPLATE", "textarea"],
];

function WorkspacesTab() {
    const qc = useQueryClient();
    const {show, ToastComponent} = useToast();
    const q = useQuery({queryKey: ["ayaanWorkspaces"], queryFn: getWorkspaces});
    const urlKey = useSearchParams().get("projectKey");
    const [form, setForm] = useState<AyaanWorkspace | null>(null);
    const [errors, setErrors] = useState<Errors>({});
    const opened = useRef(false);
    // ?projectKey= 가 있으면 그 프로젝트의 폼을 한 번 연다 (매핑이 있으면 편집, 없으면 새 폼)
    useEffect(() => {
        if (opened.current || !urlKey || !q.data) return;
        opened.current = true;
        const w = q.data.find((x) => x.projectKey === urlKey);
        setForm(w ? {...w, promptTemplate: w.promptTemplate ?? ""} : newWs(urlKey));
    }, [urlKey, q.data]);
    const setRepo = (i: number, patch: Partial<AyaanRepo>) =>
        form && setForm({...form, repos: form.repos.map((r, j) => (j === i ? {...r, ...patch} : r))});
    const moveRepo = (i: number, d: number) => {
        if (!form) return;
        const repos = form.repos.slice();
        [repos[i], repos[i + d]] = [repos[i + d], repos[i]];
        setForm({...form, repos});
    };
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
            <button className={btnSecondary} onClick={() => setForm(newWs())}>작업공간 추가</button>
            <ul className="space-y-2">
                {(q.data ?? []).map((w) => (
                    <li key={w.projectKey} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-sm">
                        <span><b>{w.projectKey}</b> 저장소 {w.repos.length}개 · {w.defaultTool}</span>
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
                    <fieldset className="space-y-2 py-3">
                        <legend className="text-xs font-medium text-slate-600">저장소 (위에서부터 순서대로 사용)</legend>
                        {errors.repos && <p role="alert" className="text-xs text-red-500">{errors.repos}</p>}
                        {form.repos.map((r, i) => (
                            <div key={i} className="flex flex-wrap items-center gap-2">
                                <input aria-label={`저장소 ${i + 1} 이름`} placeholder="이름" className={`${inputCls} w-32`} value={r.repoNm} onChange={(e) => setRepo(i, {repoNm: e.target.value})}/>
                                <input aria-label={`저장소 ${i + 1} URL`} placeholder="Git URL" className={`${inputCls} min-w-48 flex-1`} value={r.gitUrl} onChange={(e) => setRepo(i, {gitUrl: e.target.value})}/>
                                <input aria-label={`저장소 ${i + 1} 기준 브랜치`} placeholder="기준 브랜치" className={`${inputCls} w-32`} value={r.baseBranch} onChange={(e) => setRepo(i, {baseBranch: e.target.value})}/>
                                <input aria-label={`저장소 ${i + 1} 배포 브랜치`} placeholder="배포 브랜치" className={`${inputCls} w-32`} value={r.deployBranch ?? ""} onChange={(e) => setRepo(i, {deployBranch: e.target.value})}/>
                                <button type="button" aria-label={`저장소 ${i + 1} 위로`} className={btnSecondary} disabled={i === 0} onClick={() => moveRepo(i, -1)}>↑</button>
                                <button type="button" aria-label={`저장소 ${i + 1} 아래로`} className={btnSecondary} disabled={i === form.repos.length - 1} onClick={() => moveRepo(i, 1)}>↓</button>
                                <button type="button" aria-label={`저장소 ${i + 1} 삭제`} className={btnSecondary} onClick={() => setForm({...form, repos: form.repos.filter((_, j) => j !== i)})}>삭제</button>
                            </div>
                        ))}
                        <button type="button" className={btnSecondary} onClick={() => setForm({...form, repos: [...form.repos, {...EMPTY_REPO}]})}>저장소 추가</button>
                    </fieldset>
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

/** 기준정보 › Ayaan 그룹. 전역 정책은 d94 기준정보(SN_SETTING ayaan.*), Tool·작업공간은 SN_AYN_* — 모두 ayaan API 경유(값 검증은 ayaan) */
export default function AyaanSettingsPanel() {
    const urlTab = useSearchParams().get("tab");
    const [tab, setTab] = useState<(typeof TABS)[number][0]>(TABS.find(([k]) => k === urlTab)?.[0] ?? "global");
    return (
        <section className="space-y-4">
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
        </section>
    );
}
