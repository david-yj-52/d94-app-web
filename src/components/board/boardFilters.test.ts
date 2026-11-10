import type {BoardColumnResponse, BoardIssueResponse} from "@/types/board";
import {describe, expect, it} from "vitest";
import {filterColumns} from "./boardFilters";

const issue = (id: string, key: string, title: string, email?: string): BoardIssueResponse => ({
    id, issueKey: key, title, assignee: email ? {email, name: email} : undefined,
});
const col = (id: string, issues: BoardIssueResponse[]): BoardColumnResponse => ({
    id, boardId: "b1", columnNm: id, sortOrd: 0, issues,
});
const cols = [
    col("c1", [issue("mine", "CIRA-1", "로그인 버그", "Dev@Example.com"), issue("none", "CIRA-2", "할당 없음")]),
    col("c2", [issue("other", "CIRA-3", "다른 사람", "x@example.com")]),
];
const ids = (cs: BoardColumnResponse[]) => cs.flatMap((c) => c.issues.map((i) => i.id));

describe("board filterColumns", () => {
    it("내 이슈만: 이메일 대소문자 무시, 담당자 없는 이슈 제외, 빈 컬럼 유지", () => {
        const r = filterColumns(cols, {mineEmail: "dev@example.com"});
        expect(ids(r)).toEqual(["mine"]);
        expect(r.map((c) => c.id)).toEqual(["c1", "c2"]);
    });

    it("세션 이메일이 없으면 아무것도 숨기지 않는다", () => {
        expect(filterColumns(cols, {mineEmail: undefined})).toBe(cols);
    });

    it("키워드는 키·제목 부분 일치", () => {
        expect(ids(filterColumns(cols, {keyword: "cira-3"}))).toEqual(["other"]);
        expect(ids(filterColumns(cols, {keyword: "버그"}))).toEqual(["mine"]);
        expect(filterColumns(cols, {keyword: "  "})).toBe(cols);
    });
});
