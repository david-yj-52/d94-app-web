import apiClient from "./client";
import type {CompleteSprintRequest, CreateSprintRequest, SprintResponse, UpdateSprintRequest,} from "@/types/sprint";
import type {IssueResponse, PageResponse} from "@/types/issue";

export async function getSprints(projectId: string): Promise<SprintResponse[]> {
    const res = await apiClient.get(`/v1/projects/${projectId}/sprints`);
    return res.data.data;
}

export async function getSprint(sprintId: string): Promise<SprintResponse> {
    const res = await apiClient.get(`/v1/sprints/${sprintId}`);
    return res.data.data;
}

export async function createSprint(
    projectId: string,
    data: CreateSprintRequest,
): Promise<SprintResponse> {
    const res = await apiClient.post(`/v1/projects/${projectId}/sprints`, data);
    return res.data.data;
}

export async function updateSprint(
    sprintId: string,
    data: UpdateSprintRequest,
): Promise<SprintResponse> {
    const res = await apiClient.put(`/v1/sprints/${sprintId}`, data);
    return res.data.data;
}

export async function deleteSprint(sprintId: string): Promise<void> {
    await apiClient.delete(`/v1/sprints/${sprintId}`);
}

export async function startSprint(sprintId: string): Promise<SprintResponse> {
    const res = await apiClient.post(`/v1/sprints/${sprintId}/start`, {});
    return res.data.data;
}

export async function completeSprint(
    sprintId: string,
    data: CompleteSprintRequest,
): Promise<SprintResponse> {
    const res = await apiClient.post(`/v1/sprints/${sprintId}/complete`, data);
    return res.data.data;
}

export async function addIssueToSprint(
    sprintId: string,
    issueId: string,
): Promise<void> {
    await apiClient.post(`/v1/sprints/${sprintId}/issues/${issueId}`, {});
}

export async function removeIssueFromSprint(
    sprintId: string,
    issueId: string,
): Promise<void> {
    await apiClient.delete(`/v1/sprints/${sprintId}/issues/${issueId}`);
}

// 스프린트에 없는 이슈 (d94-query 는 우선순위 내림차순)
export async function getBacklog(projectId: string, page = 0, size = 100): Promise<PageResponse<IssueResponse>> {
    const res = await apiClient.get(`/v1/projects/${projectId}/backlog`, {params: {page, size}});
    return res.data.data;
}
