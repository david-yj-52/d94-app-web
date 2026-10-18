"use client";

import type {WikiPageRequest} from "@/lib/api/wiki";
import {
    createWikiPage,
    deleteWikiPage,
    getWikiPage,
    getWikiTree,
    getWikiVersions,
    updateWikiPage,
} from "@/lib/api/wiki";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useWikiTree(projectId: string) {
    return useQuery({
        queryKey: ["wiki-tree", projectId],
        queryFn: () => getWikiTree(projectId),
        enabled: !!projectId,
    });
}

export function useWikiPage(pageId: string | null) {
    return useQuery({
        queryKey: ["wiki-page", pageId],
        queryFn: () => getWikiPage(pageId!),
        enabled: !!pageId,
    });
}

export function useWikiVersions(pageId: string | null) {
    return useQuery({
        queryKey: ["wiki-versions", pageId],
        queryFn: () => getWikiVersions(pageId!),
        enabled: !!pageId,
    });
}

export function useCreateWikiPage(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: WikiPageRequest) => createWikiPage(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["wiki-tree", projectId]});
        },
    });
}

export function useUpdateWikiPage(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({pageId, data}: { pageId: string; data: WikiPageRequest }) =>
            updateWikiPage(pageId, data),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({queryKey: ["wiki-tree", projectId]});
            queryClient.invalidateQueries({queryKey: ["wiki-page", updated.id]});
        },
    });
}

export function useDeleteWikiPage(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (pageId: string) => deleteWikiPage(pageId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["wiki-tree", projectId]});
        },
    });
}
