export type ToolCd = "CLAUDE" | "CODEX" | "ANTIGRAVITY" | "CURSOR";
export const TOOLS: ToolCd[] = ["CLAUDE", "CODEX", "ANTIGRAVITY", "CURSOR"];

export interface Quota {
    toolCd: ToolCd;
    windowCd: string;
    usedPct: number | null;
    usedTokens: number | null;
    limitTokens: number | null;
    resetsAt: string | null;
    status: string;
    source: string;
    observedAt: string | null;
}
export interface QuotaResponse {
    quotas: Quota[];
    warnings: string[];
}

export type TaskStatus = "QUEUED" | "RUNNING" | "PAUSED" | "DONE" | "FAILED" | "CANCELLED";
export const TASK_STATUSES: TaskStatus[] = ["QUEUED", "RUNNING", "PAUSED", "DONE", "FAILED", "CANCELLED"];

export interface AyaanTask {
    id: string;
    issueKey: string | null;
    source: string;
    projectKey: string | null;
    workspacePath: string | null;
    prompt: string | null;
    toolCd: ToolCd;
    exhaustPolicy: string | null;
    fallbackTools: string | null;
    status: TaskStatus;
    cliSessionId: string | null;
    resumeAt: string | null;
    pauseReason: string | null;
    resumeCount: number;
    resultSummary: string | null;
    failReason: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    createdAt: string;
}
export interface TaskRun {
    id: string;
    runSeq: number;
    toolCd: ToolCd;
    outcome: string | null;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheWriteTokens: number;
    costUsd: number | null;
    exitCode: number | null;
    startedAt: string | null;
    endedAt: string | null;
}
export interface TokenTotals {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    costUsd: number;
}
export interface AyaanTaskDetail extends AyaanTask {
    runs: TaskRun[];
    tokenTotals: TokenTotals;
    logTail: string | null;
}
export interface CreateTaskRequest {
    issueKey?: string;
    prompt?: string;
    projectKey?: string;
    tool?: ToolCd;
    exhaustPolicy?: string;
    fallbackTools?: string;
    source: "WEB";
}

export type ConfigValues = Record<string, string>;

export interface AyaanTool {
    toolCd: ToolCd;
    enabled: boolean;
    authMode: string;
    planName: string | null;
    apiKeyRef: string | null;
    model: string | null;
    maxConcurrency: number;
    fallbackResetRule: string | null;
    budgetTokens: number | null;
    budgetPeriod: string | null;
}
export interface AyaanRepo {
    repoNm: string;
    gitUrl: string;
    baseBranch: string;
    deployBranch: string | null;
    sortOrd: number;
}
export interface AyaanWorkspace {
    projectKey: string;
    workspacePath: string | null;
    defaultTool: ToolCd;
    promptTemplate: string | null;
    repos: AyaanRepo[];
}
export type PlanStage = "PREPARING" | "RUNNING" | "MERGING" | "DEPLOYING" | "CLEANING" | "DONE" | "HALTED" | "CANCELLED";
export interface AyaanPlan {
    id: string;
    projectKey: string;
    milestoneId: string;
    milestoneKey: string;
    stage: PlanStage;
    currentIssueKey: string | null;
    lastError: string | null;
    startedAt: string;
    endedAt: string | null;
    done: number;
    total: number;
}
export interface AyaanMilestone {
    id: string;
    name: string;
}
export interface SetupStep {
    step: number;
    ok: boolean;
    items: { name: string; ok: boolean; detail: string }[];
}
