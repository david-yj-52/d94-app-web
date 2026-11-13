import type {CreateTaskRequest, ToolCd} from "@/types/ayaan";

export interface TaskForm {
    projectKey: string;
    issueKey: string;
    prompt: string;
    tool: string;
    policy: string;
    /** "" = 기본(기획부터) */
    phase?: "" | "PLAN" | "DEV";
    /** "" = Tool 기본값, "NONE" = 사용 안 함 */
    skillCd?: string;
}

/** 폼 → 작업 등록 본문. 이슈를 고르면 이슈로, 아니면 고른 프로젝트 작업공간에서 프롬프트로 실행. */
export function toCreateBody(f: TaskForm): CreateTaskRequest | string {
    if (!f.projectKey) return "프로젝트를 선택하세요.";
    if (!f.issueKey && !f.prompt.trim()) return "이슈를 고르거나 프롬프트를 입력하세요.";
    return {
        ...(f.issueKey ? {issueKey: f.issueKey} : {prompt: f.prompt.trim(), projectKey: f.projectKey}),
        ...(f.tool ? {tool: f.tool as ToolCd} : {}),
        ...(f.policy ? {exhaustPolicy: f.policy} : {}),
        ...(f.phase ? {phase: f.phase} : {}),
        ...(f.skillCd ? {skillCd: f.skillCd} : {}),
        source: "WEB",
    };
}
