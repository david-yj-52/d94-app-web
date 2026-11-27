"use client";

import {
    addProjectMember,
    createWorkflowStatus,
    deleteWorkflowStatus,
    getProjectMembers,
    getWorkflowStatuses,
    getWorkflowTransitions,
    removeProjectMember,
    updateProjectMemberRole,
    updateWorkflowTransitions,
} from "@/lib/api/projectSettings";
import type {AddMemberRequest, ProjectRole} from "@/types/member";
import type {CreateWorkflowStatusRequest, UpdateWorkflowTransitionsRequest,} from "@/types/workflow";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useProjectMembers(projectId: string) {
    return useQuery({
        queryKey: ["projects", projectId, "members"],
        queryFn: () => getProjectMembers(projectId),
        enabled: !!projectId,
    });
}

export function useAddProjectMember(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: AddMemberRequest) => addProjectMember(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["projects", projectId, "members"],
            });
        },
    });
}

export function useUpdateProjectMemberRole(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({userId, role}: { userId: string; role: ProjectRole }) =>
            updateProjectMemberRole(projectId, userId, {role}),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["projects", projectId, "members"],
            });
        },
    });
}

export function useRemoveProjectMember(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (userId: string) => removeProjectMember(projectId, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["projects", projectId, "members"],
            });
        },
    });
}

/** spaceId 없음 = 기본 작업 공간 */
export function useWorkflowStatuses(projectId: string, spaceId?: string | null) {
    return useQuery({
        queryKey: ["projects", projectId, "workflow", "statuses", spaceId ?? null],
        queryFn: () => getWorkflowStatuses(projectId, spaceId),
        enabled: !!projectId,
    });
}

export function useCreateWorkflowStatus(projectId: string, spaceId?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateWorkflowStatusRequest) =>
            createWorkflowStatus(projectId, data, spaceId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["projects", projectId, "workflow", "statuses"],
            });
        },
    });
}

export function useDeleteWorkflowStatus(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (statusId: string) => deleteWorkflowStatus(projectId, statusId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["projects", projectId, "workflow", "statuses"],
            });
        },
    });
}

export function useWorkflowTransitions(projectId: string, spaceId?: string | null) {
    return useQuery({
        queryKey: ["projects", projectId, "workflow", "transitions", spaceId ?? null],
        queryFn: () => getWorkflowTransitions(projectId, spaceId),
        enabled: !!projectId,
    });
}

export function useUpdateWorkflowTransitions(projectId: string, spaceId?: string | null) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateWorkflowTransitionsRequest) =>
            updateWorkflowTransitions(projectId, data, spaceId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["projects", projectId, "workflow", "transitions"],
            });
        },
    });
}
