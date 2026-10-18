import apiClient from "./client";
import type {
    CreateIssueRequest,
    IssueFilterParams,
    IssueResponse,
    IssueStatusResponse,
    PageResponse,
    UpdateIssueRequest,
} from "@/types/issue";

export async function getIssues(
    projectId: string,
    filters?: IssueFilterParams,
): Promise<PageResponse<IssueResponse>> {
    const params: Record<string, string | number | string[]> = {};
    if (filters?.keyword) params.keyword = filters.keyword;
    if (filters?.priority) params.priority = filters.priority;
    if (filters?.assigneeId) params.assigneeId = filters.assigneeId;
    if (filters?.issueType) params.issueType = filters.issueType;
    if (filters?.sprintId) params.sprintId = filters.sprintId;
    if (filters?.status?.length) params.status = filters.status;
    if (filters?.page !== undefined) params.page = filters.page;
    if (filters?.size !== undefined) params.size = filters.size ?? 20;
    const res = await apiClient.get(`/v1/projects/${projectId}/issues`, {
        params,
    });
    return res.data.data;
}

export async function getIssue(issueId: string): Promise<IssueResponse> {
    const res = await apiClient.get(`/v1/issues/${issueId}`);
    return res.data.data;
}

export async function createIssue(
    projectId: string,
    data: CreateIssueRequest,
): Promise<IssueResponse> {
    const res = await apiClient.post(`/v1/projects/${projectId}/issues`, data);
    return res.data.data;
}

export async function updateIssue(
    issueId: string,
    data: UpdateIssueRequest,
): Promise<IssueResponse> {
    const res = await apiClient.put(`/v1/issues/${issueId}`, data);
    return res.data.data;
}

export async function deleteIssue(issueId: string): Promise<void> {
    await apiClient.delete(`/v1/issues/${issueId}`);
}

export async function updateIssueStatus(
    issueId: string,
    statusId: string,
): Promise<IssueResponse> {
    const res = await apiClient.put(`/v1/issues/${issueId}/status`, {statusId});
    return res.data.data;
}

export async function getAvailableTransitions(
    issueId: string,
): Promise<IssueStatusResponse[]> {
    const res = await apiClient.get(`/v1/issues/${issueId}/available-transitions`);
    return res.data.data;
}
