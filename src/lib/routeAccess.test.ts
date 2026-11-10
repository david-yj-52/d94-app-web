import {describe, expect, it} from "vitest";
import {classifyPath} from "./routeAccess";

describe("lib/routeAccess classifyPath", () => {
    it("CIRA 경로는 보호한다", () => {
        expect(classifyPath("/cira")).toBe("protected");
        expect(classifyPath("/cira/")).toBe("protected");
        expect(classifyPath("/cira/projects/p1/issues/i1")).toBe("protected");
        expect(classifyPath("/interface-test")).toBe("protected");
    });

    it("예전 가입 경로와 접두사만 같은 경로는 열어 둔다", () => {
        expect(classifyPath("/cira/register")).toBe("open");
        expect(classifyPath("/cirafoo")).toBe("open");
        expect(classifyPath("/home")).toBe("open");
    });

    it("로그인·가입은 비로그인 전용이다", () => {
        expect(classifyPath("/login")).toBe("publicOnly");
        expect(classifyPath("/register")).toBe("publicOnly");
    });
});
