import type {Metric} from "@/types/lifeMetric";
import Link from "next/link";
import {formatValue} from "./formulaRef";

/** 대시보드 카드: 이름·@code·지금 값(또는 계산할 수 없는 이유) */
export default function MetricCard({metric}: { metric: Metric }) {
    return (
        <Link href={`/life-metric/${metric.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm">
            <div className="flex items-baseline justify-between gap-2">
                <h3 className="truncate font-semibold text-slate-900">{metric.name}</h3>
                <code className="shrink-0 text-xs text-slate-400">@{metric.code}</code>
            </div>
            {metric.error ? (
                <p className="mt-4 text-sm text-amber-600">{metric.error}</p>
            ) : (
                <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">
                    {formatValue(metric.value)}
                    {metric.outputUnit && <span className="ml-1 text-base font-medium text-slate-500">{metric.outputUnit}</span>}
                </p>
            )}
        </Link>
    );
}
