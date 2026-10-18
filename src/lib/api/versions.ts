import apiClient from "./client";
import type {CreateVersionRequest, ReleaseNotesResponse, UpdateVersionRequest, VersionResponse,} from "@/types/version";

export async function getVersions(projectId: string): Promise<VersionResponse[]> {
    const res = await apiClient.get(`/v1/projects/${projectId}/versions`);
    return res.data.data;
}

export async function getVersion(versionId: string): Promise<VersionResponse> {
    const res = await apiClient.get(`/v1/versions/${versionId}`);
    return res.data.data;
}

export async function createVersion(
    projectId: string,
    data: CreateVersionRequest,
): Promise<VersionResponse> {
    const res = await apiClient.post(`/v1/projects/${projectId}/versions`, data);
    return res.data.data;
}

export async function updateVersion(
    versionId: string,
    data: UpdateVersionRequest,
): Promise<VersionResponse> {
    const res = await apiClient.put(`/v1/versions/${versionId}`, data);
    return res.data.data;
}

export async function deleteVersion(versionId: string): Promise<void> {
    await apiClient.delete(`/v1/versions/${versionId}`);
}

export async function releaseVersion(versionId: string): Promise<VersionResponse> {
    const res = await apiClient.post(`/v1/versions/${versionId}/release`, {});
    return res.data.data;
}

export async function archiveVersion(versionId: string): Promise<VersionResponse> {
    const res = await apiClient.post(`/v1/versions/${versionId}/archive`, {});
    return res.data.data;
}

export async function getReleaseNotes(versionId: string): Promise<ReleaseNotesResponse> {
    const res = await apiClient.get(`/v1/versions/${versionId}/release-notes`);
    return res.data.data;
}
