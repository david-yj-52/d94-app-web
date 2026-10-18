import apiClient from "./client";

export type TriggerType =
    | "ISSUE_CREATED"
    | "ISSUE_STATUS_CHANGED"
    | "ISSUE_ASSIGNED"
    | "ISSUE_PRIORITY_CHANGED"
    | "COMMENT_ADDED"
    | "SPRINT_STARTED"
    | "SPRINT_COMPLETED";

export type ActionType =
    | "SEND_NOTIFICATION"
    | "CHANGE_STATUS"
    | "ASSIGN_USER"
    | "ADD_LABEL"
    | "SEND_WEBHOOK";

export interface AutomationRule {
    id: string;
    ruleName: string;
    triggerType: TriggerType;
    conditions: Record<string, unknown>;
    actionType: ActionType;
    actionParams: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
}

export interface CreateAutomationRuleRequest {
    ruleName: string;
    triggerType: TriggerType;
    conditions: Record<string, unknown>;
    actionType: ActionType;
    actionParams: Record<string, unknown>;
    isActive: boolean;
}

export interface RuleExecution {
    id: string;
    ruleId: string;
    status: "SUCCESS" | "FAILURE" | "SKIPPED";
    triggeredAt: string;
    detail?: string;
}

export async function getAutomationRules(projectId: string): Promise<AutomationRule[]> {
    const res = await apiClient.get(`/v1/projects/${projectId}/automation-rules`);
    return res.data.data ?? res.data;
}

export async function createAutomationRule(
    projectId: string,
    data: CreateAutomationRuleRequest,
): Promise<AutomationRule> {
    const res = await apiClient.post(`/v1/projects/${projectId}/automation-rules`, data);
    return res.data.data ?? res.data;
}

export async function updateAutomationRule(
    ruleId: string,
    data: Partial<CreateAutomationRuleRequest>,
): Promise<AutomationRule> {
    const res = await apiClient.put(`/v1/automation-rules/${ruleId}`, data);
    return res.data.data ?? res.data;
}

export async function deleteAutomationRule(ruleId: string): Promise<void> {
    await apiClient.delete(`/v1/automation-rules/${ruleId}`);
}

export async function getRuleExecutions(ruleId: string): Promise<RuleExecution[]> {
    const res = await apiClient.get(`/v1/automation-rules/${ruleId}/executions`);
    return res.data.data ?? res.data;
}
