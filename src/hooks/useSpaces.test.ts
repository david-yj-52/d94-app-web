import {describe, expect, it} from "vitest";
import {spaceHref} from "./useSpaces";

describe("spaceHref", () => {
    it("기본 공간이어도 항상 ?space= 를 붙인다", () => {
        expect(spaceHref("/cira/projects/p1/issues", "def")).toBe("/cira/projects/p1/issues?space=def");
    });
    it("이미 쿼리가 있으면 & 로 잇는다", () => {
        expect(spaceHref("/x?tab=a", "s1")).toBe("/x?tab=a&space=s1");
    });
    it("공간이 없으면 그대로", () => {
        expect(spaceHref("/x", undefined)).toBe("/x");
    });
});
