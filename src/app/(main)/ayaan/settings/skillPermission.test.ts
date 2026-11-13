import {describe, expect, it} from "vitest";
import {askWarning, EMPTY_SKILL, pluginRefs, skillOptions, toSkillBody} from "./skillPermission";
import type {AyaanSkill} from "@/types/ayaan";

const sk = (o: Partial<AyaanSkill>): AyaanSkill => ({...EMPTY_SKILL, skillCd: "S", skillNm: "s", invokeText: "/s", ...o});

describe("skillOptions", () => {
    it("Tool·단계가 맞고 사용 중인 skill 만, ANY 는 두 단계 모두", () => {
        const all = [sk({skillCd: "P"}), sk({skillCd: "D", phase: "DEV"}), sk({skillCd: "A", phase: "ANY"}),
            sk({skillCd: "X", enabled: false}), sk({skillCd: "G", toolCd: "GEMINI"})];
        expect(skillOptions(all, "CLAUDE", "PLAN").map((s) => s.skillCd)).toEqual(["P", "A"]);
        expect(skillOptions(all, "CLAUDE", "DEV").map((s) => s.skillCd)).toEqual(["D", "A"]);
    });
});

describe("askWarning", () => {
    it("Claude·전체(*) 외 Tool 의 ASK 만 경고", () => {
        const row = {toolCd: "CODEX" as const, category: "GIT_PUSH" as const, matcher: "*", decision: "ASK" as const, priority: 0, description: null};
        expect(askWarning(row)).toMatch(/CODEX/);
        expect(askWarning({...row, toolCd: "CLAUDE"})).toBeNull();
        expect(askWarning({...row, toolCd: "*"})).toBeNull();
        expect(askWarning({...row, decision: "DENY"})).toBeNull();
    });
});

describe("toSkillBody", () => {
    it("코드 대문자화·빈 플러그인 null", () => {
        expect(toSkillBody(sk({skillCd: " my_skill ", pluginRef: " "}))).toMatchObject({skillCd: "MY_SKILL", pluginRef: null});
    });
    it("잘못된 입력은 문구", () => {
        expect(typeof toSkillBody(sk({skillCd: "NONE"}))).toBe("string");
        expect(typeof toSkillBody(sk({invokeText: " "}))).toBe("string");
        expect(typeof toSkillBody(sk({toolCd: "CODEX", pluginRef: "a@b"}))).toBe("string");
    });
    it("CLAUDE_PLUGINS 에서 plugin@market 추출", () => {
        expect(pluginRefs("a@m|https://x, b@n|https://y")).toEqual(["a@m", "b@n"]);
    });
});
