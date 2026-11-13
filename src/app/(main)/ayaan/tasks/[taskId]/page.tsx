"use client";

import {use} from "react";
import Link from "next/link";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {cancelTask, createDevTask, getTask, resumeTask} from "@/lib/api/ayaan";
import RequestPanel from "../../components/RequestPanel";
import {ayaanError, btnPrimary, btnSecondary, fmtNum, fmtTime, STATUS_CLASS, statusLabel} from "../../format";

export default function AyaanTaskDetailPage({params}: { params: Promise<{ taskId: string }> }) {
    const {taskId} = use(params);
    const qc = useQueryClient();
    const {show, ToastComponent} = useToast();
    const q = useQuery({queryKey: ["ayaanTask", taskId], queryFn: () => getTask(taskId), refetchInterval: 30_000});
    const act = (fn: (id: string) => Promise<unknown>, msg: string) => ({
        mutationFn: () => fn(taskId),
        onSuccess: () => {
            show(msg);
            qc.invalidateQueries({queryKey: ["ayaanTask", taskId]});
        },
        onError: () => show("요청에 실패했습니다.", "error"),
    });
    const resume = useMutation(act(resumeTask, "재개를 요청했습니다."));
    const cancel = useMutation(act(cancelTask, "취소했습니다."));
    const devTask = useMutation({
        mutationFn: () => createDevTask(taskId),
        onSuccess: (d) => show(`개발 작업을 만들었습니다: ${d.id}`),
        onError: (e) => show(ayaanError(e, "개발 작업을 만들지 못했습니다."), "error"),
    });
    const t = q.data;
    if (q.isLoading || !t) return <div className="mx-auto max-w-5xl px-4"><SkeletonCard/></div>;
    const canResume = t.status === "PAUSED" || t.status === "FAILED";
    const canCancel = ["QUEUED", "RUNNING", "PAUSED", "WAITING"].includes(t.status);
    return (
        <div className="mx-auto max-w-5xl space-y-5 px-4">
            <Link href="/ayaan/tasks" className="text-sm text-blue-600 hover:underline">← 작업 목록</Link>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">
                    {t.issueKey ?? t.id} <span className={`ml-2 rounded-full px-2 text-xs ${STATUS_CLASS[t.status]}`}>{statusLabel(t.status)}</span>
                </h1>
                <div className="flex gap-2">
                    {t.phase === "PLAN" && t.status === "DONE" && (
                        <button className={btnSecondary} disabled={devTask.isPending} onClick={() => devTask.mutate()}>개발 작업 만들기</button>
                    )}
                    <button className={btnPrimary} disabled={!canResume || resume.isPending} onClick={() => resume.mutate()}>재개</button>
                    <button className={btnSecondary} disabled={!canCancel || cancel.isPending}
                            onClick={() => window.confirm("작업을 취소할까요?") && cancel.mutate()}>취소</button>
                </div>
            </div>
            <RequestPanel requests={t.requests ?? []} onError={(m) => show(m, "error")}
                          onAnswered={() => qc.invalidateQueries({queryKey: ["ayaanTask", taskId]})}/>
            <dl className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm">
                <dt className="text-slate-500">Tool</dt><dd>{t.toolCd}</dd>
                <dt className="text-slate-500">프로젝트</dt><dd>{t.projectKey ?? "-"}</dd>
                <dt className="text-slate-500">재개 예정</dt><dd>{fmtTime(t.resumeAt)} {t.pauseReason ?? ""}</dd>
                <dt className="text-slate-500">재개 횟수</dt><dd>{t.resumeCount}</dd>
                <dt className="text-slate-500">단계</dt><dd>{t.phase === "PLAN" ? "기획" : "개발"}{t.skillCd ? ` · skill ${t.skillCd}` : ""}</dd>
                {t.planDocPath && <><dt className="text-slate-500">기획서</dt><dd><code>{t.planDocPath}</code></dd></>}
                {t.parentTaskId && <><dt className="text-slate-500">기획 작업</dt><dd><Link href={`/ayaan/tasks/${t.parentTaskId}`} className="text-blue-600 hover:underline">{t.parentTaskId}</Link></dd></>}
                <dt className="text-slate-500">결과</dt><dd>{t.resultSummary ?? t.failReason ?? "-"}</dd>
            </dl>
            <section>
                <h2 className="mb-2 font-bold text-slate-900">토큰 합계</h2>
                <p className="text-sm text-slate-700">
                    입력 {fmtNum(t.tokenTotals.input)} · 출력 {fmtNum(t.tokenTotals.output)} · 캐시 읽기 {fmtNum(t.tokenTotals.cacheRead)} · 캐시 쓰기 {fmtNum(t.tokenTotals.cacheWrite)} · ${t.tokenTotals.costUsd}
                </p>
            </section>
            <section>
                <h2 className="mb-2 font-bold text-slate-900">실행 이력</h2>
                <table className="w-full rounded-xl border border-slate-200 bg-white text-sm">
                    <thead className="text-left text-xs text-slate-500">
                    <tr><th className="p-2">#</th><th>Tool</th><th>결과</th><th>입력</th><th>출력</th><th>시작</th><th>종료</th></tr>
                    </thead>
                    <tbody>
                    {t.runs.map((r) => (
                        <tr key={r.id} className="border-t border-slate-100">
                            <td className="p-2">{r.runSeq}</td><td>{r.toolCd}</td><td>{r.outcome ?? "-"}</td>
                            <td>{fmtNum(r.inputTokens)}</td><td>{fmtNum(r.outputTokens)}</td>
                            <td>{fmtTime(r.startedAt)}</td><td>{fmtTime(r.endedAt)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </section>
            <section>
                <h2 className="mb-2 font-bold text-slate-900">로그</h2>
                <pre className="max-h-96 overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">{t.logTail || "(없음)"}</pre>
            </section>
            {ToastComponent}
        </div>
    );
}
