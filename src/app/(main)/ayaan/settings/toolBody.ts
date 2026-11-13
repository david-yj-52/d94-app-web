import type {AyaanTool, AyaanWorkspace, ToolCd} from "@/types/ayaan";

/** 화면 입력 상태: 숫자는 입력 그대로의 문자열 */
export interface ToolForm {
    toolCd: ToolCd;
    enabled: boolean;
    authMode: string;
    planName: string;
    apiKeyRef: string;
    model: string;
    maxConcurrency: string;
    fallbackResetRule: string;
    budgetTokens: string;
    budgetPeriod: string;
    planSkillCd: string;
    devSkillCd: string;
}

export const toToolForm = (t: AyaanTool): ToolForm => ({
    toolCd: t.toolCd,
    enabled: t.enabled,
    authMode: t.authMode,
    planName: t.planName ?? "",
    apiKeyRef: t.apiKeyRef ?? "",
    model: t.model ?? "",
    maxConcurrency: String(t.maxConcurrency),
    fallbackResetRule: t.fallbackResetRule ?? "",
    budgetTokens: t.budgetTokens == null ? "" : String(t.budgetTokens),
    budgetPeriod: t.budgetPeriod ?? "",
    planSkillCd: t.planSkillCd ?? "",
    devSkillCd: t.devSkillCd ?? "",
});

const isInt = (v: string) => /^\d+$/.test(v.trim());
const orNull = (v: string) => (v.trim() === "" ? null : v.trim());

/** 폼 → PUT 본문. 정수 검사 실패 시 errors(필드명→메시지)를 돌려주고 body 는 null */
export function toToolBody(f: ToolForm): { body: AyaanTool | null; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    const maxConcurrency = Number(f.maxConcurrency);
    if (!isInt(f.maxConcurrency) || maxConcurrency < 1 || maxConcurrency > 4) errors.maxConcurrency = "1~4 사이 정수여야 합니다.";
    let budgetTokens: number | null = null;
    if (f.budgetTokens.trim() !== "") {
        budgetTokens = Number(f.budgetTokens);
        if (!isInt(f.budgetTokens) || budgetTokens < 1) errors.budgetTokens = "1 이상의 정수이거나 비워 두세요.";
    }
    if (Object.keys(errors).length) return {body: null, errors};
    return {
        errors,
        body: {
            toolCd: f.toolCd,
            enabled: f.enabled,
            authMode: f.authMode,
            planName: orNull(f.planName),
            apiKeyRef: orNull(f.apiKeyRef),
            model: orNull(f.model),
            maxConcurrency,
            fallbackResetRule: orNull(f.fallbackResetRule),
            budgetTokens,
            budgetPeriod: orNull(f.budgetPeriod),
            planSkillCd: orNull(f.planSkillCd),
            devSkillCd: orNull(f.devSkillCd),
        },
    };
}

export const toWorkspaceBody = (w: AyaanWorkspace): AyaanWorkspace => ({
    ...w,
    projectKey: w.projectKey.trim(),
    workspacePath: w.workspacePath.trim(),
    promptTemplate: w.promptTemplate?.trim() ? w.promptTemplate : null,
});
