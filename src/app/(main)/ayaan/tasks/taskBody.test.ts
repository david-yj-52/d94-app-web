import {describe, expect, it} from "vitest";
import {toCreateBody} from "./taskBody";

const base = {projectKey: "TSTA", issueKey: "", prompt: "", tool: "", policy: ""};

describe("toCreateBody", () => {
    it("이슈를 고르면 이슈 키로 등록한다", () => {
        expect(toCreateBody({...base, issueKey: "TSTA-1", prompt: "무시됨"})).toEqual({issueKey: "TSTA-1", source: "WEB"});
    });
    it("이슈 없이 프롬프트면 고른 프로젝트 작업공간으로 등록한다", () => {
        expect(toCreateBody({...base, prompt: " 설계해 ", tool: "CLAUDE"}))
            .toEqual({prompt: "설계해", projectKey: "TSTA", tool: "CLAUDE", source: "WEB"});
    });
    it("프로젝트나 내용이 없으면 오류 문구를 돌려준다", () => {
        expect(toCreateBody({...base, projectKey: ""})).toBe("프로젝트를 선택하세요.");
        expect(toCreateBody(base)).toBe("이슈를 고르거나 프롬프트를 입력하세요.");
    });
    it("단계·skill 을 고르면 함께 보낸다 (비우면 서버 기본)", () => {
        expect(toCreateBody({...base, issueKey: "TSTA-1", phase: "DEV", skillCd: "NONE"}))
            .toEqual({issueKey: "TSTA-1", phase: "DEV", skillCd: "NONE", source: "WEB"});
        expect(toCreateBody({...base, issueKey: "TSTA-1", phase: "", skillCd: ""})).toEqual({issueKey: "TSTA-1", source: "WEB"});
    });
});
