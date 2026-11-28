import type {FieldDef} from "@/types/fields";
import type {IssueResponse} from "@/types/issue";
import {renderWithClient} from "@/test/utils";
import {screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, it, vi} from "vitest";
import IssueTable from "./IssueTable";

vi.mock("next/navigation", () => ({useRouter: () => ({push: vi.fn()})}));

const f = (fieldKey: string, name: string, extra: Partial<FieldDef> = {}): FieldDef =>
    ({fieldKey, name, kind: "sys", fieldType: "TEXT", required: false, sortable: true, defaultVisible: true, ...extra});
const fields = [
    f("sys:key", "키"), f("sys:summary", "요약"), f("sys:dueDate", "마감일", {fieldType: "DATE"}),
    f("cf:1", "금액", {kind: "cf", fieldType: "NUMBER", sortable: false}),
];
const issue: IssueResponse = {
    id: "i1", issueKey: "T-1", title: "첫 Task", projectId: "p1", createdAt: "2026-01-01T00:00:00", modifiedAt: "2026-01-01T00:00:00",
    customFields: {"cf:1": 1200},
};
const headers = () => within(screen.getAllByRole("row")[0]).getAllByRole("columnheader").map((h) => h.textContent);

describe("IssueTable", () => {
    it("columns 순서대로 그리고 사용자 정의 값을 보여 준다. 유효 필드가 아닌 키는 건너뛴다", () => {
        renderWithClient(<IssueTable issues={[issue]} projectId="p1" fields={fields} columns={["sys:key", "cf:1", "gone", "sys:summary"]}/>);
        expect(headers()).toEqual(["키", "금액", "요약"]);
        expect(screen.getByText("1,200")).toBeInTheDocument();
    });

    it("정렬 가능한 sys 헤더를 누르면 asc, 같은 헤더를 다시 누르면 desc. 사용자 정의 필드는 버튼이 없다", async () => {
        const onSort = vi.fn();
        const {rerender} = renderWithClient(<IssueTable issues={[issue]} projectId="p1" fields={fields} columns={["sys:dueDate", "cf:1"]} onSort={onSort}/>);
        await userEvent.click(screen.getByRole("button", {name: "마감일"}));
        expect(onSort).toHaveBeenLastCalledWith("sys:dueDate,asc");
        rerender(<IssueTable issues={[issue]} projectId="p1" fields={fields} columns={["sys:dueDate", "cf:1"]} onSort={onSort} sort="sys:dueDate,asc"/>);
        await userEvent.click(screen.getByRole("button", {name: "마감일"}));
        expect(onSort).toHaveBeenLastCalledWith("sys:dueDate,desc");
        expect(screen.queryByRole("button", {name: "금액"})).toBeNull();
    });

    it("fields 가 없으면(검색 결과) 고정 컬럼", () => {
        renderWithClient(<IssueTable issues={[issue]}/>);
        expect(headers()).toEqual(["", "키", "요약", "상태", "P", "담당자", "수정일"]);
    });
});

describe("IssueTable 공간 열 (통합 Task 목록)", () => {
    it("spaceNames 가 있으면 고정 컬럼의 키 다음에 공간 열, 모르는 공간은 -", () => {
        renderWithClient(<IssueTable issues={[{...issue, spaceId: "s1"}, {...issue, id: "i2", spaceId: null}]} projectId="p1" spaceNames={{s1: "HW팀"}}/>);
        expect(headers()).toEqual(["", "키", "공간", "요약", "상태", "P", "담당자", "수정일"]);
        expect(screen.getAllByText("HW팀").length).toBeGreaterThan(0);
        expect(screen.getAllByText("-").length).toBeGreaterThan(0);
    });

    it("spaceNames 가 없으면 공간 열 없음", () => {
        renderWithClient(<IssueTable issues={[issue]} projectId="p1"/>);
        expect(screen.queryByRole("columnheader", {name: "공간"})).toBeNull();
    });
});

describe("IssueTable 공통 Feature 우선 (설계 3.2)", () => {
    it("공통 Feature 에 연결된 Task 는 배지가 붙고, 정렬을 고르지 않았으면 먼저 나온다", async () => {
        const {server} = await import("@/test/msw/server");
        const {http, HttpResponse} = await import("msw");
        const {ok} = await import("@/test/msw/fixtures");
        server.use(http.get("*/api/proxy/v1/projects/:projectId/features", () => HttpResponse.json(ok([
            {feature: {id: "F-1", issueKey: "P-9", title: "원격 펌프 제어", featureScope: "COMMON"}, taskCount: 1, children: []},
        ]))));
        const plain = {id: "I-1", issueKey: "P-1", title: "일반 Task"} as IssueResponse;
        const linked = {id: "I-2", issueKey: "P-2", title: "공통에 연결된 Task", featureId: "F-1"} as IssueResponse;
        renderWithClient(<IssueTable issues={[plain, linked]} projectId="p1"/>);
        const badges = await screen.findAllByText("공통 · P-9");
        expect(badges.length).toBeGreaterThan(0);
        const keys = screen.getAllByText(/^P-[12]$/).map((e) => e.textContent);
        expect(keys[0]).toBe("P-2");
    });
});
