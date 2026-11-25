import type {FieldDef, LibraryItem} from "@/types/fields";
import {render, screen, within} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {describe, expect, it, vi} from "vitest";
import ColumnPicker from "./ColumnPicker";
import FieldLibraryDialog from "./FieldLibraryDialog";

const f = (fieldKey: string, name: string, extra: Partial<FieldDef> = {}): FieldDef =>
    ({fieldKey, name, kind: "sys", fieldType: "TEXT", required: false, sortable: true, defaultVisible: true, ...extra});
const mine = f("cf:1", "내 컬럼", {kind: "cf", scope: "project", canEdit: true});
const theirs = f("cf:2", "남의 컬럼", {kind: "cf", scope: "project", canEdit: false});
const fields = [f("sys:key", "키"), f("sys:summary", "요약"), mine, theirs];

async function open(props: Partial<Parameters<typeof ColumnPicker>[0]> = {}) {
    const handlers = {onChange: vi.fn(), onCreate: vi.fn(), onImport: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn()};
    render(<ColumnPicker fields={fields} columns={["sys:key", "sys:summary", "cf:1"]} {...handlers} {...props}/>);
    await userEvent.click(screen.getByRole("button", {name: "컬럼"}));
    return handlers;
}

describe("ColumnPicker — 만들기·가져오기", () => {
    it("[+ 새 컬럼 만들기]·[+ 라이브러리에서 가져오기] 를 누르면 부모에게 알린다", async () => {
        const h = await open();
        await userEvent.click(screen.getByRole("button", {name: "+ 새 컬럼 만들기"}));
        expect(h.onCreate).toHaveBeenCalled(); // 창을 닫고 부모가 만들기 창을 연다
        await userEvent.click(screen.getByRole("button", {name: "컬럼"}));
        await userEvent.click(screen.getByRole("button", {name: "+ 라이브러리에서 가져오기"}));
        expect(h.onImport).toHaveBeenCalled();
    });

    it("canEdit 인 프로젝트 필드만 [수정]·[삭제] 가 보인다", async () => {
        const h = await open();
        expect(screen.getByRole("button", {name: "내 컬럼 수정"})).toBeInTheDocument();
        expect(screen.queryByRole("button", {name: "남의 컬럼 삭제"})).toBeNull();
        expect(screen.queryByRole("button", {name: "남의 컬럼 수정"})).toBeNull();
        await userEvent.click(screen.getByRole("button", {name: "내 컬럼 삭제"}));
        expect(h.onDelete).toHaveBeenCalledWith(mine);
    });
});

describe("FieldLibraryDialog", () => {
    const items: LibraryItem[] = [
        {field: f("cf:G", "고객사", {kind: "cf", scope: "global"}), importedAs: "cf:9"},
        {field: f("cf:T", "계약 단계", {kind: "cf", scope: "type"}), importedAs: null},
    ];

    it("이미 가져온 항목은 '가져옴'으로 비활성, 아니면 [가져오기] 가 원본 id 로 onImport", async () => {
        const onImport = vi.fn();
        render(<FieldLibraryDialog items={items} onImport={onImport} onClose={vi.fn()}/>);
        const done = screen.getByRole("listitem", {name: "고객사"});
        expect(within(done).getByRole("button", {name: "가져옴"})).toBeDisabled();
        await userEvent.click(within(screen.getByRole("listitem", {name: "계약 단계"})).getByRole("button", {name: "가져오기"}));
        expect(onImport).toHaveBeenCalledWith("T");
    });
});
