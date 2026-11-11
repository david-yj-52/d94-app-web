import {describe, expect, it} from "vitest";
import {validateConfigField} from "./validate";

describe("validateConfigField", () => {
    it("MAX_RESUME_COUNT 범위", () => {
        expect(validateConfigField("MAX_RESUME_COUNT", "0")).not.toBeNull();
        expect(validateConfigField("MAX_RESUME_COUNT", "10")).toBeNull();
        expect(validateConfigField("MAX_RESUME_COUNT", "abc")).not.toBeNull();
    });
    it("REPORT_CRON 5필드", () => {
        expect(validateConfigField("REPORT_CRON", "0 9 * *")).not.toBeNull();
        expect(validateConfigField("REPORT_CRON", "0 9,18 * * *")).toBeNull();
        expect(validateConfigField("REPORT_CRON", "0 9 * * 1-5")).toBeNull();
        expect(validateConfigField("REPORT_CRON", "")).toBeNull();
    });
    it("열거형", () => {
        expect(validateConfigField("EXHAUST_POLICY", "X")).not.toBeNull();
        expect(validateConfigField("FALLBACK_TOOL_ORDER", "CODEX,CLAUDE")).toBeNull();
        expect(validateConfigField("NOTIFY_EVENTS", "PAUSED,NOPE")).not.toBeNull();
        expect(validateConfigField("CLAUDE_USAGE_POLL", "false")).toBeNull();
    });
});
