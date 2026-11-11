import {describe, expect, it} from "vitest";
import {ayaanError} from "./format";

describe("ayaanError", () => {
    it("400 message, 422 data, 그 외 fallback", () => {
        expect(ayaanError({response: {data: {success: false, message: "tool FAKE is not enabled"}}}, "x")).toBe("tool FAKE is not enabled");
        expect(ayaanError({response: {data: {success: false, data: {prompt: "required"}}}}, "x")).toBe("prompt: required");
        expect(ayaanError(new Error("net"), "등록에 실패했습니다.")).toBe("등록에 실패했습니다.");
    });
});
