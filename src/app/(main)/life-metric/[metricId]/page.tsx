"use client";

import BaselineForm from "@/components/lifeMetric/BaselineForm";
import FormulaEditor from "@/components/lifeMetric/FormulaEditor";
import {formatValue} from "@/components/lifeMetric/formulaRef";
import LogPanel from "@/components/lifeMetric/LogPanel";
import {Skeleton} from "@/components/ui/Skeleton";
import {useToast} from "@/components/ui/Toast";
import {
    useAddMetricLog,
    useDeleteMetric,
    useDeleteMetricLog,
    useMetric,
    useMetricLogs,
    useMetrics,
    usePutMetricInputs,
    useUpdateMetric,
} from "@/hooks/useLifeMetric";
import {isAxiosError} from "axios";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {use, useState} from "react";
import {useConfirm} from "@/components/ui/ConfirmDialog";

const messageOf = (e: unknown) => (isAxiosError(e) ? e.response?.data?.message ?? e.message : String(e));

export default function LifeMetricDetailPage({params}: { params: Promise<{ metricId: string }> }) {
    const {metricId} = use(params);
    const router = useRouter();
    const {show, ToastComponent} = useToast();
    const {data: metric, isLoading, error} = useMetric(metricId);
    const {data: logs = []} = useMetricLogs(metricId);
    const {data: metrics = []} = useMetrics();
    const putInputs = usePutMetricInputs(metricId);
    const addLog = useAddMetricLog(metricId);
    const deleteLog = useDeleteMetricLog(metricId);
    const update = useUpdateMetric(metricId);
    const remove = useDeleteMetric();
    const [formula, setFormula] = useState<string | null>(null); // null = 편집 안 함
    const {confirm, ConfirmComponent} = useConfirm();

    if (isLoading) return <div className="mx-auto max-w-5xl space-y-3 px-4 py-8"><Skeleton className="h-24"/><Skeleton className="h-64"/></div>;
    if (error || !metric) return <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-slate-500">지표를 찾을 수 없습니다. <Link href="/life-metric" className="text-d94-brand">목록으로</Link></div>;

    const onError = (e: unknown) => show(messageOf(e), "error");

    return (
        <div className="mx-auto max-w-5xl space-y-5 px-4 py-8">
            <Link href="/life-metric" className="text-sm text-slate-500 hover:text-slate-700">← Life Metric</Link>

            <section className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-slate-900">{metric.name}</h1>
                        <code className="text-sm text-slate-400">@{metric.code}</code>
                    </div>
                    <button type="button" disabled={remove.isPending} onClick={async () => {
                        if (!(await confirm(`‘${metric.name}’과 기준값·기록이 모두 지워집니다. @${metric.code} 를 참조하던 지표는 계산할 수 없게 됩니다.`,
                            {title: "지표 삭제", confirmLabel: "삭제", danger: true}))) return;
                        remove.mutate(metric.id, {onSuccess: () => router.push("/life-metric"), onError});
                    }}
                            className="h-8 rounded-lg border border-slate-200 px-3 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50">삭제</button>
                </div>
                {metric.error ? <p className="mt-4 text-amber-600">{metric.error}</p> : (
                    <p className="mt-4 text-4xl font-bold tabular-nums text-slate-900">
                        {formatValue(metric.value)}<span className="ml-2 text-lg font-medium text-slate-500">{metric.outputUnit}</span>
                    </p>
                )}
                <div className="mt-4">
                    {formula == null ? (
                        <div className="flex items-center gap-3">
                            <code className="min-w-0 flex-1 truncate rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{metric.formula}</code>
                            <button type="button" onClick={() => setFormula(metric.formula)} className="text-sm text-d94-brand hover:underline">수식 편집</button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <FormulaEditor value={formula} onChange={setFormula} codes={metrics.map((m) => m.code).filter((c) => c !== metric.code)}/>
                            <div className="flex gap-2">
                                <button type="button" disabled={update.isPending}
                                        onClick={() => update.mutate({formula}, {onSuccess: () => setFormula(null), onError})}
                                        className="h-8 rounded-lg bg-d94-brand px-3 text-sm font-semibold text-white hover:bg-d94-brand-hover disabled:opacity-60">저장</button>
                                <button type="button" onClick={() => setFormula(null)}
                                        className="h-8 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 hover:bg-slate-50">취소</button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[20rem_1fr]">
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <h2 className="mb-3 font-semibold text-slate-900">기준값</h2>
                    <BaselineForm key={metric.modifiedAt} metric={metric} isPending={putInputs.isPending}
                                  onSave={(v) => putInputs.mutate(v, {onSuccess: () => show("저장되었습니다."), onError})}/>
                </section>
                <section className="rounded-xl border border-slate-200 bg-white p-5">
                    <h2 className="mb-3 font-semibold text-slate-900">기록</h2>
                    <LogPanel metric={metric} logs={logs} isPending={addLog.isPending}
                              onAdd={(req) => addLog.mutate(req, {onError})}
                              onDelete={(id) => deleteLog.mutate(id, {onError})}/>
                </section>
            </div>

            {ToastComponent}
            {ConfirmComponent}
        </div>
    );
}
