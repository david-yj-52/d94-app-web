import {describe, expect, it} from "vitest";
import {CONFIG_HELP} from "./help";

const CONFIG_KEYS = [
    "EXHAUST_POLICY", "FALLBACK_TOOL_ORDER", "RESUME_CHECK_INTERVAL_SEC", "RESUME_GRACE_SEC", "MAX_RESUME_COUNT",
    "TASK_TIMEOUT_SEC", "QUOTA_POLL_INTERVAL_SEC", "CLAUDE_USAGE_POLL", "REPORT_CRON", "NOTIFY_EVENTS",
    "DEFAULT_PROJECT_KEY",
];
const TOOL_KEYS = [
    "ENABLED", "AUTH_MODE", "PLAN_NAME", "API_KEY_REF", "MODEL", "MAX_CONCURRENCY", "FALLBACK_RESET_RULE",
    "BUDGET_TOKENS", "BUDGET_PERIOD",
];
const WORKSPACE_KEYS = ["PROJECT_KEY", "WORKSPACE_PATH", "DEFAULT_TOOL", "PROMPT_TEMPLATE"];

describe("CONFIG_HELP", () => {
    it("전역 11 + Tool 9 + 작업공간 4 = 24개 키와 정확히 일치한다", () => {
        expect(Object.keys(CONFIG_HELP).sort()).toEqual([...CONFIG_KEYS, ...TOOL_KEYS, ...WORKSPACE_KEYS].sort());
        expect(Object.keys(CONFIG_HELP)).toHaveLength(24);
    });
    it("모든 항목에 비어 있지 않은 설명이 있다", () => {
        for (const [k, v] of Object.entries(CONFIG_HELP)) {
            expect(v.label, k).toBeTruthy();
            expect(v.tooltip, k).toBeTruthy();
            expect(v.what, k).toBeTruthy();
            expect(v.caution, k).toBeTruthy();
        }
    });
});
