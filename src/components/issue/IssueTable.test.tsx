import type {FieldDef} from "@/types/fields";
import type {IssueResponse} from "@/types/issue";
import {render, screen, within} from "@testing-library/react";
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
        render(<IssueTable issues={[issue]} projectId="p1" fields={fields} columns={["sys:key", "cf:1", "gone", "sys:summary"]}/>);
        expect(headers()).toEqual(["키", "금액", "요약"]);
        expect(screen.getByText("1,200")).toBeInTheDocument();
    });

    it("정렬 가능한 sys 헤더를 누르면 asc, 같은 헤더를 다시 누르면 desc. 사용자 정의 필드는 버튼이 없다", async () => {
        const onSort = vi.fn();
        const {rerender} = render(<IssueTable issues={[issue]} projectId="p1" fields={fields} columns={["sys:dueDate", "cf:1"]} onSort={onSort}/>);
        await userEvent.click(screen.getByRole("button", {name: "마감일"}));
        expect(onSort).toHaveBeenLastCalledWith("sys:dueDate,asc");
        rerender(<IssueTable issues={[issue]} projectId="p1" fields={fields} columns={["sys:dueDate", "cf:1"]} onSort={onSort} sort="sys:dueDate,asc"/>);
        await userEvent.click(screen.getByRole("button", {name: "마감일"}));
        expect(onSort).toHaveBeenLastCalledWith("sys:dueDate,desc");
        expect(screen.queryByRole("button", {name: "금액"})).toBeNull();
    });

    it("fields 가 없으면(검색 결과) 고정 컬럼", () => {
        render(<IssueTable issues={[issue]}/>);
        expect(headers()).toEqual(["", "키", "요약", "상태", "P", "담당자", "수정일"]);
    });
});
