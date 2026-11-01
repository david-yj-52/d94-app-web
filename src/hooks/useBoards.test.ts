import {boardDetail, ok} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {createTestQueryClient, renderHookWithClient} from "@/test/utils";
import type {BoardDetailResponse} from "@/types/board";
import {act, waitFor} from "@testing-library/react";
import {http, HttpResponse} from "msw";
import {describe, expect, it, vi} from "vitest";
import {
    useAddColumn,
    useBoardDetail,
    useBoards,
    useCreateBoard,
    useDeleteBoard,
    useDeleteColumn,
    useMoveIssue,
    useUpdateBoard,
    useUpdateColumn,
} from "./useBoards";

const MOVE = "*/api/proxy/v1/boards/:boardId/issues/:issueId/move";

/** 서버 응답을 붙잡아 두는 핸들러 — 낙관적 갱신 상태를 확인하는 동안 응답을 보내지 않는다 */
function holdMove() {
    let release!: () => void;
    let arrived!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    // mutationFn 은 onMutate(낙관적 갱신)가 끝난 뒤 실행된다 → 요청 도착 = 낙관적 상태 확정
    const reached = new Promise<void>((r) => (arrived = r));
    server.use(http.put(MOVE, async () => {
        arrived();
        await gate;
        return HttpResponse.json(ok(boardDetail()));
    }));
    return {release, reached};
}

function seededClient() {
    const client = createTestQueryClient();
    client.setQueryData(["board", "BRD-1"], boardDetail());
    return client;
}

const order = (client: ReturnType<typeof createTestQueryClient>, columnId: string) =>
    client.getQueryData<BoardDetailResponse>(["board", "BRD-1"])!
        .columns.find((c) => c.id === columnId)!.issues.map((i) => i.id);

describe("useBoards 조회 훅", () => {
    it("useBoards → [\"boards\", projectId], useBoardDetail → [\"board\", boardId]", async () => {
        const {result, client} = renderHookWithClient(() => ({list: useBoards("PRJ-1"), detail: useBoardDetail("BRD-1")}));
        await waitFor(() => expect(result.current.detail.isSuccess && result.current.list.isSuccess).toBe(true));
        expect(client.getQueryData(["boards", "PRJ-1"])).toHaveLength(1);
        expect(client.getQueryData(["board", "BRD-1"])).toEqual(boardDetail());
    });

    it("id 가 비면 요청하지 않는다", () => {
        const {result} = renderHookWithClient(() => useBoardDetail(""));
        expect(result.current.fetchStatus).toBe("idle");
    });
});

describe("useBoards 변경 훅 invalidate", () => {
    it.each([
        ["useCreateBoard", () => useCreateBoard("PRJ-1"), {boardNm: "x"}, [["boards", "PRJ-1"]]],
        ["useUpdateBoard", () => useUpdateBoard("BRD-1", "PRJ-1"), {boardNm: "x"}, [["board", "BRD-1"], ["boards", "PRJ-1"]]],
        ["useDeleteBoard", () => useDeleteBoard("PRJ-1"), "BRD-1", [["boards", "PRJ-1"]]],
        ["useAddColumn", () => useAddColumn("BRD-1"), {columnNm: "c", statusId: "s"}, [["board", "BRD-1"]]],
        ["useUpdateColumn", () => useUpdateColumn("BRD-1"), {columnId: "COL-A", data: {wipLimit: 1}}, [["board", "BRD-1"]]],
        ["useDeleteColumn", () => useDeleteColumn("BRD-1"), "COL-A", [["board", "BRD-1"]]],
    ] as const)("%s", async (_name, hook, vars, keys) => {
        const {result, client} = renderHookWithClient(hook as () => {mutateAsync: (v: unknown) => Promise<unknown>});
        const spy = vi.spyOn(client, "invalidateQueries");
        await act(() => result.current.mutateAsync(vars));
        expect(spy.mock.calls.map((c) => c[0]?.queryKey)).toEqual(keys);
    });
});

describe("useMoveIssue — 칸반 순서 (낙관적 갱신)", () => {
    async function moveAndPeek(issueId: string, data: Parameters<ReturnType<typeof useMoveIssue>["mutate"]>[0]["data"]) {
        const client = seededClient();
        const {release, reached} = holdMove();
        const {result} = renderHookWithClient(() => useMoveIssue("BRD-1"), client);
        act(() => result.current.mutate({issueId, data}));
        await reached;
        return {client, release, result};
    }

    it("beforeIssueId 가 있으면 그 이슈 앞에 넣는다 (다른 컬럼)", async () => {
        const {client, release} = await moveAndPeek("A1", {targetColumnId: "COL-B", beforeIssueId: "B1"});
        expect(order(client, "COL-A")).toEqual(["A2", "A3"]);
        expect(order(client, "COL-B")).toEqual(["A1", "B1"]);
        release();
    });

    it("같은 컬럼 안에서 아래 이슈 앞으로 옮긴다", async () => {
        const {client, release} = await moveAndPeek("A1", {targetColumnId: "COL-A", beforeIssueId: "A3"});
        expect(order(client, "COL-A")).toEqual(["A2", "A1", "A3"]);
        release();
    });

    it("afterIssueId 가 있으면 그 이슈 뒤에 넣는다", async () => {
        const {client, release} = await moveAndPeek("A3", {targetColumnId: "COL-A", afterIssueId: "A1"});
        expect(order(client, "COL-A")).toEqual(["A1", "A3", "A2"]);
        release();
    });

    it("기준 이슈가 없으면 컬럼 끝에 붙인다", async () => {
        const {client, release} = await moveAndPeek("B1", {targetColumnId: "COL-A"});
        expect(order(client, "COL-A")).toEqual(["A1", "A2", "A3", "B1"]);
        expect(order(client, "COL-B")).toEqual([]);
        release();
    });

    it("기준 이슈를 찾지 못하면 컬럼 끝에 붙인다", async () => {
        const {client, release} = await moveAndPeek("B1", {targetColumnId: "COL-A", beforeIssueId: "ZZZ"});
        expect(order(client, "COL-A")).toEqual(["A1", "A2", "A3", "B1"]);
        release();
    });

    // beforeIssueId 가 자기 자신이면 제자리 → 낙관적 갱신을 하지 않는다 (예전에는 컬럼 끝으로 갔다)
    it("카드를 자기 자신 앞에 놓으면 순서가 그대로다", async () => {
        const {client, release} = await moveAndPeek("A1", {targetColumnId: "COL-A", beforeIssueId: "A1"});
        release();
        expect(order(client, "COL-A")).toEqual(["A1", "A2", "A3"]);
    });

    it("성공하면 서버가 준 보드 상세로 캐시를 덮는다", async () => {
        const client = seededClient();
        const server_ = boardDetail();
        server_.columns[1].issues = [];
        server.use(http.put(MOVE, () => HttpResponse.json(ok(server_))));
        const {result} = renderHookWithClient(() => useMoveIssue("BRD-1"), client);
        await act(() => result.current.mutateAsync({issueId: "B1", data: {targetColumnId: "COL-A"}}));
        expect(order(client, "COL-B")).toEqual([]);
        expect(order(client, "COL-A")).toEqual(["A1", "A2", "A3"]);
    });

    it("실패하면 이전 보드로 되돌린다", async () => {
        const client = seededClient();
        server.use(http.put(MOVE, () => HttpResponse.json({success: false, code: "INTERNAL_ERROR", message: "x"}, {status: 500})));
        const {result} = renderHookWithClient(() => useMoveIssue("BRD-1"), client);
        await act(async () => {
            await result.current.mutateAsync({issueId: "A1", data: {targetColumnId: "COL-B"}}).catch(() => undefined);
        });
        expect(client.getQueryData(["board", "BRD-1"])).toEqual(boardDetail());
    });
});
