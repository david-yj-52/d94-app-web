"use client";

import {
    addIssueToSprint,
    completeSprint,
    createSprint,
    deleteSprint,
    getSprint,
    getSprints,
    removeIssueFromSprint,
    startSprint,
    updateSprint,
} from "@/lib/api/sprints";
import type {CompleteSprintRequest, CreateSprintRequest, UpdateSprintRequest,} from "@/types/sprint";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useSprints(projectId: string) {
    return useQuery({
        queryKey: ["sprints", projectId],
        queryFn: () => getSprints(projectId),
        enabled: !!projectId,
    });
}

export function useSprint(sprintId: string) {
    return useQuery({
        queryKey: ["sprint", sprintId],
        queryFn: () => getSprint(sprintId),
        enabled: !!sprintId,
    });
}

export function useCreateSprint(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateSprintRequest) => createSprint(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["sprints", projectId]});
        },
    });
}

export function useUpdateSprint(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({sprintId, data}: { sprintId: string; data: UpdateSprintRequest }) =>
            updateSprint(sprintId, data),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({queryKey: ["sprints", projectId]});
            queryClient.invalidateQueries({queryKey: ["sprint", updated.id]});
        },
    });
}

export function useDeleteSprint(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (sprintId: string) => deleteSprint(sprintId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["sprints", projectId]});
        },
    });
}

export function useStartSprint(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (sprintId: string) => startSprint(sprintId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["sprints", projectId]});
        },
    });
}

export function useCompleteSprint(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
                         sprintId,
                         data,
                     }: {
            sprintId: string;
            data: CompleteSprintRequest;
        }) => completeSprint(sprintId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["sprints", projectId]});
            queryClient.invalidateQueries({queryKey: ["issues", projectId]});
        },
    });
}

export function useAddIssueToSprint(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({sprintId, issueId}: { sprintId: string; issueId: string }) =>
            addIssueToSprint(sprintId, issueId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["sprints", projectId]});
            queryClient.invalidateQueries({queryKey: ["issues", projectId]});
        },
    });
}

export function useRemoveIssueFromSprint(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({sprintId, issueId}: { sprintId: string; issueId: string }) =>
            removeIssueFromSprint(sprintId, issueId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["sprints", projectId]});
            queryClient.invalidateQueries({queryKey: ["issues", projectId]});
        },
    });
}
