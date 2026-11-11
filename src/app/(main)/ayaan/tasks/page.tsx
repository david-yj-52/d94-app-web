"use client";

import {useState} from "react";
import Link from "next/link";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {SkeletonRow} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {createTask, getTasks} from "@/lib/api/ayaan";
import {TASK_STATUSES, TOOLS, type CreateTaskRequest, type ToolCd} from "@/types/ayaan";
import {ayaanError, btnPrimary, btnSecondary, fmtTime, inputCls, STATUS_CLASS} from "../format";

export default function AyaanTasksPage() {
    const qc = useQueryClient();
    const {show, ToastComponent} = useToast();
    const [status, setStatus] = useState("");
    const [tool, setTool] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [existingId, setExistingId] = useState<string | null>(null);
    const [issueKey, setIssueKey] = useState("");
    const [prompt, setPrompt] = useState("");
    const [newTool, setNewTool] = useState("");
    const [policy, setPolicy] = useState("");
    const list = useQuery({
        queryKey: ["ayaanTasks", status, tool],
        queryFn: () => getTasks({status: status || undefined, tool: tool || undefined}),
        refetchInterval: 30_000,
    });
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
        if (!issueKey.trim() && !prompt.trim()) return show("이슈 키 또는 프롬프트를 입력하세요.", "error");
        create.mutate({
            ...(issueKey.trim() ? {issueKey: issueKey.trim()} : {prompt: prompt.trim()}),
            ...(newTool ? {tool: newTool as ToolCd} : {}),
            ...(policy ? {exhaustPolicy: policy} : {}),
            source: "WEB",
        });
    };
    return (
        <div className="mx-auto max-w-6xl space-y-4 px-4">
            <div className="flex items-end justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Ayaan 작업</h1>
                <button className={btnPrimary} onClick={() => setShowForm(!showForm)}>새 작업</button>
            </div>
            {showForm && (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
                    <label className="block text-xs font-medium text-slate-600">이슈 키
                        <input className={inputCls} value={issueKey} onChange={(e) => setIssueKey(e.target.value)} placeholder="CIRA-12"/>
                    </label>
                    <label className="block text-xs font-medium text-slate-600">프롬프트 (이슈 키가 없을 때)
                        <textarea className={`${inputCls} h-24 py-2`} value={prompt} onChange={(e) => setPrompt(e.target.value)}/>
                    </label>
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
                            <td><span className={`rounded-full px-2 text-xs ${STATUS_CLASS[t.status]}`}>{t.status}</span></td>
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
