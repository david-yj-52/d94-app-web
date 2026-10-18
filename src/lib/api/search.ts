import apiClient from "./client";
import type {IssueResponse, PageResponse} from "@/types/issue";

export interface SearchIssuesParams {
    q: string;
    projectIds?: string[];
    status?: string[];
    priority?: string[];
    assigneeId?: string[];
    dateFrom?: string;
    dateTo?: string;
    sort?: "relevance" | "newest" | "updated";
    page?: number;
    size?: number;
}

export interface SavedFilter {
    id: string;
    name: string;
    params: SearchIssuesParams;
    createdAt: string;
}

export interface SaveFilterRequest {
    name: string;
    params: SearchIssuesParams;
}

export async function searchIssues(
    params: SearchIssuesParams,
): Promise<PageResponse<IssueResponse>> {
    const res = await apiClient.get("/v1/search/issues", {params});
    return res.data.data;
}

export async function getSavedFilters(): Promise<SavedFilter[]> {
    const res = await apiClient.get("/v1/saved-filters");
    return res.data.data ?? [];
}

export async function saveFilter(data: SaveFilterRequest): Promise<SavedFilter> {
    const res = await apiClient.post("/v1/saved-filters", data);
    return res.data.data;
}

export async function deleteFilter(id: string): Promise<void> {
    await apiClient.delete(`/v1/saved-filters/${id}`);
}
