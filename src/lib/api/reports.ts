import apiClient from "./client";
import type {BurndownResponse, CfdResponse, DashboardResponse, VelocityEntry,} from "@/types/reports";

export async function getBurndown(sprintId: string): Promise<BurndownResponse> {
    const res = await apiClient.get(`/v1/sprints/${sprintId}/burndown`);
    return res.data.data;
}

export async function getVelocity(
    projectId: string,
    lastN = 6,
): Promise<VelocityEntry[]> {
    const res = await apiClient.get(`/v1/projects/${projectId}/velocity`, {
        params: {lastN},
    });
    return res.data.data;
}

export async function getCfd(
    projectId: string,
    startDate: string,
    endDate: string,
): Promise<CfdResponse> {
    const res = await apiClient.get(`/v1/projects/${projectId}/cfd`, {
        params: {startDate, endDate},
    });
    return res.data.data;
}

export async function getDashboard(): Promise<DashboardResponse> {
    const res = await apiClient.get("/v1/users/me/dashboard");
    return res.data.data;
}
