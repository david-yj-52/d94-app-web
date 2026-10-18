import apiClient from "./client";

export interface GitRepoResponse {
    id: string;
    repoName: string;
    repoUrl: string;
    provider: "GITHUB" | "GITLAB" | "BITBUCKET";
    webhookUrl: string;
    webhookSecret: string;
    createdAt: string;
}

export interface RegisterGitRepoRequest {
    repoName: string;
    repoUrl: string;
    provider: "GITHUB" | "GITLAB" | "BITBUCKET";
    accessToken: string;
}

export interface GitActivityItem {
    id: string;
    type: "COMMIT" | "PR";
    author: string;
    message: string;
    url?: string;
    createdAt: string;
}

export async function getGitRepos(projectId: string): Promise<GitRepoResponse[]> {
    const res = await apiClient.get(`/v1/projects/${projectId}/git-repos`);
    return res.data.data ?? res.data;
}

export async function registerGitRepo(
    projectId: string,
    data: RegisterGitRepoRequest,
): Promise<GitRepoResponse> {
    const res = await apiClient.post(`/v1/projects/${projectId}/git-repos`, data);
    return res.data.data ?? res.data;
}

export async function deleteGitRepo(repoId: string): Promise<void> {
    await apiClient.delete(`/v1/git-repos/${repoId}`);
}

export async function getGitActivity(projectId: string): Promise<GitActivityItem[]> {
    const res = await apiClient.get(`/v1/projects/${projectId}/git-activity`);
    return res.data.data ?? res.data;
}
