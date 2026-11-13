import apiClient from "./client";
import type {
    AyaanPermission,
    AyaanRequest,
    AyaanSkill,
    AyaanTask,
    AyaanTaskDetail,
    AyaanTool,
    AyaanWorkspace,
    ConfigValues,
    CreateTaskRequest,
    QuotaResponse,
    SetupStep,
} from "@/types/ayaan";

const BASE = "/v1/ayaan";

export async function getQuotas(): Promise<QuotaResponse> {
    return (await apiClient.get(`${BASE}/quotas`)).data.data;
}
export async function refreshQuotas(): Promise<QuotaResponse> {
    return (await apiClient.post(`${BASE}/quotas/refresh`)).data.data;
}
export async function getTasks(params: { status?: string; tool?: string } = {}): Promise<AyaanTask[]> {
    return (await apiClient.get(`${BASE}/tasks`, {params})).data.data;
}
export async function getTask(id: string): Promise<AyaanTaskDetail> {
    return (await apiClient.get(`${BASE}/tasks/${id}`)).data.data;
}
export async function createTask(body: CreateTaskRequest): Promise<AyaanTask> {
    return (await apiClient.post(`${BASE}/tasks`, body)).data.data;
}
export async function resumeTask(id: string): Promise<AyaanTask> {
    return (await apiClient.post(`${BASE}/tasks/${id}/resume`)).data.data;
}
export async function cancelTask(id: string): Promise<AyaanTask> {
    return (await apiClient.post(`${BASE}/tasks/${id}/cancel`)).data.data;
}
export async function getConfig(): Promise<ConfigValues> {
    return (await apiClient.get(`${BASE}/config`)).data.data;
}
export async function putConfig(values: ConfigValues): Promise<ConfigValues> {
    return (await apiClient.put(`${BASE}/config`, values)).data.data;
}
export async function getTools(): Promise<AyaanTool[]> {
    return (await apiClient.get(`${BASE}/tools`)).data.data;
}
export async function putTool(cd: string, body: AyaanTool): Promise<AyaanTool> {
    return (await apiClient.put(`${BASE}/tools/${cd}`, body)).data.data;
}
export async function getWorkspaces(): Promise<AyaanWorkspace[]> {
    return (await apiClient.get(`${BASE}/workspaces`)).data.data;
}
export async function putWorkspace(key: string, body: AyaanWorkspace): Promise<AyaanWorkspace> {
    return (await apiClient.put(`${BASE}/workspaces/${key}`, body)).data.data;
}
export async function deleteWorkspace(key: string): Promise<void> {
    await apiClient.delete(`${BASE}/workspaces/${key}`);
}
export async function getSetupCheck(): Promise<SetupStep[]> {
    return (await apiClient.get(`${BASE}/setup/check`)).data.data;
}
export async function sendTestNotify(): Promise<boolean> {
    return (await apiClient.post(`${BASE}/setup/test-notify`)).data.data;
}
export interface PluginResult {
    plugin: string;
    ok: boolean;
    detail: string;
}
export async function syncPlugins(): Promise<PluginResult[]> {
    return (await apiClient.post(`${BASE}/plugins/sync`)).data.data;
}
export async function getPlugins(): Promise<string> {
    return (await apiClient.get(`${BASE}/plugins`)).data.data.output;
}
export async function getSkills(): Promise<AyaanSkill[]> {
    return (await apiClient.get(`${BASE}/skills`)).data.data;
}
/** warnings: 예) "CLAUDE_PLUGINS에 없음" (저장은 됨) */
export async function putSkill(cd: string, body: AyaanSkill): Promise<{ skill: AyaanSkill; warnings: string[] }> {
    return (await apiClient.put(`${BASE}/skills/${cd}`, body)).data.data;
}
export async function deleteSkill(cd: string): Promise<void> {
    await apiClient.delete(`${BASE}/skills/${cd}`);
}
export async function getPermissions(): Promise<AyaanPermission[]> {
    return (await apiClient.get(`${BASE}/permissions`)).data.data;
}
/** 전체 교체 */
export async function putPermissions(rows: AyaanPermission[]): Promise<AyaanPermission[]> {
    return (await apiClient.put(`${BASE}/permissions`, rows)).data.data;
}
export async function getRequests(params: { status?: string; taskId?: string } = {}): Promise<AyaanRequest[]> {
    return (await apiClient.get(`${BASE}/requests`, {params})).data.data;
}
/** choice(선택지 번호) 또는 answer(자유 답변, QUESTION 만). 이미 처리됐으면 409 */
export async function answerRequest(id: string, body: { choice?: number; answer?: string }): Promise<AyaanRequest> {
    return (await apiClient.post(`${BASE}/requests/${id}/answer`, body)).data.data;
}
export async function createDevTask(planTaskId: string): Promise<AyaanTask> {
    return (await apiClient.post(`${BASE}/tasks/${planTaskId}/dev-task`)).data.data;
}
