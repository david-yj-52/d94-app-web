import {renderHookWithClient} from "@/test/utils";
import {act, waitFor} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {
    useAddIssueToSprint,
    useCompleteSprint,
    useCreateSprint,
    useDeleteSprint,
    useRemoveIssueFromSprint,
    useSprint,
    useSprints,
    useStartSprint,
    useUpdateSprint,
} from "./useSprints";

type AnyMutation = () => {mutateAsync: (v: unknown) => Promise<unknown>};

describe("useSprints", () => {
    it("queryKey: [\"sprints\", projectId], [\"sprint\", sprintId]", async () => {
        const {result, client} = renderHookWithClient(() => [useSprints("PRJ-1"), useSprint("SPR-1")]);
        await waitFor(() => expect(result.current.every((q) => q.isSuccess)).toBe(true));
        expect(client.getQueryData(["sprints", "PRJ-1"])).toHaveLength(2);
        expect(client.getQueryData(["sprint", "SPR-1"])).toMatchObject({id: "SPR-1"});
    });

    const sprints = ["sprints", "PRJ-1"];
    const issues = ["issues", "PRJ-1"];
    it.each([
        ["useCreateSprint", () => useCreateSprint("PRJ-1"), {sprintNm: "S"}, [sprints]],
        ["useUpdateSprint", () => useUpdateSprint("PRJ-1"), {sprintId: "SPR-1", data: {goal: "g"}}, [sprints, ["sprint", "SPR-1"]]],
        ["useDeleteSprint", () => useDeleteSprint("PRJ-1"), "SPR-1", [sprints]],
        ["useStartSprint", () => useStartSprint("PRJ-1"), "SPR-1", [sprints]],
        ["useCompleteSprint", () => useCompleteSprint("PRJ-1"), {sprintId: "SPR-1", data: {incompleteIssueAction: "BACKLOG"}}, [sprints, issues]],
        ["useAddIssueToSprint", () => useAddIssueToSprint("PRJ-1"), {sprintId: "SPR-1", issueId: "ISS-1"}, [sprints, issues]],
        ["useRemoveIssueFromSprint", () => useRemoveIssueFromSprint("PRJ-1"), {sprintId: "SPR-1", issueId: "ISS-1"}, [sprints, issues]],
    ] as const)("%s invalidate", async (_n, hook, vars, keys) => {
        const {result, client} = renderHookWithClient(hook as AnyMutation);
        const spy = vi.spyOn(client, "invalidateQueries");
        await act(() => result.current.mutateAsync(vars));
        expect(spy.mock.calls.map((c) => c[0]?.queryKey)).toEqual(keys);
    });
});
