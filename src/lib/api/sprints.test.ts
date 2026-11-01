import {lastRequest} from "@/test/utils";
import type {SprintStatus} from "@/types/sprint";
import {describe, expect, it} from "vitest";
import {
    addIssueToSprint,
    completeSprint,
    createSprint,
    deleteSprint,
    getSprint,
    getSprints,
    removeIssueFromSprint,
    startSprint,
    updateSprint,
} from "./sprints";

describe("lib/api/sprints", () => {
    it("요청 경로와 본문", async () => {
        await getSprints("PRJ-1");
        expect(lastRequest()?.path).toBe("/v1/projects/PRJ-1/sprints");
        await getSprint("SPR-1");
        expect(lastRequest()?.path).toBe("/v1/sprints/SPR-1");
        await createSprint("PRJ-1", {sprintNm: "Sprint 2", startDt: "2026-11-04"});
        expect(lastRequest()).toMatchObject({
            method: "POST", path: "/v1/projects/PRJ-1/sprints", body: {sprintNm: "Sprint 2", startDt: "2026-11-04"},
        });
        await updateSprint("SPR-1", {goal: "목표"});
        expect(lastRequest()).toMatchObject({method: "PUT", path: "/v1/sprints/SPR-1", body: {goal: "목표"}});
        await deleteSprint("SPR-1");
        expect(lastRequest()).toMatchObject({method: "DELETE", path: "/v1/sprints/SPR-1"});
        await startSprint("SPR-1");
        expect(lastRequest()).toMatchObject({method: "POST", path: "/v1/sprints/SPR-1/start"});
        await completeSprint("SPR-1", {incompleteIssueAction: "NEXT_SPRINT", nextSprintId: "SPR-2"});
        expect(lastRequest()).toMatchObject({
            method: "POST", path: "/v1/sprints/SPR-1/complete",
            body: {incompleteIssueAction: "NEXT_SPRINT", nextSprintId: "SPR-2"},
        });
        await addIssueToSprint("SPR-1", "ISS-1");
        expect(lastRequest()).toMatchObject({method: "POST", path: "/v1/sprints/SPR-1/issues/ISS-1"});
        await removeIssueFromSprint("SPR-1", "ISS-1");
        expect(lastRequest()).toMatchObject({method: "DELETE", path: "/v1/sprints/SPR-1/issues/ISS-1"});
    });

    // d94-query SprintResponse: 상태 필드 sprintStat, 값 "Planned" | "Active" | "Completed" (web SprintStatus 와 같음)
    it("getSprints: sprintStat 을 백엔드 값 그대로 돌려준다", async () => {
        const sprints = await getSprints("PRJ-1");
        expect(sprints.map((s) => s.sprintStat)).toEqual(["Active", "Planned"]);
        const webValues: SprintStatus[] = ["Planned", "Active", "Completed"];
        for (const s of sprints) expect(webValues).toContain(s.sprintStat);
    });
});
