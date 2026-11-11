/** ayaan 타임스탬프는 zone 없는 UTC ISO → 'Z' 를 붙여 Asia/Seoul 로 표시 */
export function fmtTime(iso: string | null | undefined): string {
    if (!iso) return "-";
    const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z");
    return d.toLocaleString("ko-KR", {timeZone: "Asia/Seoul", hour12: false});
}
export function remaining(iso: string | null | undefined, now = Date.now()): string {
    if (!iso) return "-";
    const ms = new Date(/[zZ]$/.test(iso) ? iso : iso + "Z").getTime() - now;
    if (ms <= 0) return "곧 reset";
    const m = Math.floor(ms / 60000);
    return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`;
}
export const fmtNum = (n: number | null | undefined) => (n == null ? "-" : n.toLocaleString("ko-KR"));
export const ESTIMATED_SOURCES = ["USAGE_API", "RULE"];
export const STATUS_CLASS: Record<string, string> = {
    RUNNING: "bg-blue-50 text-blue-700", PAUSED: "bg-amber-50 text-amber-700", DONE: "bg-emerald-50 text-emerald-700",
    FAILED: "bg-red-50 text-red-600", QUEUED: "bg-slate-100 text-slate-600", CANCELED: "bg-slate-100 text-slate-500",
};
export const btnPrimary = "h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60";
export const btnSecondary = "h-10 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60";
export const inputCls = "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
