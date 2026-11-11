// 부록 A 범위 — 서버 검증과 중복이지만 즉시 피드백용. 최종 판단은 서버 422.
const INT_RANGE: Record<string, [number, number]> = {
    RESUME_CHECK_INTERVAL_SEC: [30, 3600],
    RESUME_GRACE_SEC: [0, 1800],
    MAX_RESUME_COUNT: [1, 100],
    TASK_TIMEOUT_SEC: [300, 14400],
    QUOTA_POLL_INTERVAL_SEC: [60, 3600],
};
const TOOLS = ["CLAUDE", "CODEX", "GEMINI", "CURSOR"];
const EVENTS = ["PAUSED", "RESUMED", "DONE", "FAILED", "QUOTA_EXHAUSTED", "QUOTA_RESTORED"];
const CRON_FIELD = /^(\*|\d+(-\d+)?)(\/\d+)?(,(\*|\d+(-\d+)?)(\/\d+)?)*$/;

function listOf(value: string, allowed: string[]): string | null {
    const bad = value.split(",").map((v) => v.trim()).filter((v) => !allowed.includes(v));
    return bad.length ? `허용되지 않는 값: ${bad.join(", ")}` : null;
}

export function validateConfigField(key: string, value: string): string | null {
    const v = value.trim();
    const range = INT_RANGE[key];
    if (range) {
        if (!/^\d+$/.test(v)) return "정수를 입력하세요.";
        const n = Number(v);
        return n < range[0] || n > range[1] ? `${range[0]}~${range[1]} 사이여야 합니다.` : null;
    }
    switch (key) {
        case "EXHAUST_POLICY":
            return ["WAIT_SAME_TOOL", "SWITCH_TOOL"].includes(v) ? null : "WAIT_SAME_TOOL 또는 SWITCH_TOOL 이어야 합니다.";
        case "CLAUDE_USAGE_POLL":
            return v === "true" || v === "false" ? null : "true 또는 false 이어야 합니다.";
        case "FALLBACK_TOOL_ORDER":
            return v ? listOf(v, TOOLS) : "Tool 을 쉼표로 구분해 입력하세요.";
        case "NOTIFY_EVENTS":
            return v ? listOf(v, EVENTS) : null;
        case "REPORT_CRON":
            if (!v) return null; // 비우면 정기 리포트 없음
            return v.split(/\s+/).length === 5 && v.split(/\s+/).every((f) => CRON_FIELD.test(f))
                ? null : "cron 5필드(분 시 일 월 요일)여야 합니다.";
        default:
            return null;
    }
}
