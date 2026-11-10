import {describe, expect, it} from "vitest";
import {getNavContext} from "./navContext";

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
});
