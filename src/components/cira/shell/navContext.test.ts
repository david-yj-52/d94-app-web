import {describe, expect, it} from "vitest";
import {getNavContext, teamActive, teamLinks} from "./navContext";

describe("cira/shell getNavContext", () => {
    it("프로젝트 밖", () => {
        expect(getNavContext("/cira/projects")).toEqual({inSettings: false});
        expect(getNavContext("/cira/search")).toEqual({inSettings: false});
    });

    it("프로젝트 안·설정 안", () => {
        expect(getNavContext("/cira/projects/p1/boards/b1")).toEqual({projectId: "p1", inSettings: false});
        expect(getNavContext("/cira/projects/p1/settings/workflow")).toEqual({projectId: "p1", inSettings: true});
        expect(getNavContext("/cira/projects/p1/settings")).toEqual({projectId: "p1", inSettings: true});
    });

    it("teamLinks", () => {
        expect(teamLinks(false).map((l) => l.label)).toEqual(["보드", "Task"]);
        expect(teamLinks(true).map((l) => l.label)).toEqual(["보드", "Task", "공간 설정"]);
        expect(teamLinks(true).map((l) => l.suffix)).toEqual(["/boards", "/issues", "/settings/space"]);
    });

    it("teamActive — 기본 팀 Task 와 통합 Task 구분, 옛 /boards 링크는 기본 팀", () => {
        const b = "/cira/projects/p1";
        expect(teamActive(`${b}/issues`, b, "/issues", "def", "def", true)).toBe(false);   // 통합
        expect(teamActive(`${b}/issues`, b, "/issues", "def", "def", false)).toBe(true);   // ?space=def
        expect(teamActive(`${b}/boards`, b, "/boards", "def", "def", true)).toBe(true);    // 옛 링크
        expect(teamActive(`${b}/boards/x`, b, "/boards", "hw", "def", false)).toBe(false); // 다른 팀
        expect(teamActive(`${b}/boards/x`, b, "/boards", "hw", "hw", false)).toBe(true);   // 하위 경로
    });
});
