"use client";

import apiClient from "./client";
import type {IssueResponse, PageResponse} from "@/types/issue";

export interface CqlSearchRequest {
    cql: string;
    page?: number;
    size?: number;
}

export interface CqlValidateResponse {
    valid: boolean;
    error?: string;
    position?: number;
}

export interface CqlAutocompleteResponse {
    suggestions: string[];
}

export async function searchByCql(
    params: CqlSearchRequest,
): Promise<PageResponse<IssueResponse>> {
    const res = await apiClient.post("/v1/search/cql", params);
    return res.data.data;
}

export async function validateCql(cql: string): Promise<CqlValidateResponse> {
    const res = await apiClient.post("/v1/search/cql/validate", {cql});
    return res.data.data;
}

export async function autocompleteCql(
    cql: string,
    cursor: number,
): Promise<CqlAutocompleteResponse> {
    const res = await apiClient.get("/v1/search/cql/autocomplete", {
        params: {cql, cursor},
    });
    return res.data.data;
}
