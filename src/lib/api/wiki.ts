import apiClient from "./client";

export interface WikiPageSummary {
    id: string;
    title: string;
    parentId: string | null;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    childCount: number;
}

export interface WikiPageResponse {
    id: string;
    title: string;
    content: string;
    contentHtml: string;
    parentId: string | null;
    version: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface WikiPageRequest {
    title: string;
    content: string;
    parentId?: string;
}

export interface WikiVersionResponse {
    version: number;
    content: string;
    createdBy: string;
    createdAt: string;
}

export async function getWikiTree(projectId: string): Promise<WikiPageSummary[]> {
    const res = await apiClient.get(`/v1/projects/${projectId}/wiki`);
    return res.data.data;
}

export async function getWikiPage(pageId: string): Promise<WikiPageResponse> {
    const res = await apiClient.get(`/v1/wiki/${pageId}`);
    return res.data.data;
}

export async function createWikiPage(
    projectId: string,
    data: WikiPageRequest,
): Promise<WikiPageResponse> {
    const res = await apiClient.post(`/v1/projects/${projectId}/wiki`, data);
    return res.data.data;
}

export async function updateWikiPage(
    pageId: string,
    data: WikiPageRequest,
): Promise<WikiPageResponse> {
    const res = await apiClient.put(`/v1/wiki/${pageId}`, data);
    return res.data.data;
}

export async function deleteWikiPage(pageId: string): Promise<void> {
    await apiClient.delete(`/v1/wiki/${pageId}`);
}

export async function moveWikiPage(
    pageId: string,
    parentId: string | null,
    sortOrder?: number,
): Promise<WikiPageResponse> {
    const res = await apiClient.put(`/v1/wiki/${pageId}/move`, {parentId, sortOrder});
    return res.data.data;
}

export async function getWikiVersions(pageId: string): Promise<WikiVersionResponse[]> {
    const res = await apiClient.get(`/v1/wiki/${pageId}/versions`);
    return res.data.data;
}
