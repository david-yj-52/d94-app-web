"use client";

import type {RegisterGitRepoRequest} from "@/lib/api/git";
import {deleteGitRepo, getGitActivity, getGitRepos, registerGitRepo,} from "@/lib/api/git";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useGitRepos(projectId: string) {
    return useQuery({
        queryKey: ["git-repos", projectId],
        queryFn: () => getGitRepos(projectId),
        enabled: !!projectId,
    });
}

export function useRegisterGitRepo(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: RegisterGitRepoRequest) => registerGitRepo(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["git-repos", projectId]});
        },
    });
}

export function useDeleteGitRepo(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (repoId: string) => deleteGitRepo(repoId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["git-repos", projectId]});
        },
    });
}

export function useGitActivity(projectId: string) {
    return useQuery({
        queryKey: ["git-activity", projectId],
        queryFn: () => getGitActivity(projectId),
        enabled: !!projectId,
    });
}
