"use client";

import {createProject, getProject, getProjects, updateProject} from "@/lib/api/projects";
import type {CreateProjectRequest, UpdateProjectRequest} from "@/types/project";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export function useProjects() {
    return useQuery({
        queryKey: ["projects"],
        queryFn: getProjects,
    });
}

export function useProject(projectId: string) {
    return useQuery({
        queryKey: ["projects", projectId],
        queryFn: () => getProject(projectId),
        enabled: !!projectId,
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateProjectRequest) => createProject(data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["projects"]});
        },
    });
}

export function useUpdateProject(projectId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: UpdateProjectRequest) => updateProject(projectId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["projects", projectId]});
            queryClient.invalidateQueries({queryKey: ["projects"]});
        },
    });
}
