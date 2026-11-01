import {issue1, ok} from "@/test/msw/fixtures";
import {server} from "@/test/msw/server";
import {createTestQueryClient, renderHookWithClient} from "@/test/utils";
import type {IssueResponse} from "@/types/issue";
import {act, waitFor} from "@testing-library/react";
import {http, HttpResponse} from "msw";
import {describe, expect, it, vi} from "vitest";
import {
    useAvailableTransitions,
    useCreateIssue,
    useDeleteIssue,
    useIssue,
    useIssues,
    useUpdateIssue,
    useUpdateIssueStatus,
} from "./useIssues";

const keysOf = (spy: {mock: {calls: unknown[][]}}) => spy.mock.calls.map((c) => (c[0] as {queryKey: unknown}).queryKey);

describe("useIssues 조회 훅 queryKey", () => {
    it("[\"issues\", projectId, filters] / [\"issue\", id] / [\"issue-transitions\", id]", async () => {
        const filters = {keyword: "로그인"};
        const {result, client} = renderHookWithClient(() => ({
            list: useIssues("PRJ-1", filters),
            one: useIssue("ISS-1"),
            tr: useAvailableTransitions("ISS-1"),
        }));
        await waitFor(() => expect([result.current.list, result.current.one, result.current.tr].every((q) => q.isSuccess)).toBe(true));
        expect(client.getQueryData(["issues", "PRJ-1", filters])).toMatchObject({totalElements: 2});
        expect(client.getQueryData(["issue", "ISS-1"])).toEqual(issue1);
        expect(client.getQueryData(["issue-transitions", "ISS-1"])).toHaveLength(1);
    });

    it("projectId·issueId 가 비면 요청하지 않는다", () => {
        const {result} = renderHookWithClient(() => [useIssues(""), useIssue(""), useAvailableTransitions("")]);
        expect(result.current.map((q) => q.fetchStatus)).toEqual(["idle", "idle", "idle"]);
    });
});

describe("useIssues 변경 훅 invalidate", () => {
    it("useCreateIssue → [\"issues\", projectId]", async () => {
        const {result, client} = renderHookWithClient(() => useCreateIssue("PRJ-1"));
        const spy = vi.spyOn(client, "invalidateQueries");
        await act(() => result.current.mutateAsync({title: "새 이슈", statusId: "ST-TODO", issueTypeId: "TYPE-TASK"}));
        expect(keysOf(spy)).toEqual([["issues", "PRJ-1"]]);
    });

    it("useUpdateIssue → [\"issue\", 응답 id] + (projectId 있으면) [\"issues\", projectId]", async () => {
        const {result, client} = renderHookWithClient(() => useUpdateIssue("PRJ-1"));
        const spy = vi.spyOn(client, "invalidateQueries");
        await act(() => result.current.mutateAsync({issueId: "ISS-9", data: {title: "x"}}));
        expect(keysOf(spy)).toEqual([["issue", "ISS-9"], ["issues", "PRJ-1"]]);

        const noProject = renderHookWithClient(() => useUpdateIssue());
        const spy2 = vi.spyOn(noProject.client, "invalidateQueries");
        await act(() => noProject.result.current.mutateAsync({issueId: "ISS-9", data: {title: "x"}}));
        expect(keysOf(spy2)).toEqual([["issue", "ISS-9"]]);
    });

    it("useDeleteIssue → [\"issues\", projectId]", async () => {
        const {result, client} = renderHookWithClient(() => useDeleteIssue("PRJ-1"));
        const spy = vi.spyOn(client, "invalidateQueries");
        await act(() => result.current.mutateAsync("ISS-1"));
        expect(keysOf(spy)).toEqual([["issues", "PRJ-1"]]);
    });

    it("useUpdateIssueStatus → issue·transitions·issues 무효화", async () => {
        const {result, client} = renderHookWithClient(() => useUpdateIssueStatus("PRJ-1"));
        const spy = vi.spyOn(client, "invalidateQueries");
        await act(() => result.current.mutateAsync({issueId: "ISS-1", statusId: "ST-PROG"}));
        expect(keysOf(spy)).toEqual([["issue", "ISS-1"], ["issue-transitions", "ISS-1"], ["issues", "PRJ-1"]]);
    });

    it("useUpdateIssueStatus: 낙관적으로 statusId 를 바꾸고, 실패하면 되돌린다", async () => {
        const client = createTestQueryClient();
        client.setQueryData(["issue", "ISS-1"], issue1);
        let release!: () => void;
        const gate = new Promise<void>((r) => (release = r));
        server.use(http.put("*/api/proxy/v1/issues/:id/status", async () => {
            await gate;
            return HttpResponse.json({success: false, code: "BAD_REQUEST", message: "전이 불가"}, {status: 400});
        }));
        const {result} = renderHookWithClient(() => useUpdateIssueStatus("PRJ-1"), client);

        act(() => result.current.mutate({issueId: "ISS-1", statusId: "ST-DONE"}));
        await waitFor(() => expect(client.getQueryData<IssueResponse>(["issue", "ISS-1"])?.statusId).toBe("ST-DONE"));
        release();
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(client.getQueryData(["issue", "ISS-1"])).toEqual(issue1);
    });

    it("useUpdateIssueStatus: 캐시에 이슈가 없으면 낙관적 갱신을 건너뛴다", async () => {
        server.use(http.put("*/api/proxy/v1/issues/:id/status", () => HttpResponse.json(ok({...issue1, statusId: "ST-DONE"}))));
        const {result, client} = renderHookWithClient(() => useUpdateIssueStatus());
        await act(() => result.current.mutateAsync({issueId: "ISS-1", statusId: "ST-DONE"}));
        expect(client.getQueryData(["issue", "ISS-1"])).toBeUndefined();
    });
});
