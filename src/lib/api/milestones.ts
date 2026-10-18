import apiClient from "./client";
import type {
    CreateMilestoneRequest,
    MilestoneProgressResponse,
    MilestoneResponse,
    UpdateMilestoneRequest,
} from "@/types/milestone";

export async function getMilestones(projectId: string): Promise<MilestoneResponse[]> {
    const res = await apiClient.get(`/v1/projects/${projectId}/milestones`);
    return res.data.data;
}

export async function getMilestone(milestoneId: string): Promise<MilestoneResponse> {
    const res = await apiClient.get(`/v1/milestones/${milestoneId}`);
    return res.data.data;
}

export async function createMilestone(
    projectId: string,
    data: CreateMilestoneRequest,
): Promise<MilestoneResponse> {
    const res = await apiClient.post(`/v1/projects/${projectId}/milestones`, data);
    return res.data.data;
}

export async function updateMilestone(
    milestoneId: string,
    data: UpdateMilestoneRequest,
): Promise<MilestoneResponse> {
    const res = await apiClient.put(`/v1/milestones/${milestoneId}`, data);
    return res.data.data;
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
    await apiClient.delete(`/v1/milestones/${milestoneId}`);
}

export async function getMilestoneProgress(
    milestoneId: string,
): Promise<MilestoneProgressResponse> {
    const res = await apiClient.get(`/v1/milestones/${milestoneId}/progress`);
    return res.data.data;
}
