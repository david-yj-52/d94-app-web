"use client";

import {
    createMilestone,
    deleteMilestone,
    getMilestoneProgress,
    getMilestones,
    updateMilestone,
} from "@/lib/api/milestones";
import type {CreateMilestoneRequest, UpdateMilestoneRequest} from "@/types/milestone";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useMilestones(projectId: string) {
    return useQuery({
        queryKey: ["milestones", projectId],
        queryFn: () => getMilestones(projectId),
        enabled: !!projectId,
    });
}

export function useCreateMilestone(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateMilestoneRequest) => createMilestone(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["milestones", projectId]});
        },
    });
}

export function useUpdateMilestone(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
                         milestoneId,
                         data,
                     }: {
            milestoneId: string;
            data: UpdateMilestoneRequest;
        }) => updateMilestone(milestoneId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["milestones", projectId]});
        },
    });
}

export function useDeleteMilestone(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (milestoneId: string) => deleteMilestone(milestoneId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["milestones", projectId]});
        },
    });
}

export function useMilestoneProgress(milestoneId: string) {
    return useQuery({
        queryKey: ["milestoneProgress", milestoneId],
        queryFn: () => getMilestoneProgress(milestoneId),
        enabled: !!milestoneId,
    });
}
