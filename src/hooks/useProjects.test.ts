import {renderHookWithClient} from "@/test/utils";
import {act, waitFor} from "@testing-library/react";
import {describe, expect, it, vi} from "vitest";
import {useCreateProject, useProject, useProjects, useUpdateProject} from "./useProjects";

describe("useProjects", () => {
    it("queryKey: [\"projects\"], [\"projects\", projectId]", async () => {
        const {result, client} = renderHookWithClient(() => [useProjects(), useProject("PRJ-1")]);
        await waitFor(() => expect(result.current.every((q) => q.isSuccess)).toBe(true));
        expect(client.getQueryData(["projects"])).toHaveLength(1);
        expect(client.getQueryData(["projects", "PRJ-1"])).toMatchObject({key: "CIRA"});
    });

    it("useCreateProject → [\"projects\"], useUpdateProject → 단건 + 목록", async () => {
        const create = renderHookWithClient(() => useCreateProject());
        const spy = vi.spyOn(create.client, "invalidateQueries");
        await act(() => create.result.current.mutateAsync({key: "N", name: "n", projectType: "SCRUM"}));
        expect(spy.mock.calls.map((c) => c[0]?.queryKey)).toEqual([["projects"]]);

        const update = renderHookWithClient(() => useUpdateProject("PRJ-1"));
        const spy2 = vi.spyOn(update.client, "invalidateQueries");
        await act(() => update.result.current.mutateAsync({name: "n", projectType: "SCRUM"}));
        expect(spy2.mock.calls.map((c) => c[0]?.queryKey)).toEqual([["projects", "PRJ-1"], ["projects"]]);
    });
});
