import apiClient from "./client";
import type {CreateProjectRequest, ProjectResponse, UpdateProjectRequest} from "@/types/project";

export async function getProjects(): Promise<ProjectResponse[]> {
    const res = await apiClient.get("/v1/projects");
    return res.data.data;
}

export async function getProject(projectId: string): Promise<ProjectResponse> {
    const res = await apiClient.get(`/v1/projects/${projectId}`);
    return res.data.data;
}

export async function createProject(
    data: CreateProjectRequest,
): Promise<ProjectResponse> {
    const res = await apiClient.post("/v1/projects", data);
    return res.data.data;
}

export async function updateProject(
    projectId: string,
    data: UpdateProjectRequest,
): Promise<ProjectResponse> {
    const res = await apiClient.put(`/v1/projects/${projectId}`, data);
    return res.data.data;
}
