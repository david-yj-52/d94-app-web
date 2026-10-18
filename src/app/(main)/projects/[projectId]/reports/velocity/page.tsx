"use client";

import {useVelocity} from "@/hooks/useReports";
import {Skeleton} from "@/components/ui/Skeleton";
import Link from "next/link";
import {use, useMemo, useState} from "react";
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const LAST_N_OPTIONS = [
    {value: 6, label: "최근 6 스프린트"},
    {value: 10, label: "최근 10 스프린트"},
    {value: 12, label: "최근 12 스프린트"},
];

const CustomTooltip = ({
                           active,
                           payload,
                           label,
                       }: {
    active?: boolean;
    payload?: { name: string; value: number; color: string }[];
    label?: string;
}) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-sm">
            <p className="font-medium text-slate-700 mb-1">{label}</p>
            {payload.map((p) => (
                <p key={p.name} style={{color: p.color}}>
                    {p.name}: <span className="font-semibold">{p.value}pt</span>
                </p>
            ))}
        </div>
    );
};

export default function VelocityPage({
                                         params,
                                     }: {
    params: Promise<{ projectId: string }>;
}) {
    const {projectId} = use(params);
    const [lastN, setLastN] = useState(6);

    const {data: velocity, isLoading} = useVelocity(projectId, lastN);

    const {chartData, avgVelocity} = useMemo(() => {
        if (!velocity?.length) return {chartData: [], avgVelocity: 0};
        const avg =
            velocity.reduce((sum, v) => sum + v.velocity, 0) / velocity.length;
        return {
            chartData: velocity.map((v) => ({...v, avgVelocity: Math.round(avg)})),
            avgVelocity: Math.round(avg),
        };
    }, [velocity]);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-slate-600">표시 범위</label>
                    <select
                        value={lastN}
                        onChange={(e) => setLastN(Number(e.target.value))}
                        className="h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {LAST_N_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {!isLoading && velocity?.length ? (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl px-5 py-3">
                        <p className="text-xs text-orange-500 font-medium">평균 Velocity</p>
                        <p className="text-2xl font-bold text-orange-600">{avgVelocity}pt</p>
                    </div>
                ) : null}
            </div>

            {isLoading && <Skeleton className="h-[400px] w-full"/>}

            {!isLoading && !velocity?.length && (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <p className="text-lg font-medium text-slate-600 mb-1">스프린트 데이터가 없습니다</p>
                    <p className="text-sm mb-6">완료된 스프린트가 있어야 Velocity가 표시됩니다.</p>
                    <Link
                        href={`/projects/${projectId}/sprints`}
                        className="h-10 px-6 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 flex items-center no-underline"
                    >
                        스프린트 생성하러 가기
                    </Link>
                </div>
            )}

            {!isLoading && chartData.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-base font-semibold text-slate-800 mb-4">
                        스프린트 Velocity 리포트
                    </h2>
                    <ResponsiveContainer width="100%" height={380}>
                        <ComposedChart data={chartData} margin={{top: 5, right: 20, left: 0, bottom: 5}}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                            <XAxis
                                dataKey="sprintName"
                                tick={{fontSize: 11, fill: "#94a3b8"}}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{fontSize: 12, fill: "#94a3b8"}}
                                tickLine={false}
                                axisLine={false}
                                unit="pt"
                            />
                            <Tooltip content={<CustomTooltip/>}/>
                            <Legend wrapperStyle={{fontSize: "13px", paddingTop: "16px"}}/>
                            <Bar dataKey="committed" name="커밋 포인트" fill="#cbd5e1" radius={[4, 4, 0, 0]}/>
                            <Bar dataKey="completed" name="완료 포인트" fill="#3b82f6" radius={[4, 4, 0, 0]}/>
                            <Line
                                type="monotone"
                                dataKey="avgVelocity"
                                name="평균 Velocity"
                                stroke="#f97316"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                            />
                            <ReferenceLine
                                y={avgVelocity}
                                stroke="#f97316"
                                strokeDasharray="3 3"
                                strokeOpacity={0.4}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
