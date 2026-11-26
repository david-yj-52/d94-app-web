"use client";

import {useState} from "react";
import Link from "next/link";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {SkeletonRow} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {useIssues} from "@/hooks/useIssues";
import {useProjects} from "@/hooks/useProjects";
import {cancelPlan, createPlan, createTask, getMilestones, getPlans, getTasks, getWorkspaces, resumePlan} from "@/lib/api/ayaan";
import {TASK_STATUSES, TOOLS, type CreateTaskRequest} from "@/types/ayaan";
import {toCreateBody} from "./taskBody";
import {planStageLabel} from "./planStage";
import {ayaanError, btnPrimary, btnSecondary, fmtTime, inputCls, STATUS_CLASS} from "../format";

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
    const list = useQuery({
        queryKey: ["ayaanTasks", status, tool],
        queryFn: () => getTasks({status: status || undefined, tool: tool || undefined}),
        refetchInterval: 30_000,
    });
    const projects = useProjects();
    const workspaces = useQuery({queryKey: ["ayaanWorkspaces"], queryFn: getWorkspaces, enabled: showForm});
    const mapped = new Map((workspaces.data ?? []).map((w) => [w.projectKey, w.repos.map((r) => r.repoNm).join(", ")]));
    const [showPlan, setShowPlan] = useState(false);
    const [planProject, setPlanProject] = useState("");
    const [milestoneId, setMilestoneId] = useState("");
    const plans = useQuery({queryKey: ["ayaanPlans"], queryFn: () => getPlans(), refetchInterval: 30_000});
    const planWorkspaces = useQuery({queryKey: ["ayaanWorkspaces"], queryFn: getWorkspaces, enabled: showPlan});
    const milestones = useQuery({queryKey: ["ayaanMilestones", planProject], queryFn: () => getMilestones(planProject), enabled: !!planProject});
    const refreshPlans = () => qc.invalidateQueries({queryKey: ["ayaanPlans"]});
    const startPlan = useMutation({
        mutationFn: () => createPlan(planProject, milestoneId),
        onSuccess: () => { show("계획을 시작했습니다."); setShowPlan(false); setMilestoneId(""); refreshPlans(); },
        onError: (e: any) => show(e?.response?.status === 409 ? "이미 진행 중인 계획이 있습니다." : ayaanError(e, "계획 실행에 실패했습니다."), "error"),
    });
    const planAct = (fn: (id: string) => Promise<unknown>, msg: string) => ({
        mutationFn: fn,
        onSuccess: () => { show(msg); refreshPlans(); },
        onError: (e: any) => show(ayaanError(e, "요청에 실패했습니다."), "error"),
    });
    const resumeP = useMutation(planAct(resumePlan, "계획을 재개합니다."));
    const cancelP = useMutation(planAct(cancelPlan, "계획을 취소했습니다."));
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
        const body = toCreateBody({projectKey, issueKey, prompt, tool: newTool, policy});
        if (typeof body === "string") return show(body, "error");
        create.mutate(body);
    };
    return (
        <div className="mx-auto max-w-6xl space-y-4 px-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Ayaan 작업</h1>
                <div className="flex gap-2">
                    <button className={btnSecondary} onClick={() => setShowPlan(!showPlan)}>계획 실행</button>
                    <button className={btnPrimary} onClick={() => setShowForm(!showForm)}>새 작업</button>
                </div>
            </div>
            {showPlan && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
                    <label className="block text-xs font-medium text-slate-600">프로젝트
                        <select className={inputCls} value={planProject} onChange={(e) => { setPlanProject(e.target.value); setMilestoneId(""); }}>
                            <option value="">선택하세요</option>
                            {(planWorkspaces.data ?? []).map((w) => <option key={w.projectKey} value={w.projectKey}>{w.projectKey}</option>)}
                        </select>
                    </label>
                    <label className="block text-xs font-medium text-slate-600">마일스톤
                        <select className={inputCls} value={milestoneId} disabled={!planProject} onChange={(e) => setMilestoneId(e.target.value)}>
                            <option value="">선택하세요</option>
                            {(milestones.data ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </label>
                    <button className={btnPrimary} disabled={!milestoneId || startPlan.isPending} onClick={() => startPlan.mutate()}>실행</button>
                </div>
            )}
            {showForm && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
                    <label className="block text-xs font-medium text-slate-600">CIRA 프로젝트
                        <select className={inputCls} value={projectKey} onChange={(e) => { setProjectKey(e.target.value); setIssueKey(""); }}>
                            <option value="">선택하세요</option>
                            {projects.data?.map((p) => (
                                <option key={p.id} value={p.key} disabled={!mapped.has(p.key)}>
                                    {p.key} — {p.name} {mapped.has(p.key) ? `(${mapped.get(p.key)})` : "(작업공간 설정 필요)"}
                                </option>
                            ))}
                        </select>
                    </label>
                    {projects.data?.filter((p) => !mapped.has(p.key)).map((p) => (
                        <Link key={p.id} href={`/settings?group=ayaan&tab=workspace&projectKey=${encodeURIComponent(p.key)}`}
                              className={`${btnSecondary} mr-2 inline-flex items-center`}>{p.key} 작업공간 설정</Link>
                    ))}
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
                            <select className={inputCls} value={newTool} onChange={(e) => setNewTool(e.target.value)}>
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
                    <button className={btnPrimary} disabled={create.isPending} onClick={submit}>등록</button>
                    {existingId && (
                        <p role="status" className="text-sm text-slate-700">
                            이미 등록된 작업입니다. <Link href={`/ayaan/tasks/${existingId}`} className="text-blue-600 hover:underline">기존 작업 보기</Link>
                        </p>
                    )}
                </div>
            )}
            {(plans.data ?? []).length > 0 && (
                <section className="space-y-2">
                    <h2 className="font-bold text-slate-900">계획</h2>
                    <ul className="space-y-2">
                        {(plans.data ?? []).map((p) => {
                            const active = !p.endedAt && p.stage !== "DONE" && p.stage !== "CANCELLED";
                            return (
                                <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
                                    <span>
                                        <b>{p.projectKey}</b> {p.milestoneKey} · {planStageLabel(p)}
                                        {p.currentIssueKey && <span className="text-slate-500"> ({p.currentIssueKey})</span>}
                                        {p.lastError && <span className="block text-xs text-red-500">{p.lastError}</span>}
                                    </span>
                                    <span className="flex shrink-0 gap-2">
                                        {p.stage === "HALTED" && <button className={btnPrimary} disabled={resumeP.isPending} onClick={() => resumeP.mutate(p.id)}>재개</button>}
                                        {active && <button className={btnSecondary} disabled={cancelP.isPending}
                                                           onClick={() => window.confirm("계획을 취소할까요?") && cancelP.mutate(p.id)}>취소</button>}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}
            <div className="flex flex-wrap gap-2">
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
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full min-w-[560px] text-sm">
                    <thead className="text-left text-xs text-slate-500">
                    <tr><th className="p-2">이슈/ID</th><th>상태</th><th>Tool</th><th>재개 예정</th><th>생성</th></tr>
                    </thead>
                    <tbody>
                    {(list.data ?? []).map((t) => (
                        <tr key={t.id} className="border-t border-slate-100">
                            <td className="p-2"><Link href={`/ayaan/tasks/${t.id}`} className="text-blue-600 hover:underline">{t.issueKey ?? t.id}</Link></td>
                            <td><span className={`rounded-full px-2 text-xs ${STATUS_CLASS[t.status]}`}>{t.status}</span></td>
                            <td>{t.toolCd}</td>
                            <td>{fmtTime(t.resumeAt)}</td>
                            <td>{fmtTime(t.createdAt)}</td>
                        </tr>
                    ))}
                    {list.data?.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-400">작업이 없습니다.</td></tr>}
                    </tbody>
                </table>
                </div>
            )}
            {ToastComponent}
        </div>
    );
}
