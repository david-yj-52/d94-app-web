import type {AyaanPlan, PlanStage} from "@/types/ayaan";

const CURRENT: Partial<Record<PlanStage, number>> = {PREPARING: 0, RUNNING: 1, MERGING: 2, DEPLOYING: 3, CLEANING: 4};

/** "준비 › 실행 d/t › 머지 › 배포 › 정리" 에서 현재 단계를 [ ] 로 감싼다. HALTED/CANCELLED 는 접두어만 */
export function planStageLabel(p: AyaanPlan): string {
    const label = ["준비", `실행 ${p.done}/${p.total}`, "머지", "배포", "정리"]
        .map((s, i) => (CURRENT[p.stage] === i ? `[${s}]` : s)).join(" › ");
    return p.stage === "HALTED" ? `중단: ${label}` : p.stage === "CANCELLED" ? `취소: ${label}` : label;
}
