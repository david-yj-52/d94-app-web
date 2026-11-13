"use client";

import {useState} from "react";
import Link from "next/link";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {SkeletonRow} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {useIssues} from "@/hooks/useIssues";
import {useProjects} from "@/hooks/useProjects";
import {createTask, getSkills, getTasks, getTools, getWorkspaces} from "@/lib/api/ayaan";
import {TASK_STATUSES, TOOLS, type CreateTaskRequest} from "@/types/ayaan";
import {toCreateBody} from "./taskBody";
import {skillOptions} from "../settings/skillPermission";
import {ayaanError, btnPrimary, btnSecondary, fmtTime, inputCls, STATUS_CLASS, statusLabel} from "../format";

export default function AyaanTasksPage() {
    const qc = useQueryClient();
    const {show, ToastComponent} = useToast();
    const [status, setStatus] = useState("");
    const [tool, setTool] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [existingId, setExistingId] = useState<string | null>(null);
    const [projectKey, setProjectKey] = useState("");
    const [issueKey, setIssueKey] = useState("");
    const [prompt, setPrompt] = useState("");
    const [newTool, setNewTool] = useState("");
    const [policy, setPolicy] = useState("");
    const [phase, setPhase] = useState<"PLAN" | "DEV">("PLAN");
    const [skillCd, setSkillCd] = useState("");
    const list = useQuery({
        queryKey: ["ayaanTasks", status, tool],
        queryFn: () => getTasks({status: status || undefined, tool: tool || undefined}),
        refetchInterval: 30_000,
    });
    const projects = useProjects();
    const workspaces = useQuery({queryKey: ["ayaanWorkspaces"], queryFn: getWorkspaces, enabled: showForm});
    const mapped = new Map((workspaces.data ?? []).map((w) => [w.projectKey, w.workspacePath]));
    const skills = useQuery({queryKey: ["ayaanSkills"], queryFn: getSkills, enabled: showForm});
    const tools = useQuery({queryKey: ["ayaanTools"], queryFn: getTools, enabled: showForm});
    // Tool 을 비우면 작업공간 기본 Tool 을 기준으로 skill 을 고른다
    const ws = workspaces.data?.find((w) => w.projectKey === projectKey);
    const effTool = newTool || ws?.defaultTool || "CLAUDE";
    const toolRow = tools.data?.find((t) => t.toolCd === effTool);
    const defaultSkill = phase === "PLAN" ? toolRow?.planSkillCd : toolRow?.devSkillCd;
    const project = projects.data?.find((p) => p.key === projectKey);
    // ponytail: 이슈 100건까지만 드롭다운에 표시, 넘으면 검색 입력 추가
    const issues = useIssues(project?.id ?? "", {size: 100});
    const create = useMutation({
        mutationFn: (b: CreateTaskRequest) => createTask(b),
        onSuccess: () => {
            setExistingId(null);
            show("작업을 등록했습니다.");
            setShowForm(false);
            setIssueKey("");
            setPrompt("");
            qc.invalidateQueries({queryKey: ["ayaanTasks"]});
        },
        onError: (e: any) => {
            const dup = e?.response?.status === 409;
            setExistingId(dup ? (e.response.data?.data?.id ?? null) : null);
            show(dup ? "이미 등록된 작업입니다." : ayaanError(e, "등록에 실패했습니다."), "error");
        },
    });
    const submit = () => {
        const body = toCreateBody({projectKey, issueKey, prompt, tool: newTool, policy, phase, skillCd});
        if (typeof body === "string") return show(body, "error");
        create.mutate(body);
    };
    return (
        <div className="mx-auto max-w-6xl space-y-4 px-4">
            <div className="flex items-end justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Ayaan 작업</h1>
                <button className={btnPrimary} onClick={() => setShowForm(!showForm)}>새 작업</button>
            </div>
            {showForm && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
                    <label className="block text-xs font-medium text-slate-600">CIRA 프로젝트
                        <select className={inputCls} value={projectKey} onChange={(e) => { setProjectKey(e.target.value); setIssueKey(""); }}>
                            <option value="">선택하세요</option>
                            {projects.data?.map((p) => (
                                <option key={p.id} value={p.key} disabled={!mapped.has(p.key)}>
                                    {p.key} — {p.name} {mapped.has(p.key) ? `(${mapped.get(p.key)})` : "(작업공간 매핑 필요)"}
                                </option>
                            ))}
                        </select>
                    </label>
                    {projects.data?.some((p) => !mapped.has(p.key)) && (
                        <p className="text-xs text-slate-500">매핑이 없는 프로젝트는 <Link href="/ayaan/settings" className="text-blue-600 hover:underline">기준정보 › 작업공간</Link>에서 연결하면 선택할 수 있습니다.</p>
                    )}
                    <label className="block text-xs font-medium text-slate-600">이슈 (비우면 프롬프트로 실행)
                        <select className={inputCls} value={issueKey} disabled={!project} onChange={(e) => setIssueKey(e.target.value)}>
                            <option value="">이슈 없이 프롬프트로</option>
                            {issues.data?.content.map((i) => <option key={i.id} value={i.issueKey}>{i.issueKey} — {i.title}</option>)}
                        </select>
                    </label>
                    {!issueKey && (
                        <label className="block text-xs font-medium text-slate-600">프롬프트
                            <textarea className={`${inputCls} h-24 py-2`} value={prompt} onChange={(e) => setPrompt(e.target.value)}/>
                        </label>
                    )}
                    <div className="flex gap-3">
                        <label className="block flex-1 text-xs font-medium text-slate-600">Tool
                            <select className={inputCls} value={newTool} onChange={(e) => { setNewTool(e.target.value); setSkillCd(""); }}>
                                <option value="">기본</option>
                                {TOOLS.map((t) => <option key={t}>{t}</option>)}
                            </select>
                        </label>
                        <label className="block flex-1 text-xs font-medium text-slate-600">소진 정책
                            <select className={inputCls} value={policy} onChange={(e) => setPolicy(e.target.value)}>
                                <option value="">기본</option>
                                <option>WAIT_SAME_TOOL</option>
                                <option>SWITCH_TOOL</option>
                            </select>
                        </label>
                    </div>
                    <fieldset className="flex gap-4 text-sm text-slate-700">
                        <legend className="mb-1 text-xs font-medium text-slate-600">단계</legend>
                        <label><input type="radio" name="phase" checked={phase === "PLAN"} onChange={() => { setPhase("PLAN"); setSkillCd(""); }}/> 기획부터 (기획서 확인 후 [실행])</label>
                        <label><input type="radio" name="phase" checked={phase === "DEV"} onChange={() => { setPhase("DEV"); setSkillCd(""); }}/> 바로 개발</label>
                    </fieldset>
                    <label className="block text-xs font-medium text-slate-600">Skill
                        <select className={inputCls} value={skillCd} onChange={(e) => setSkillCd(e.target.value)}>
                            <option value="">Tool 기본값 ({defaultSkill ?? "없음"})</option>
                            {skillOptions(skills.data ?? [], effTool, phase).map((s) => <option key={s.skillCd} value={s.skillCd}>{s.skillNm} ({s.skillCd})</option>)}
                            <option value="NONE">사용 안 함</option>
                        </select>
                    </label>
                    <button className={btnPrimary} disabled={create.isPending} onClick={submit}>등록</button>
                    {existingId && (
                        <p role="status" className="text-sm text-slate-700">
                            이미 등록된 작업입니다. <Link href={`/ayaan/tasks/${existingId}`} className="text-blue-600 hover:underline">기존 작업 보기</Link>
                        </p>
                    )}
                </div>
            )}
            <div className="flex gap-3">
                <select aria-label="상태 필터" className={`${inputCls} max-w-48`} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">전체 상태</option>
                    {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <select aria-label="Tool 필터" className={`${inputCls} max-w-48`} value={tool} onChange={(e) => setTool(e.target.value)}>
                    <option value="">전체 Tool</option>
                    {TOOLS.map((t) => <option key={t}>{t}</option>)}
                </select>
                <button className={btnSecondary} onClick={() => list.refetch()}>새로고침</button>
            </div>
            {list.isLoading ? <SkeletonRow/> : (
                <table className="w-full rounded-xl border border-slate-200 bg-white text-sm">
                    <thead className="text-left text-xs text-slate-500">
                    <tr><th className="p-2">이슈/ID</th><th>상태</th><th>Tool</th><th>재개 예정</th><th>생성</th></tr>
                    </thead>
                    <tbody>
                    {(list.data ?? []).map((t) => (
                        <tr key={t.id} className="border-t border-slate-100">
                            <td className="p-2"><Link href={`/ayaan/tasks/${t.id}`} className="text-blue-600 hover:underline">{t.issueKey ?? t.id}</Link></td>
                            <td><span className={`rounded-full px-2 text-xs ${STATUS_CLASS[t.status]}`}>{statusLabel(t.status)}</span></td>
                            <td>{t.toolCd}</td>
                            <td>{fmtTime(t.resumeAt)}</td>
                            <td>{fmtTime(t.createdAt)}</td>
                        </tr>
                    ))}
                    {list.data?.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-400">작업이 없습니다.</td></tr>}
                    </tbody>
                </table>
            )}
            {ToastComponent}
        </div>
    );
}
