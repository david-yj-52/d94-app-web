"use client";

import type {SaveFilterRequest, SearchIssuesParams} from "@/lib/api/search";
import {deleteFilter, getSavedFilters, saveFilter, searchIssues,} from "@/lib/api/search";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useSearchIssues(params: SearchIssuesParams, enabled = true) {
    return useQuery({
        queryKey: ["search-issues", params],
        queryFn: () => searchIssues(params),
        enabled: enabled && !!params.q,
    });
}

export function useSavedFilters() {
    return useQuery({
        queryKey: ["saved-filters"],
        queryFn: getSavedFilters,
    });
}

export function useSaveFilter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SaveFilterRequest) => saveFilter(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["saved-filters"]});
        },
    });
}

export function useDeleteFilter() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteFilter(id),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["saved-filters"]});
        },
    });
}
