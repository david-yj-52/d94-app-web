"use client";

import {useBurndown} from "@/hooks/useReports";
import {useSprints} from "@/hooks/useSprints";
import {Skeleton} from "@/components/ui/Skeleton";
import Link from "next/link";
import {use, useMemo, useState} from "react";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

function formatDateLabel(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatTooltipDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
    });
}

const CustomTooltip = ({
                           active,
                           payload,
                           label,
                       }: {
    active?: boolean;
    payload?: { name: string; value: number | null; color: string }[];
    label?: string;
}) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-sm">
            <p className="font-medium text-slate-700 mb-1">
                {label ? formatTooltipDate(label) : ""}
            </p>
            {payload.map((p) =>
                p.value != null ? (
                    <p key={p.name} style={{color: p.color}}>
                        {p.name}: <span className="font-semibold">{p.value}pt</span>
                    </p>
                ) : null,
            )}
        </div>
    );
};

export default function BurndownPage({
                                         params,
                                     }: {
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const {data: sprints, isLoading: sprintsLoading} = useSprints(projectId);

    const activeSprint = sprints?.find((s) => s.status === "ACTIVE") ?? sprints?.[0] ?? null;
    const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

    const sprintId = selectedSprintId ?? activeSprint?.id ?? null;

    const {data: burndown, isLoading: burndownLoading} = useBurndown(sprintId);

    const todayStr = new Date().toISOString().split("T")[0];

    const chartData = useMemo(() => {
        if (!burndown) return [];
        const actualMap = new Map(
            burndown.actualBurndown.map((p) => [p.date, p.remainingPoints]),
        );
        return burndown.idealBurndown.map((p) => ({
            date: p.date,
            ideal: p.remainingPoints,
            actual: actualMap.has(p.date) ? actualMap.get(p.date)! : null,
        }));
    }, [burndown]);

    const completedPoints = burndown
        ? burndown.totalPoints -
        (burndown.actualBurndown.at(-1)?.remainingPoints ?? burndown.totalPoints)
        : 0;
    const remainingPoints = burndown
        ? (burndown.actualBurndown.at(-1)?.remainingPoints ?? burndown.totalPoints)
        : 0;

    const isLoading = sprintsLoading || (!!sprintId && burndownLoading);

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <label className="text-sm font-medium text-slate-600">스프린트</label>
                <select
                    value={sprintId ?? ""}
                    onChange={(e) => setSelectedSprintId(e.target.value || null)}
                    className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={sprintsLoading}
                >
                    {sprints?.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.sprintNm}
                            {s.status === "ACTIVE" ? " (진행 중)" : ""}
                        </option>
                    ))}
                </select>
            </div>

            {isLoading && (
                <div className="space-y-3">
                    <Skeleton className="h-[400px] w-full"/>
                </div>
            )}

            {!isLoading && !sprintId && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <p className="text-lg font-medium text-slate-600 mb-1">스프린트 데이터가 없습니다</p>
                    <p className="text-sm mb-6">스프린트를 먼저 생성해주세요.</p>
                    <Link
                        href={`/projects/${projectId}/sprints`}
                        className="h-10 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex items-center no-underline"
                    >
                        스프린트 생성하러 가기
                    </Link>
                </div>
            )}

            {!isLoading && sprintId && !burndown && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <p className="text-lg font-medium text-slate-600 mb-1">번다운 데이터가 없습니다</p>
                    <p className="text-sm">스프린트가 시작된 후 데이터가 표시됩니다.</p>
                </div>
            )}

            {!isLoading && burndown && (
                <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500 mb-1">총 포인트</p>
                            <p className="text-2xl font-bold text-slate-900">{burndown.totalPoints}pt</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500 mb-1">완료 포인트</p>
                            <p className="text-2xl font-bold text-blue-600">{completedPoints}pt</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <p className="text-xs text-slate-500 mb-1">남은 포인트</p>
                            <p className="text-2xl font-bold text-slate-700">{remainingPoints}pt</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <h2 className="text-base font-semibold text-slate-800 mb-4">
                            {burndown.sprintName} 번다운 차트
                        </h2>
                        <ResponsiveContainer width="100%" height={380}>
                            <LineChart data={chartData} margin={{top: 5, right: 20, left: 0, bottom: 5}}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDateLabel}
                                    tick={{fontSize: 12, fill: "#94a3b8"}}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{fontSize: 12, fill: "#94a3b8"}}
                                    tickLine={false}
                                    axisLine={false}
                                    unit="pt"
                                />
                                <Tooltip content={<CustomTooltip/>}/>
                                <Legend
                                    wrapperStyle={{fontSize: "13px", paddingTop: "16px"}}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="ideal"
                                    name="이상적 번다운"
                                    stroke="#94a3b8"
                                    strokeDasharray="5 5"
                                    strokeWidth={2}
                                    dot={false}
                                    connectNulls
                                />
                                <Line
                                    type="monotone"
                                    dataKey="actual"
                                    name="실제 번다운"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{fill: "#3b82f6", r: 3}}
                                    connectNulls={false}
                                />
                                {chartData.some((d) => d.date === todayStr) && (
                                    <ReferenceLine
                                        x={todayStr}
                                        stroke="#ef4444"
                                        strokeDasharray="3 3"
                                        label={{value: "오늘", fill: "#ef4444", fontSize: 11}}
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
}
