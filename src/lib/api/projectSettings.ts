import apiClient from "./client";
import type {AddMemberRequest, ProjectMemberResponse, UpdateMemberRoleRequest,} from "@/types/member";
import type {
    CreateWorkflowStatusRequest,
    UpdateWorkflowTransitionsRequest,
    WorkflowStatusResponse,
    WorkflowTransitionResponse,
} from "@/types/workflow";

export async function getProjectMembers(
    projectId: string,
): Promise<ProjectMemberResponse[]> {
    const res = await apiClient.get(`/v1/projects/${projectId}/members`);
    return res.data.data;
}

export async function addProjectMember(
    projectId: string,
    data: AddMemberRequest,
): Promise<ProjectMemberResponse> {
    const res = await apiClient.post(`/v1/projects/${projectId}/members`, data);
    return res.data.data;
}

export async function updateProjectMemberRole(
    projectId: string,
    userId: string,
    data: UpdateMemberRoleRequest,
): Promise<ProjectMemberResponse> {
    const res = await apiClient.put(
        `/v1/projects/${projectId}/members/${userId}/role`,
        data,
    );
    return res.data.data;
}

export async function removeProjectMember(
    projectId: string,
    userId: string,
): Promise<void> {
    await apiClient.delete(`/v1/projects/${projectId}/members/${userId}`);
}

/** spaceId 없음 = 기본 작업 공간 (V630: 워크플로는 공간 소유) */
export async function getWorkflowStatuses(
    projectId: string,
    spaceId?: string | null,
): Promise<WorkflowStatusResponse[]> {
    const res = await apiClient.get(
        `/v1/projects/${projectId}/workflow/statuses`, {params: spaceId ? {spaceId} : {}},
    );
    return res.data.data;
}

export async function createWorkflowStatus(
    projectId: string,
    data: CreateWorkflowStatusRequest,
    spaceId?: string | null,
): Promise<WorkflowStatusResponse> {
    const res = await apiClient.post(
        `/v1/projects/${projectId}/workflow/statuses`,
        data, {params: spaceId ? {spaceId} : {}},
    );
    return res.data.data;
}

export async function deleteWorkflowStatus(
    projectId: string,
    statusId: string,
): Promise<void> {
    await apiClient.delete(
        `/v1/projects/${projectId}/workflow/statuses/${statusId}`,
    );
}

export async function getWorkflowTransitions(
    projectId: string,
    spaceId?: string | null,
): Promise<WorkflowTransitionResponse[]> {
    const res = await apiClient.get(
        `/v1/projects/${projectId}/workflow/transitions`, {params: spaceId ? {spaceId} : {}},
    );
    return res.data.data;
}

export async function updateWorkflowTransitions(
    projectId: string,
    data: UpdateWorkflowTransitionsRequest,
    spaceId?: string | null,
): Promise<WorkflowTransitionResponse[]> {
    const res = await apiClient.put(
        `/v1/projects/${projectId}/workflow/transitions`,
        data, {params: spaceId ? {spaceId} : {}},
    );
    return res.data.data;
}
