import {board, boardDetail} from "@/test/msw/fixtures";
import {lastRequest} from "@/test/utils";
import {describe, expect, it} from "vitest";
import {
    addColumn,
    createBoard,
    deleteBoard,
    deleteColumn,
    getBoardDetail,
    getBoards,
    moveIssue,
    updateBoard,
    updateColumn,
} from "./boards";

describe("lib/api/boards", () => {
    it("getBoards: 프로젝트 보드 목록", async () => {
        expect(await getBoards("PRJ-1")).toEqual([board]);
        expect(lastRequest()?.path).toBe("/v1/projects/PRJ-1/boards");
    });

    it("getBoardDetail: 컬럼과 이슈(rankStr 포함)를 그대로 돌려준다", async () => {
        const detail = await getBoardDetail("BRD-1");
        expect(lastRequest()?.path).toBe("/v1/boards/BRD-1");
        expect(detail).toEqual(boardDetail());
        expect(detail.columns[0].issues.map((i) => i.id)).toEqual(["A1", "A2", "A3"]);
    });

    it("createBoard / updateBoard / deleteBoard 경로", async () => {
        await createBoard("PRJ-1", {boardNm: "새 보드"});
        expect(lastRequest()).toMatchObject({method: "POST", path: "/v1/projects/PRJ-1/boards", body: {boardNm: "새 보드"}});
        await updateBoard("BRD-1", {boardNm: "이름 변경"});
        expect(lastRequest()).toMatchObject({method: "PUT", path: "/v1/boards/BRD-1"});
        await deleteBoard("BRD-1");
        expect(lastRequest()).toMatchObject({method: "DELETE", path: "/v1/boards/BRD-1"});
    });

    it("컬럼 추가·수정·삭제 경로", async () => {
        await addColumn("BRD-1", {columnNm: "검토", statusId: "ST-REVIEW", wipLimit: 3});
        expect(lastRequest()).toMatchObject({
            method: "POST", path: "/v1/boards/BRD-1/columns", body: {columnNm: "검토", statusId: "ST-REVIEW", wipLimit: 3},
        });
        await updateColumn("BRD-1", "COL-A", {wipLimit: 2});
        expect(lastRequest()).toMatchObject({method: "PUT", path: "/v1/boards/BRD-1/columns/COL-A", body: {wipLimit: 2}});
        await deleteColumn("BRD-1", "COL-A");
        expect(lastRequest()).toMatchObject({method: "DELETE", path: "/v1/boards/BRD-1/columns/COL-A"});
    });

    it("moveIssue: MoveIssueRequest 를 보내고 서버가 준 보드 상세를 돌려준다", async () => {
        const res = await moveIssue("BRD-1", "A1", {targetColumnId: "COL-B", beforeIssueId: "B1"});
        expect(lastRequest()).toMatchObject({
            method: "PUT",
            path: "/v1/boards/BRD-1/issues/A1/move",
            body: {targetColumnId: "COL-B", beforeIssueId: "B1"},
        });
        expect(res.columns).toHaveLength(2);
    });
});
