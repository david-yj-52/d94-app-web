import {boardDetail, ok} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {lastRequest, renderWithClient} from "@/test/utils";
import {fireEvent, screen, waitFor} from "@testing-library/react";
import {http, HttpResponse} from "msw";
import {describe, expect, it, vi} from "vitest";
import KanbanBoard from "./KanbanBoard";

vi.mock("next/navigation", () => ({useRouter: () => ({push: vi.fn()})}));

const MOVE = "*/api/proxy/v1/boards/:boardId/issues/:issueId/move";

/** jsdom 에는 DataTransfer 가 없다 → 드래그 한 번 동안 같은 객체를 쓴다 */
function fakeDataTransfer() {
    const data: Record<string, string> = {};
    return {
        effectAllowed: "", dropEffect: "",
        setData: (type: string, v: string) => void (data[type] = v),
        getData: (type: string) => data[type] ?? "",
    };
}

const card = (title: string) => screen.getByText(title).closest("[draggable]")!;
const column = (name: string) => screen.getByText(name).closest(".group")!;
const titlesIn = (name: string) =>
    [...column(name).querySelectorAll("[draggable] p")].map((p) => p.textContent);

async function renderBoard() {
    renderWithClient(<KanbanBoard boardId="BRD-1" projectId="PRJ-1"/>);
    await screen.findByText("메인 보드");
}

function drag(from: string, overCard: string | null, dropColumn: string) {
    const dataTransfer = fakeDataTransfer();
    fireEvent.dragStart(card(from), {dataTransfer});
    if (overCard) fireEvent.dragOver(card(overCard), {dataTransfer});
    else fireEvent.dragOver(column(dropColumn), {dataTransfer});
    fireEvent.drop(column(dropColumn), {dataTransfer});
}

/** 서버 응답을 붙잡아 두어 낙관적 갱신 결과를 화면에서 본다 */
function holdMove() {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    server.use(http.put(MOVE, async () => {
        await gate;
        return HttpResponse.json(ok(boardDetail()));
    }));
    return release;
}

describe("KanbanBoard 드래그 앤 드롭", () => {
    it("보드 이름·컬럼·카드를 그린다", async () => {
        await renderBoard();
        expect(titlesIn("할 일")).toEqual(["이슈 CIRA-11", "이슈 CIRA-12", "이슈 CIRA-13"]);
        expect(titlesIn("완료")).toEqual(["이슈 CIRA-21"]);
    });

    it("카드 위에 놓으면 그 카드 앞(beforeIssueId)으로 이동 요청한다", async () => {
        await renderBoard();
        drag("이슈 CIRA-11", "이슈 CIRA-21", "완료");
        await waitFor(() => expect(lastRequest("PUT")).toMatchObject({
            path: "/v1/boards/BRD-1/issues/A1/move",
            body: {targetColumnId: "COL-B", beforeIssueId: "B1"},
        }));
    });

    it("같은 컬럼 안에서 위치를 바꾸면 화면 순서가 바로 바뀐다 (낙관적)", async () => {
        await renderBoard();
        const release = holdMove();
        drag("이슈 CIRA-11", "이슈 CIRA-13", "할 일");
        await waitFor(() => expect(titlesIn("할 일")).toEqual(["이슈 CIRA-12", "이슈 CIRA-11", "이슈 CIRA-13"]));
        release();
    });

    it("컬럼 빈 곳에 놓으면 beforeIssueId 없이 보내고 끝에 붙는다", async () => {
        await renderBoard();
        const release = holdMove();
        drag("이슈 CIRA-21", null, "할 일");
        await waitFor(() => expect(titlesIn("할 일")).toEqual(["이슈 CIRA-11", "이슈 CIRA-12", "이슈 CIRA-13", "이슈 CIRA-21"]));
        expect(titlesIn("완료")).toEqual([]);
        release();
    });

    // 카드를 끌면 dragover 가 그 카드 자신에서도 일어나 beforeIssueId=자기 자신 이 된다 → 이동 요청을 보내지 않는다
    it("카드를 제자리에 놓으면 순서가 바뀌지 않고 요청도 보내지 않는다", async () => {
        await renderBoard();
        drag("이슈 CIRA-11", "이슈 CIRA-11", "할 일");
        await new Promise((r) => setTimeout(r, 50));
        expect(titlesIn("할 일")).toEqual(["이슈 CIRA-11", "이슈 CIRA-12", "이슈 CIRA-13"]);
        expect(lastRequest("PUT")).toBeUndefined();
    });

    it("이동이 실패하면 원래 순서로 되돌리고 오류 토스트를 띄운다", async () => {
        await renderBoard();
        server.use(http.put(MOVE, () => HttpResponse.json({success: false, code: "INTERNAL_ERROR", message: "x"}, {status: 500})));
        drag("이슈 CIRA-11", "이슈 CIRA-21", "완료");
        expect(await screen.findByText("이슈 이동에 실패했습니다.")).toBeInTheDocument();
        expect(titlesIn("할 일")).toEqual(["이슈 CIRA-11", "이슈 CIRA-12", "이슈 CIRA-13"]);
    });

    it("dataTransfer 가 비어 있으면 요청하지 않는다", async () => {
        await renderBoard();
        fireEvent.drop(column("완료"), {dataTransfer: fakeDataTransfer()});
        await new Promise((r) => setTimeout(r, 20));
        expect(lastRequest("PUT")).toBeUndefined();
    });
});
