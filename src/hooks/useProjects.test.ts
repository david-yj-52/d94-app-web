import {renderHookWithClient} from "@/test/utils";
import {act, waitFor} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {useCreateProject, useDeleteProject, useProject, useProjects, useUpdateProject} from "./useProjects";

describe("useProjects", () => {
    it("queryKey: [\"projects\"], [\"projects\", projectId]", async () => {
        const {result, client} = renderHookWithClient(() => [useProjects(), useProject("PRJ-1")]);
        await waitFor(() => expect(result.current.every((q) => q.isSuccess)).toBe(true));
        expect(client.getQueryData(["projects"])).toHaveLength(1);
        expect(client.getQueryData(["projects", "PRJ-1"])).toMatchObject({key: "CIRA"});
    });

    it("useCreateProject → [\"projects\"], useUpdateProject → 단건 + 목록, useDeleteProject → 단건 제거 + 목록", async () => {
        const create = renderHookWithClient(() => useCreateProject());
        const spy = vi.spyOn(create.client, "invalidateQueries");
        await act(() => create.result.current.mutateAsync({key: "N", name: "n", projectTypeId: "PT-SCRUM"}));
        expect(spy.mock.calls.map((c) => c[0]?.queryKey)).toEqual([["projects"]]);

        const update = renderHookWithClient(() => useUpdateProject("PRJ-1"));
        const spy2 = vi.spyOn(update.client, "invalidateQueries");
        await act(() => update.result.current.mutateAsync({name: "n", projectTypeId: "PT-SCRUM"}));
        expect(spy2.mock.calls.map((c) => c[0]?.queryKey)).toEqual([["projects", "PRJ-1"], ["projects"]]);

        const del = renderHookWithClient(() => useDeleteProject());
        const removeSpy = vi.spyOn(del.client, "removeQueries");
        const invSpy = vi.spyOn(del.client, "invalidateQueries");
        await act(() => del.result.current.mutateAsync("PRJ-1"));
        expect(removeSpy.mock.calls.map((c) => c[0]?.queryKey)).toEqual([["projects", "PRJ-1"]]);
        expect(invSpy.mock.calls.map((c) => c[0]?.queryKey)).toEqual([["projects"]]);
    });
});
