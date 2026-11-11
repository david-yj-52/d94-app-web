import apiClient from "./client";
import type {
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
