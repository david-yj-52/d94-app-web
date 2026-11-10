import {describe, expect, it} from "vitest";
import {issueTypeTone, priorityMeta, statusTone} from "./tones";

describe("cira/ui tones", () => {
    it("상태 분류가 없거나 모르는 값이면 할 일", () => {
        expect(statusTone("IN_PROGRESS")).toBe("inProgress");
        expect(statusTone("DONE")).toBe("done");
        expect(statusTone(undefined)).toBe("todo");
        expect(statusTone("WEIRD")).toBe("todo");
    });

    it("이슈 유형은 한글·영문·대소문자 무관, 모르면 작업", () => {
        expect(issueTypeTone("버그")).toBe("bug");
        expect(issueTypeTone("Bug")).toBe("bug");
        expect(issueTypeTone("STORY")).toBe("story");
        expect(issueTypeTone("스토리")).toBe("story");
        expect(issueTypeTone("작업")).toBe("task");
        expect(issueTypeTone("Epic")).toBe("task");
        expect(issueTypeTone(null)).toBe("task");
    });

    it("우선순위 라벨, 모르는 값은 null", () => {
        expect(priorityMeta("HIGHEST")).toEqual({label: "최고", tone: "highest"});
        expect(priorityMeta(undefined)).toBeNull();
        expect(priorityMeta("NOPE")).toBeNull();
    });
});
