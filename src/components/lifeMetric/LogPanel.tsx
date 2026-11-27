"use client";

import type {LogRequest, Metric, MetricLog} from "@/types/lifeMetric";
import {useState} from "react";
import {CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

const inputCls = "h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand";

/** 기록(LOG) 빠른 입력 + 선택한 키의 추이 차트 + 최근 기록 목록(삭제) */
export default function LogPanel({metric, logs, onAdd, onDelete, isPending}: {
    metric: Metric;
    logs: MetricLog[];
    onAdd: (req: LogRequest) => void;
    onDelete: (logId: number) => void;
    isPending: boolean;
}) {
    const keys = [...new Set([...metric.inputSchema.filter((f) => f.mode === "LOG").map((f) => f.key), ...logs.map((l) => l.inputKey)])];
    const [key, setKey] = useState(keys[0] ?? "");
    const [value, setValue] = useState("");
    const [note, setNote] = useState("");
    const labelOf = (k: string) => metric.inputSchema.find((f) => f.key === k)?.label ?? k;

    const add = () => {
        const n = Number(value);
        if (!key || value.trim() === "" || isNaN(n)) return;
        onAdd({inputKey: key, value: n, note: note || undefined});
        setValue("");
        setNote("");
    };

    const series = logs.filter((l) => l.inputKey === key).slice().reverse()
        .map((l) => ({at: l.recordedAt.slice(0, 10), value: l.value}));

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <input className={`${inputCls} w-36`} aria-label="기록 키" list="lm-log-keys" value={key}
                       placeholder="키" onChange={(e) => setKey(e.target.value)}/>
                <datalist id="lm-log-keys">{keys.map((k) => <option key={k} value={k}>{labelOf(k)}</option>)}</datalist>
                <input className={`${inputCls} w-32`} aria-label="기록 값" inputMode="decimal" placeholder="값" value={value}
                       onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}/>
                <input className={`${inputCls} min-w-0 flex-1`} aria-label="메모" placeholder="메모 (선택)" value={note}
                       onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}/>
                <Button type="button" onClick={add} disabled={isPending}>기록</Button>
            </div>

            {series.length > 1 && (
                <div className="h-48" aria-label={`${labelOf(key)} 추이`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={series}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                            <XAxis dataKey="at" tick={{fontSize: 11}}/>
                            <YAxis tick={{fontSize: 11}} width={60}/>
                            <Tooltip/>
                            <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{r: 3}}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {logs.length === 0 ? <EmptyState className="py-6">기록이 없습니다.</EmptyState> : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {logs.map((l) => (
                        <li key={l.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                            <span className="w-28 shrink-0 text-xs text-slate-500">{l.recordedAt.slice(0, 16).replace("T", " ")}</span>
                            <code className="w-28 shrink-0 truncate text-slate-500">{l.inputKey}</code>
                            <span className="w-24 shrink-0 text-right font-semibold tabular-nums text-slate-900">{l.value.toLocaleString("ko-KR")}</span>
                            <span className="min-w-0 flex-1 truncate text-slate-600">{l.note}</span>
                            <button type="button" aria-label={`${l.inputKey} 기록 삭제`} onClick={() => onDelete(l.id)}
                                    className="text-slate-400 hover:text-red-500">✕</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
