"use client";

import type {InfraMetric} from "@/types/infra";
import {CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";

/** CPU·메모리·디스크·GPU 사용률(%) 추이 */
export default function MetricChart({data, showGpu}: { data: InfraMetric[]; showGpu: boolean }) {
    if (data.length === 0) {
        return <p className="py-16 text-center text-sm text-slate-400">이 기간에 수집된 메트릭이 없습니다.</p>;
    }
    const rows = data.map((m) => ({
        at: new Date(m.collectedAt).toLocaleString("ko-KR", {month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit"}),
        cpu: m.cpuPct, mem: m.memPct, disk: m.diskPct, gpu: m.gpuUtilPct,
    }));
    return (
        <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                    <XAxis dataKey="at" tick={{fontSize: 11}} minTickGap={24}/>
                    <YAxis domain={[0, 100]} tick={{fontSize: 11}} unit="%" width={44}/>
                    <Tooltip formatter={(v) => (typeof v === "number" ? `${v.toFixed(1)}%` : v)}/>
                    <Legend/>
                    <Line type="monotone" dataKey="cpu" name="CPU" stroke="#2563eb" dot={false} strokeWidth={2}/>
                    <Line type="monotone" dataKey="mem" name="메모리" stroke="#16a34a" dot={false} strokeWidth={2}/>
                    <Line type="monotone" dataKey="disk" name="디스크" stroke="#94a3b8" dot={false} strokeWidth={1.5}/>
                    {showGpu && <Line type="monotone" dataKey="gpu" name="GPU" stroke="#d946ef" dot={false} strokeWidth={2}/>}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
