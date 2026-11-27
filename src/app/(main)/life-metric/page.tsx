"use client";

import MetricCard from "@/components/lifeMetric/MetricCard";
import MetricCreateModal from "@/components/lifeMetric/MetricCreateModal";
import {SkeletonCard} from "@/components/ui/Skeleton";
import {useMetrics} from "@/hooks/useLifeMetric";
import {useRouter} from "next/navigation";
import {useState} from "react";
import Button from "@/components/ui/Button";

export default function LifeMetricPage() {
    const router = useRouter();
    const [creating, setCreating] = useState(false);
    const {data: metrics = [], isLoading} = useMetrics();

    return (
        <div className="mx-auto max-w-6xl space-y-5 px-4 py-8">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Life Metric</h1>
                    <p className="mt-1 text-sm text-slate-500">삶의 요소를 내가 정한 수식으로 숫자로 환산합니다. 다른 지표는 <code>@코드</code>로 참조하세요.</p>
                </div>
                <Button type="button" onClick={() => setCreating(true)}
                        className="shrink-0">
                    새 지표
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => <SkeletonCard key={i}/>)}</div>
            ) : metrics.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                    아직 지표가 없습니다. &lsquo;새 지표&rsquo;에서 남은 수명·내 시급 같은 템플릿으로 시작해 보세요.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {metrics.map((m) => <MetricCard key={m.id} metric={m}/>)}
                </div>
            )}

            {creating && <MetricCreateModal onClose={() => setCreating(false)}
                                            onCreated={(m) => router.push(`/life-metric/${m.id}`)}/>}
        </div>
    );
}
