import {describe, expect, it} from "vitest";
import {toToolBody, toToolForm, toWorkspaceBody} from "./toolBody";
import type {AyaanTool} from "@/types/ayaan";

const tool: AyaanTool = {
    toolCd: "CLAUDE", enabled: true, authMode: "ACCOUNT", planName: null, apiKeyRef: null, model: null,
    maxConcurrency: 1, fallbackResetRule: "INTERVAL 30m", budgetTokens: null, budgetPeriod: null,
};

describe("toToolBody", () => {
    it("원래 값은 그대로 왕복한다 (빈 문자열 → null)", () => {
        expect(toToolBody(toToolForm(tool))).toEqual({body: tool, errors: {}});
    });
    it("체크박스·숫자를 타입에 맞게 변환한다", () => {
        const f = {...toToolForm(tool), enabled: false, maxConcurrency: "3", budgetTokens: "2000000", budgetPeriod: "DAILY", planName: " Max "};
        expect(toToolBody(f).body).toMatchObject({enabled: false, maxConcurrency: 3, budgetTokens: 2000000, budgetPeriod: "DAILY", planName: "Max"});
    });
    it("정수가 아니거나 범위 밖이면 PUT 본문을 만들지 않는다", () => {
        for (const v of ["abc", "0", "5", "1.5", ""]) {
            const r = toToolBody({...toToolForm(tool), maxConcurrency: v});
            expect(r.body, v).toBeNull();
            expect(r.errors.maxConcurrency, v).toBeTruthy();
        }
        expect(toToolBody({...toToolForm(tool), budgetTokens: "0"}).errors.budgetTokens).toBeTruthy();
        expect(toToolBody({...toToolForm(tool), budgetTokens: "x"}).body).toBeNull();
    });
});

describe("빈 값 지우기 (PUT 이 null 로 덮어씀)", () => {
    it("비운 model 은 null 로 보낸다", () => {
        expect(toToolBody({...toToolForm({...tool, model: "opus"}), model: " "}).body?.model).toBeNull();
    });
    it("비운 promptTemplate 은 null 로 보낸다", () => {
        const w = {projectKey: " CIRA ", workspacePath: "/workspace/a ", defaultTool: "CLAUDE" as const, promptTemplate: "  "};
        expect(toWorkspaceBody(w)).toEqual({projectKey: "CIRA", workspacePath: "/workspace/a", defaultTool: "CLAUDE", promptTemplate: null});
    });
});
