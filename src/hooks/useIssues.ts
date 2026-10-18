"use client";

import {
    createIssue,
    deleteIssue,
    getAvailableTransitions,
    getIssue,
    getIssues,
    updateIssue,
    updateIssueStatus,
} from "@/lib/api/issues";
import type {CreateIssueRequest, IssueFilterParams, UpdateIssueRequest,} from "@/types/issue";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useIssues(projectId: string, filters?: IssueFilterParams) {
    return useQuery({
        queryKey: ["issues", projectId, filters],
        queryFn: () => getIssues(projectId, filters),
        enabled: !!projectId,
    });
}

export function useIssue(issueId: string) {
    return useQuery({
        queryKey: ["issue", issueId],
        queryFn: () => getIssue(issueId),
        enabled: !!issueId,
    });
}

export function useAvailableTransitions(issueId: string) {
    return useQuery({
        queryKey: ["issue-transitions", issueId],
        queryFn: () => getAvailableTransitions(issueId),
        enabled: !!issueId,
    });
}

export function useCreateIssue(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateIssueRequest) => createIssue(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["issues", projectId]});
        },
    });
}

export function useUpdateIssue(projectId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
                         issueId,
                         data,
                     }: {
            issueId: string;
            data: UpdateIssueRequest;
        }) => updateIssue(issueId, data),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({queryKey: ["issue", updated.id]});
            if (projectId) {
                queryClient.invalidateQueries({queryKey: ["issues", projectId]});
            }
        },
    });
}

export function useDeleteIssue(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (issueId: string) => deleteIssue(issueId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["issues", projectId]});
        },
    });
}

export function useUpdateIssueStatus(projectId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
                         issueId,
                         statusId,
                     }: {
            issueId: string;
            statusId: string;
        }) => updateIssueStatus(issueId, statusId),
        onMutate: async ({issueId, statusId}) => {
            await queryClient.cancelQueries({queryKey: ["issue", issueId]});
            const previous = queryClient.getQueryData(["issue", issueId]);
            queryClient.setQueryData(["issue", issueId], (old: any) =>
                old ? {...old, statusId} : old,
            );
            return {previous, issueId};
        },
        onError: (_err, _vars, context: any) => {
            if (context?.previous) {
                queryClient.setQueryData(["issue", context.issueId], context.previous);
            }
        },
        onSuccess: (updated) => {
            queryClient.invalidateQueries({queryKey: ["issue", updated.id]});
            queryClient.invalidateQueries({
                queryKey: ["issue-transitions", updated.id],
            });
            if (projectId) {
                queryClient.invalidateQueries({queryKey: ["issues", projectId]});
            }
        },
    });
}
