import {describe, expect, it} from "vitest";
import {planStageLabel} from "./planStage";
import type {AyaanPlan, PlanStage} from "@/types/ayaan";

const p = (stage: PlanStage, done = 3, total = 11): AyaanPlan => ({
    id: "1", projectKey: "A", milestoneId: "m", milestoneKey: "M1", stage, currentIssueKey: null, lastError: null,
    startedAt: "2026-01-01T00:00:00", endedAt: null, done, total,
});

describe("planStageLabel", () => {
    it.each([
        ["PREPARING", "[준비] › 실행 3/11 › 머지 › 배포 › 정리"],
        ["RUNNING", "준비 › [실행 3/11] › 머지 › 배포 › 정리"],
        ["MERGING", "준비 › 실행 3/11 › [머지] › 배포 › 정리"],
        ["DEPLOYING", "준비 › 실행 3/11 › 머지 › [배포] › 정리"],
        ["CLEANING", "준비 › 실행 3/11 › 머지 › 배포 › [정리]"],
        ["DONE", "준비 › 실행 3/11 › 머지 › 배포 › 정리"],
        ["CANCELLED", "취소: 준비 › 실행 3/11 › 머지 › 배포 › 정리"],
        ["HALTED", "중단: 준비 › 실행 3/11 › 머지 › 배포 › 정리"],
    ] as const)("%s", (stage, want) => expect(planStageLabel(p(stage))).toBe(want));
});
