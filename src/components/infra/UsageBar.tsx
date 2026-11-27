/** 사용률 막대. 80% 이상 amber, 90% 이상 red */
export default function UsageBar({label, pct, detail}: { label: string; pct: number | null; detail?: string }) {
    const color = pct == null ? "bg-slate-200" : pct >= 90 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-d94-brand";
    return (
        <div>
            <div className="flex justify-between text-xs text-slate-500">
                <span>{label}</span>
                <span className="tabular-nums">{pct == null ? "—" : `${pct.toFixed(0)}%`}{detail && ` · ${detail}`}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"
                 role="progressbar" aria-label={label} aria-valuenow={pct ?? undefined} aria-valuemin={0} aria-valuemax={100}>
                {/* 너비는 런타임 퍼센트라 Tailwind 로 표현 불가 */}
                <div className={`h-full ${color}`} style={{width: `${Math.min(100, Math.max(0, pct ?? 0))}%`}}/>
            </div>
        </div>
    );
}
