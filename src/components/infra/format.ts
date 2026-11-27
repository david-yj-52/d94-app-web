import {isAxiosError} from "axios";

/** MB → "1.2 GB" / "512 MB". null 이면 "—" */
export function fmtMb(mb: number | null | undefined): string {
    if (mb == null) return "—";
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
}

export function fmtPct(p: number | null | undefined): string {
    return p == null ? "—" : `${p.toFixed(1)}%`;
}

export function fmtUptime(sec: number | null | undefined): string {
    if (sec == null) return "—";
    const d = Math.floor(sec / 86400), h = Math.floor((sec % 86400) / 3600);
    return d > 0 ? `${d}일 ${h}시간` : `${h}시간 ${Math.floor((sec % 3600) / 60)}분`;
}

/** 서버 오류 메시지 또는 fallback */
export function infraError(e: unknown, fallback: string): string {
    return isAxiosError(e) ? e.response?.data?.message ?? fallback : fallback;
}

/** EXTRA_JSON 을 안전하게 파싱 (깨져 있으면 null) */
export function parseExtra(json: string | null | undefined): Record<string, unknown> | null {
    if (!json) return null;
    try {
        const v = JSON.parse(json);
        return v && typeof v === "object" ? v : null;
    } catch {
        return null;
    }
}
