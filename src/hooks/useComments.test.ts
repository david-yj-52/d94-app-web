import {renderHookWithClient} from "@/test/utils";
import {act, waitFor} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {useComments, useCreateComment, useDeleteComment, useToggleReaction, useUpdateComment,} from "./useComments";

type AnyMutation = () => {mutateAsync: (v: unknown) => Promise<unknown>};

describe("useComments", () => {
    it("queryKey: [\"comments\", issueId]", async () => {
        const {result, client} = renderHookWithClient(() => useComments("ISS-1"));
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(client.getQueryData(["comments", "ISS-1"])).toHaveLength(1);
    });

    it.each([
        ["useCreateComment", () => useCreateComment("ISS-1"), {content: "c"}],
        ["useUpdateComment", () => useUpdateComment("ISS-1"), {commentId: "CMT-1", data: {content: "c"}}],
        ["useDeleteComment", () => useDeleteComment("ISS-1"), "CMT-1"],
        ["useToggleReaction", () => useToggleReaction("ISS-1"), {commentId: "CMT-1", reactionType: "👍"}],
    ] as const)("%s → [\"comments\", issueId] 무효화", async (_n, hook, vars) => {
        const {result, client} = renderHookWithClient(hook as AnyMutation);
        const spy = vi.spyOn(client, "invalidateQueries");
        await act(() => result.current.mutateAsync(vars));
        expect(spy.mock.calls.map((c) => c[0]?.queryKey)).toEqual([["comments", "ISS-1"]]);
    });
});
