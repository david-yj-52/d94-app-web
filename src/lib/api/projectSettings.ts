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
        `/v1/projects/${projectId}/members/${userId}`,
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

export async function getWorkflowStatuses(
    projectId: string,
): Promise<WorkflowStatusResponse[]> {
    const res = await apiClient.get(
        `/v1/projects/${projectId}/workflow/statuses`,
    );
    return res.data.data;
}

export async function createWorkflowStatus(
    projectId: string,
    data: CreateWorkflowStatusRequest,
): Promise<WorkflowStatusResponse> {
    const res = await apiClient.post(
        `/v1/projects/${projectId}/workflow/statuses`,
        data,
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
): Promise<WorkflowTransitionResponse[]> {
    const res = await apiClient.get(
        `/v1/projects/${projectId}/workflow/transitions`,
    );
    return res.data.data;
}

export async function updateWorkflowTransitions(
    projectId: string,
    data: UpdateWorkflowTransitionsRequest,
): Promise<WorkflowTransitionResponse[]> {
    const res = await apiClient.put(
        `/v1/projects/${projectId}/workflow/transitions`,
        data,
    );
    return res.data.data;
}
