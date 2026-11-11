"use client";

import Link from "next/link";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {getQuotas, getTasks, refreshQuotas} from "@/lib/api/ayaan";
import {TOOLS} from "@/types/ayaan";
import {btnPrimary, ESTIMATED_SOURCES, fmtTime, remaining, STATUS_CLASS} from "./format";

export default function AyaanDashboardPage() {
    const qc = useQueryClient();
    const {show, ToastComponent} = useToast();
    const quotas = useQuery({queryKey: ["ayaanQuotas"], queryFn: getQuotas, refetchInterval: 30_000});
    const tasks = useQuery({queryKey: ["ayaanTasks", "summary"], queryFn: () => getTasks(), refetchInterval: 30_000});
    const refresh = useMutation({
        mutationFn: refreshQuotas,
        onSuccess: (d) => qc.setQueryData(["ayaanQuotas"], d),
        onError: () => show("한도 수집에 실패했습니다.", "error"),
    });
    const active = (tasks.data ?? []).filter((t) => t.status === "RUNNING" || t.status === "PAUSED");

    return (
        <div className="mx-auto max-w-6xl space-y-6 px-4">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Ayaan</h1>
                    <p className="text-sm text-slate-500">AI Tool 한도와 작업 현황 (30초마다 갱신)</p>
                </div>
                <div className="flex gap-2 text-sm">
                    <Link href="/ayaan/tasks" className="self-center text-blue-600 hover:underline">작업</Link>
                    <Link href="/ayaan/settings" className="self-center text-blue-600 hover:underline">기준정보</Link>
                    <Link href="/ayaan/setup" className="self-center text-blue-600 hover:underline">셋업</Link>
                    <button className={btnPrimary} disabled={refresh.isPending} onClick={() => refresh.mutate()}>지금 수집</button>
                </div>
            </div>
            {quotas.data?.warnings.length ? (
                <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    {quotas.data.warnings.map((w) => <p key={w}>{w}</p>)}
                </div>
            ) : null}
            {quotas.isLoading ? <SkeletonCard/> : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {TOOLS.map((tool) => {
                        const rows = (quotas.data?.quotas ?? []).filter((q) => q.toolCd === tool);
                        return (
                            <section key={tool} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h2 className="mb-3 font-bold text-slate-900">{tool}</h2>
                                {rows.length === 0 && <p className="text-sm text-slate-400">수집된 한도 없음</p>}
                                {rows.map((q) => {
                                    const est = ESTIMATED_SOURCES.includes(q.source);
                                    const pct = Math.min(100, Math.max(0, q.usedPct ?? 0));
                                    return (
                                        <div key={q.windowCd} className={`mb-3 ${est ? "text-slate-500" : "text-slate-700"}`}>
                                            <div className="flex items-center justify-between text-sm">
                                                <span>{q.windowCd} · {q.usedPct == null ? "-" : `${pct}%`}</span>
                                                <span className="flex items-center gap-1">
                                                    {est && <span className="rounded-full bg-slate-100 px-2 text-xs">추정</span>}
                                                    <span className="rounded-full bg-slate-100 px-2 text-xs">{q.status}</span>
                                                </span>
                                            </div>
                                            <div className="my-1 h-2 rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${tool} ${q.windowCd} 사용률`}>
                                                <div className={`h-2 rounded-full ${est ? "bg-slate-300" : "bg-blue-600"}`} style={{width: `${pct}%`}}/>
                                            </div>
                                            <p className="text-xs">reset까지 {remaining(q.resetsAt)} · {q.source} · {fmtTime(q.observedAt)}</p>
                                        </div>
                                    );
                                })}
                            </section>
                        );
                    })}
                </div>
            )}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 font-bold text-slate-900">진행 중·중단 작업</h2>
                {active.length === 0 && <p className="text-sm text-slate-400">없음</p>}
                <ul className="space-y-2">
                    {active.map((t) => (
                        <li key={t.id} className="flex items-center gap-3 text-sm">
                            <span className={`rounded-full px-2 text-xs ${STATUS_CLASS[t.status]}`}>{t.status}</span>
                            <Link href={`/ayaan/tasks/${t.id}`} className="text-blue-600 hover:underline">{t.issueKey ?? t.id}</Link>
                            <span className="text-slate-500">{t.toolCd}{t.resumeAt ? ` · 재개 ${fmtTime(t.resumeAt)}` : ""}</span>
                        </li>
                    ))}
                </ul>
            </section>
            {ToastComponent}
        </div>
    );
}
