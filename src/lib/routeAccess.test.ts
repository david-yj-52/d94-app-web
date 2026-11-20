import {describe, expect, it} from "vitest";
import {classifyPath, safeCallbackUrl} from "./routeAccess";

describe("lib/routeAccess classifyPath", () => {
    it("기준정보 화면은 보호한다", () => {
        expect(classifyPath("/settings")).toBe("protected");
    });

    it("CIRA 경로는 보호한다", () => {
        expect(classifyPath("/cira")).toBe("protected");
        expect(classifyPath("/cira/")).toBe("protected");
        expect(classifyPath("/cira/projects/p1/issues/i1")).toBe("protected");
        expect(classifyPath("/interface-test")).toBe("protected");
        expect(classifyPath("/study/doc1")).toBe("protected");
        expect(classifyPath("/ayaan/settings")).toBe("protected");
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

    it("safeCallbackUrl 은 내부 경로(쿼리·해시 포함)만 돌려주고, 외부·로그인 화면·이상한 값은 /home", () => {
        expect(safeCallbackUrl("/cira/projects/p1/issues/i1?tab=c#c3")).toBe("/cira/projects/p1/issues/i1?tab=c#c3");
        for (const bad of [undefined, "", "https://evil.com", "//evil.com", "/\\evil.com", "/\t/evil.com", "javascript:alert(1)", "/login", "/register?x=1"]) {
            expect(safeCallbackUrl(bad)).toBe("/home");
        }
    });
});
