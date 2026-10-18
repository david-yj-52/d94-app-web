"use client";

import {
    archiveVersion,
    createVersion,
    deleteVersion,
    getReleaseNotes,
    getVersions,
    releaseVersion,
    updateVersion,
} from "@/lib/api/versions";
import type {CreateVersionRequest, UpdateVersionRequest} from "@/types/version";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useVersions(projectId: string) {
    return useQuery({
        queryKey: ["versions", projectId],
        queryFn: () => getVersions(projectId),
        enabled: !!projectId,
    });
}

export function useCreateVersion(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateVersionRequest) => createVersion(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["versions", projectId]});
        },
    });
}

export function useUpdateVersion(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({versionId, data}: { versionId: string; data: UpdateVersionRequest }) =>
            updateVersion(versionId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["versions", projectId]});
        },
    });
}

export function useDeleteVersion(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (versionId: string) => deleteVersion(versionId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["versions", projectId]});
        },
    });
}

export function useReleaseVersion(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (versionId: string) => releaseVersion(versionId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["versions", projectId]});
        },
    });
}

export function useArchiveVersion(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (versionId: string) => archiveVersion(versionId),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["versions", projectId]});
        },
    });
}

export function useReleaseNotes(versionId: string) {
    return useQuery({
        queryKey: ["releaseNotes", versionId],
        queryFn: () => getReleaseNotes(versionId),
        enabled: !!versionId,
    });
}
