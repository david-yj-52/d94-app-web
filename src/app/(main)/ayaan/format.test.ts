import {describe, expect, it} from "vitest";
import {ayaanError, canCleanWorkspace, cleanError} from "./format";

describe("ayaanError", () => {
    it("400 message, 422 data, 그 외 fallback", () => {
        expect(ayaanError({response: {data: {success: false, message: "tool FAKE is not enabled"}}}, "x")).toBe("tool FAKE is not enabled");
        expect(ayaanError({response: {data: {success: false, data: {prompt: "required"}}}}, "x")).toBe("prompt: required");
        expect(ayaanError(new Error("net"), "등록에 실패했습니다.")).toBe("등록에 실패했습니다.");
    });
});

describe("cleanError / canCleanWorkspace", () => {
    it("409 미push 만 고정 문구, 그 외 409 는 서버 메시지", () => {
        const e = (message: string) => ({response: {status: 409, data: {success: false, message}}});
        expect(cleanError(e("workspace has uncommitted or unpushed changes"))).toBe("push되지 않은 변경이 있어 정리하지 않았습니다.");
        expect(cleanError(e("task or its plan is still active"))).toBe("task or its plan is still active");
        expect(cleanError(new Error("net"))).toBe("요청에 실패했습니다.");
    });
    it("FAILED 는 서버가 거절하므로 정리 버튼 없음", () => {
        expect(["DONE", "CANCELLED", "FAILED", "RUNNING"].map(canCleanWorkspace)).toEqual([true, true, false, false]);
    });
});
