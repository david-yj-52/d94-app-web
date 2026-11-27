"use client";

import type {Metric} from "@/types/lifeMetric";
import {useState} from "react";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

/** 기준값 편집. 스키마의 BASELINE 항목 + 스키마 밖에 저장된 값도 보여 준다. 빈 칸 저장 = 삭제 */
export default function BaselineForm({metric, onSave, isPending}: {
    metric: Metric;
    onSave: (values: Record<string, number | string | null>) => void;
    isPending: boolean;
}) {
    const fields = metric.inputSchema.filter((f) => f.mode === "BASELINE");
    const extra = Object.keys(metric.inputs).filter((k) => !fields.some((f) => f.key === k));
    const rows = [...fields, ...extra.map((key) => ({key, label: key, type: "NUMBER" as const, unit: ""}))];
    const [values, setValues] = useState<Record<string, string>>(
        Object.fromEntries(rows.map((r) => [r.key, String(metric.inputs[r.key] ?? "")])));

    const save = () => onSave(Object.fromEntries(rows.map((r) => {
        const v = values[r.key]?.trim() ?? "";
        return [r.key, v === "" ? null : r.type === "NUMBER" && !isNaN(Number(v)) ? Number(v) : v];
    })));

    if (rows.length === 0) return <EmptyState className="py-6">기준값 항목이 없습니다.</EmptyState>;
    return (
        <div className="space-y-3">
            {rows.map((r) => (
                <div key={r.key}>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                        {r.label} <code className="text-slate-400">{r.key}</code>{r.unit ? ` (${r.unit})` : ""}
                    </label>
                    <input aria-label={r.label} type={r.type === "DATE" ? "date" : "text"} inputMode={r.type === "NUMBER" ? "decimal" : undefined}
                           value={values[r.key] ?? ""} onChange={(e) => setValues((s) => ({...s, [r.key]: e.target.value}))}
                           className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-d94-brand"/>
                </div>
            ))}
            <Button type="button" onClick={save} disabled={isPending}>
                기준값 저장
            </Button>
        </div>
    );
}
