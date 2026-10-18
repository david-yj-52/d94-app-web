"use client";

import {useCfd} from "@/hooks/useReports";
import {Skeleton} from "@/components/ui/Skeleton";
import Link from "next/link";
import {use, useMemo, useState} from "react";
import {Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,} from "recharts";

const STATUS_COLORS: Record<string, string> = {
    "To Do": "#cbd5e1",
    "In Progress": "#60a5fa",
    "In Review": "#fbbf24",
    Done: "#4ade80",
};

const DEFAULT_COLORS = [
    "#94a3b8",
    "#60a5fa",
    "#fbbf24",
    "#4ade80",
    "#f472b6",
    "#a78bfa",
];

function getStatusColor(status: string, index: number) {
    return STATUS_COLORS[status] ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

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
    payload?: { name: string; value: number; fill: string }[];
    label?: string;
}) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((sum, p) => sum + (p.value ?? 0), 0);
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-sm">
            <p className="font-medium text-slate-700 mb-1">
                {label ? formatTooltipDate(label) : ""}
            </p>
            {[...payload].reverse().map((p) => (
                <p key={p.name} style={{color: p.fill}}>
                    {p.name}: <span className="font-semibold">{p.value}개</span>
                </p>
            ))}
            <p className="text-slate-500 mt-1 border-t border-slate-100 pt-1">
                합계: <span className="font-semibold">{total}개</span>
            </p>
        </div>
    );
};

function getDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
    };
}

export default function CfdPage({
                                    params,
                                }: {
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const defaults = useMemo(getDefaultDates, []);
    const [startDate, setStartDate] = useState(defaults.startDate);
    const [endDate, setEndDate] = useState(defaults.endDate);

    const {data: cfd, isLoading} = useCfd(projectId, startDate, endDate);

    const chartData = useMemo(() => {
        if (!cfd) return [];
        return cfd.dates.map((date, i) => {
            const point: Record<string, unknown> = {date};
            for (const status of cfd.statuses) {
                point[status] = cfd.data[status]?.[i] ?? 0;
            }
            return point;
        });
    }, [cfd]);

    const leadTime = useMemo(() => {
        if (!cfd || chartData.length < 2) return null;
        const first = chartData[0];
        const last = chartData[chartData.length - 1];
        const doneKey = cfd.statuses.find((s) => s === "Done") ?? cfd.statuses.at(-1);
        const todoKey = cfd.statuses.find((s) => s === "To Do") ?? cfd.statuses[0];
        if (!doneKey || !todoKey) return null;
        const firstTotal = cfd.statuses.reduce(
            (sum, s) => sum + ((first[s] as number) ?? 0),
            0,
        );
        const lastDone = (last[doneKey] as number) ?? 0;
        if (!firstTotal || !lastDone) return null;
        const days =
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            86400000;
        return {
            leadTime: Math.round(days),
            cycleTime: Math.round(days * (lastDone / firstTotal)),
        };
    }, [cfd, chartData, startDate, endDate]);

    return (
        <div>
            <div className="flex items-center gap-4 mb-6 flex-wrap">
                <label className="text-sm font-medium text-slate-600">날짜 범위</label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-400 text-sm">~</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {leadTime && (
                    <div className="flex gap-4 ml-auto">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center">
                            <p className="text-xs text-blue-500 font-medium">리드 타임</p>
                            <p className="text-xl font-bold text-blue-700">{leadTime.leadTime}일</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
                            <p className="text-xs text-green-500 font-medium">사이클 타임</p>
                            <p className="text-xl font-bold text-green-700">{leadTime.cycleTime}일</p>
                        </div>
                    </div>
                )}
            </div>

            {isLoading && <Skeleton className="h-[400px] w-full"/>}

            {!isLoading && !cfd && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <p className="text-lg font-medium text-slate-600 mb-1">CFD 데이터가 없습니다</p>
                    <p className="text-sm mb-6">이슈를 생성하고 스프린트를 시작하면 데이터가 표시됩니다.</p>
                    <Link
                        href={`/projects/${projectId}/issues`}
                        className="h-10 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex items-center no-underline"
                    >
                        이슈 생성하러 가기
                    </Link>
                </div>
            )}

            {!isLoading && cfd && chartData.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <p className="text-lg font-medium text-slate-600 mb-1">선택한 기간에 데이터가 없습니다</p>
                    <p className="text-sm">날짜 범위를 변경해보세요.</p>
                </div>
            )}

            {!isLoading && cfd && chartData.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-base font-semibold text-slate-800 mb-4">
                        누적 흐름 다이어그램 (CFD)
                    </h2>
                    <ResponsiveContainer width="100%" height={380}>
                        <AreaChart data={chartData} margin={{top: 5, right: 20, left: 0, bottom: 5}}>
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
                                unit="개"
                            />
                            <Tooltip content={<CustomTooltip/>}/>
                            <Legend wrapperStyle={{fontSize: "13px", paddingTop: "16px"}}/>
                            {cfd.statuses.map((status, i) => (
                                <Area
                                    key={status}
                                    type="monotone"
                                    dataKey={status}
                                    stackId="1"
                                    stroke={getStatusColor(status, i)}
                                    fill={getStatusColor(status, i)}
                                    fillOpacity={0.7}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
