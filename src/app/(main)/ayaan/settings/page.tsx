"use client";

import {useEffect, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useToast} from "@/components/ui/Toast";
import {
    deleteSkill, deleteWorkspace, getConfig, getPermissions, getSkills, getTools, getWorkspaces, putConfig, putPermissions,
    putSkill, putTool, putWorkspace,
} from "@/lib/api/ayaan";
import {CONFIG_HELP} from "../constant/help";
import HelpCard from "../components/HelpCard";
import {btnPrimary, btnSecondary, inputCls} from "../format";
import {validateConfigField} from "./validate";
import {toToolBody, toToolForm, toWorkspaceBody, type ToolForm} from "./toolBody";
import {CATEGORIES, TOOLS, type AyaanPermission, type AyaanSkill, type AyaanTool, type AyaanWorkspace, type ToolCd} from "@/types/ayaan";
import {askWarning, EMPTY_SKILL, pluginRefs, toSkillBody} from "./skillPermission";
import {ayaanError} from "../format";

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

function ToolCard({tool, skills}: { tool: AyaanTool; skills: AyaanSkill[] }) {
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
            {([["planSkillCd", "PLAN_SKILL_CD", "PLAN"], ["devSkillCd", "DEV_SKILL_CD", "DEV"]] as const).map(([f, helpKey, phase]) => (
                <Field key={f} id={`tool-${t.toolCd}-${f}`} helpKey={helpKey} kind="select" value={t[f]} error={errors[f]}
                       options={["", ...skills.filter((s) => s.toolCd === t.toolCd && (s.phase === phase || s.phase === "ANY")).map((s) => s.skillCd)]}
                       onChange={(v) => setT({...t, [f]: v})}/>
            ))}
            <button className={btnPrimary} disabled={save.isPending} onClick={onSave}>{t.toolCd} 저장</button>
            {ToastComponent}
        </section>
    );
}

function ToolsTab() {
    const q = useQuery({queryKey: ["ayaanTools"], queryFn: getTools});
    const skills = useQuery({queryKey: ["ayaanSkills"], queryFn: getSkills});
    const order = (q.data ?? []).slice().sort((a, b) => TOOLS.indexOf(a.toolCd) - TOOLS.indexOf(b.toolCd));
    if (!skills.data) return null;  // 기본 skill 드롭다운 옵션이 준비된 뒤 폼 초기화
    return <div className="space-y-4">{order.map((t) => <ToolCard key={t.toolCd} tool={t} skills={skills.data}/>)}</div>;
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

function SkillsTab() {
    const qc = useQueryClient();
    const {show, ToastComponent} = useToast();
    const q = useQuery({queryKey: ["ayaanSkills"], queryFn: getSkills});
    const cfg = useQuery({queryKey: ["ayaanConfig"], queryFn: getConfig});
    const [form, setForm] = useState<AyaanSkill | null>(null);
    const [isNew, setIsNew] = useState(false);
    const done = () => qc.invalidateQueries({queryKey: ["ayaanSkills"]});
    const save = useMutation({
        mutationFn: (s: AyaanSkill) => putSkill(s.skillCd, s),
        onSuccess: (r) => {
            setForm(null);
            show(r.warnings.length ? `저장됨 — ${r.warnings.join(", ")}: 전역 정책 CLAUDE_PLUGINS에 추가하세요.` : "저장되었습니다.", r.warnings.length ? "error" : undefined);
            done();
        },
        onError: (e) => show(ayaanError(e, "저장에 실패했습니다."), "error"),
    });
    const remove = useMutation({mutationFn: deleteSkill, onSuccess: () => { show("삭제했습니다. 이 skill을 기본값으로 쓰던 Tool은 기본값이 비워집니다."); done(); }});
    const submit = () => {
        const body = form && toSkillBody(form);
        if (typeof body === "string") return show(body, "error");
        if (body) save.mutate(body);
    };
    const set = (patch: Partial<AyaanSkill>) => setForm({...form!, ...patch});
    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-600">skill은 작업 프롬프트 맨 앞에 붙는 호출 문자열입니다(Claude는 <code>/plugin:skill</code>). 작업에서 고른 skill이 Tool 기본값보다 우선합니다.</p>
            <button className={btnSecondary} onClick={() => { setForm(EMPTY_SKILL); setIsNew(true); }}>Skill 추가</button>
            <table className="w-full rounded-xl border border-slate-200 bg-white text-sm">
                <thead className="text-left text-xs text-slate-500">
                <tr><th className="p-2">코드</th><th>이름</th><th>Tool</th><th>단계</th><th>호출</th><th>플러그인</th><th>사용</th><th/></tr>
                </thead>
                <tbody>
                {(q.data ?? []).map((s) => (
                    <tr key={s.skillCd} className="border-t border-slate-100" title={s.description ?? ""}>
                        <td className="p-2 font-mono">{s.skillCd}</td><td>{s.skillNm}</td><td>{s.toolCd}</td><td>{s.phase}</td>
                        <td className="font-mono text-xs">{s.invokeText}</td><td className="text-xs">{s.pluginRef ?? "-"}</td><td>{s.enabled ? "✔" : "-"}</td>
                        <td className="flex gap-1 py-1">
                            <button className={btnSecondary} onClick={() => { setForm({...s}); setIsNew(false); }}>편집</button>
                            <button className={btnSecondary} onClick={() => window.confirm(`${s.skillCd}을 삭제할까요?`) && remove.mutate(s.skillCd)}>삭제</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {form && (
                <section aria-label="Skill 편집" className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-xs font-medium text-slate-600">
                    <label>코드<input className={inputCls} value={form.skillCd} disabled={!isNew} onChange={(e) => set({skillCd: e.target.value})}/></label>
                    <label>이름<input className={inputCls} value={form.skillNm} onChange={(e) => set({skillNm: e.target.value})}/></label>
                    <label>Tool<select className={inputCls} value={form.toolCd} onChange={(e) => set({toolCd: e.target.value as ToolCd})}>{TOOLS.map((t) => <option key={t}>{t}</option>)}</select></label>
                    <label>단계<select className={inputCls} value={form.phase} onChange={(e) => set({phase: e.target.value as AyaanSkill["phase"]})}>
                        <option value="PLAN">PLAN (기획)</option><option value="DEV">DEV (개발)</option><option value="ANY">ANY</option></select></label>
                    <label className="col-span-2">호출 문자열<input className={inputCls} value={form.invokeText} placeholder="/superpowers:brainstorming" onChange={(e) => set({invokeText: e.target.value})}/></label>
                    <label className="col-span-2">플러그인 (Claude 전용, plugin@marketplace)
                        <input className={inputCls} list="ayaan-plugin-refs" value={form.pluginRef ?? ""} disabled={form.toolCd !== "CLAUDE"} onChange={(e) => set({pluginRef: e.target.value})}/>
                        <datalist id="ayaan-plugin-refs">{pluginRefs(cfg.data?.CLAUDE_PLUGINS).map((r) => <option key={r} value={r}/>)}</datalist>
                    </label>
                    <label className="col-span-2">설명<textarea className={`${inputCls} h-20 py-2`} value={form.description ?? ""} onChange={(e) => set({description: e.target.value})}/></label>
                    <label>정렬<input type="number" className={inputCls} value={form.sortNo} onChange={(e) => set({sortNo: Number(e.target.value) || 0})}/></label>
                    <label className="flex items-center gap-2 pt-5"><input type="checkbox" checked={form.enabled} onChange={(e) => set({enabled: e.target.checked})}/> 사용</label>
                    <div className="col-span-2 flex gap-2">
                        <button className={btnPrimary} disabled={save.isPending} onClick={submit}>저장</button>
                        <button className={btnSecondary} onClick={() => setForm(null)}>취소</button>
                    </div>
                </section>
            )}
            {ToastComponent}
        </div>
    );
}

const EMPTY_PERM: AyaanPermission = {toolCd: "*", category: "SHELL", matcher: "*", decision: "ASK", priority: 0, description: null};

function PermissionsTab() {
    const qc = useQueryClient();
    const {show, ToastComponent} = useToast();
    const q = useQuery({queryKey: ["ayaanPermissions"], queryFn: getPermissions});
    const [rows, setRows] = useState<AyaanPermission[]>([]);
    const [errors, setErrors] = useState<Errors>({});
    useEffect(() => { if (q.data) setRows(q.data); }, [q.data]);
    const save = useMutation({
        mutationFn: () => putPermissions(rows),
        onSuccess: () => { setErrors({}); show("저장되었습니다."); qc.invalidateQueries({queryKey: ["ayaanPermissions"]}); },
        onError: (e: any) => {
            if (e?.response?.status === 422) setErrors(e.response.data?.data ?? {});
            show(ayaanError(e, "저장에 실패했습니다."), "error");
        },
    });
    const set = (i: number, patch: Partial<AyaanPermission>) => setRows(rows.map((r, j) => (j === i ? {...r, ...patch} : r)));
    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                <p>AI가 파일 쓰기·셸·push·배포·네트워크·MCP 도구를 쓰기 전에 이 표로 판단합니다. <b>ASK</b>는 Telegram/웹으로 승인을 받고, 승인은 바로 그 호출 1회에만 유효합니다.</p>
                <p>Tool별 행이 전체(*) 행보다 우선하고, 다음으로 우선순위가 높은 행, 같으면 DENY &gt; ASK &gt; ALLOW 순입니다. 실행 중 승인은 현재 Claude만 지원합니다.</p>
                <p>명령 접두어 매칭은 우회할 수 있습니다(<code>sh -c &quot;git push&quot;</code>). push·배포를 확실히 막으려면 서버에 그 자격증명을 두지 마세요.</p>
            </div>
            <table className="w-full rounded-xl border border-slate-200 bg-white text-sm">
                <thead className="text-left text-xs text-slate-500">
                <tr><th className="p-2">Tool</th><th>범주</th><th>매처</th><th>결정</th><th>우선순위</th><th>설명</th><th/></tr>
                </thead>
                <tbody>
                {rows.map((r, i) => {
                    const warn = askWarning(r);
                    const err = Object.entries(errors).filter(([k]) => k.startsWith(`${i}.`)).map(([k, v]) => `${k.split(".")[1]}: ${v}`).join(", ");
                    return (
                        <tr key={i} className="border-t border-slate-100 align-top">
                            <td className="p-1"><select aria-label={`${i + 1}행 Tool`} className={inputCls} value={r.toolCd} onChange={(e) => set(i, {toolCd: e.target.value as AyaanPermission["toolCd"]})}>
                                <option value="*">전체(*)</option>{TOOLS.map((t) => <option key={t}>{t}</option>)}</select></td>
                            <td className="p-1"><select aria-label={`${i + 1}행 범주`} className={inputCls} value={r.category} onChange={(e) => set(i, {category: e.target.value as AyaanPermission["category"]})}>
                                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></td>
                            <td className="p-1"><input aria-label={`${i + 1}행 매처`} className={inputCls} value={r.matcher} onChange={(e) => set(i, {matcher: e.target.value})}/></td>
                            <td className="p-1"><select aria-label={`${i + 1}행 결정`} className={inputCls} value={r.decision} onChange={(e) => set(i, {decision: e.target.value as AyaanPermission["decision"]})}>
                                <option>ALLOW</option><option>ASK</option><option>DENY</option></select>
                                {warn && <p role="alert" className="text-xs text-amber-700">{warn}</p>}
                                {err && <p role="alert" className="text-xs text-red-500">{err}</p>}</td>
                            <td className="w-20 p-1"><input aria-label={`${i + 1}행 우선순위`} type="number" className={inputCls} value={r.priority} onChange={(e) => set(i, {priority: Number(e.target.value) || 0})}/></td>
                            <td className="p-1"><input aria-label={`${i + 1}행 설명`} className={inputCls} value={r.description ?? ""} onChange={(e) => set(i, {description: e.target.value || null})}/></td>
                            <td className="p-1"><button className={btnSecondary} onClick={() => setRows(rows.filter((_, j) => j !== i))}>삭제</button></td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
            <p className="text-xs text-slate-500">매처: SHELL·GIT_PUSH·DEPLOY는 명령 앞부분(<code>git push</code>), FILE_WRITE는 경로 glob(<code>**/.env*</code>), NETWORK는 도메인, MCP는 <code>server:tool</code>, <code>*</code>는 범주 전체.</p>
            <div className="flex gap-2">
                <button className={btnSecondary} onClick={() => setRows([...rows, EMPTY_PERM])}>행 추가</button>
                <button className={btnPrimary} disabled={save.isPending} onClick={() => save.mutate()}>전체 저장</button>
            </div>
            {ToastComponent}
        </div>
    );
}

const TABS = [["global", "전역 정책"], ["tool", "Tool"], ["workspace", "작업공간"], ["skill", "Skill"], ["permission", "권한"]] as const;

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
                {tab === "skill" && <SkillsTab/>}
                {tab === "permission" && <PermissionsTab/>}
            </div>
        </div>
    );
}
