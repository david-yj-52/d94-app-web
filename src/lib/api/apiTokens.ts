import apiClient from "./client";
import type {ApiToken, ApiTokenService, IssueApiTokenRequest, IssuedApiToken} from "@/types/apiToken";

export async function getApiTokens(): Promise<ApiToken[]> {
    const res = await apiClient.get("/v1/api-tokens");
    return res.data.data ?? [];
}

export async function issueApiToken(body: IssueApiTokenRequest): Promise<IssuedApiToken> {
    const res = await apiClient.post("/v1/api-tokens", body);
    return res.data.data;
}

export async function revokeApiToken(id: string): Promise<void> {
    await apiClient.delete(`/v1/api-tokens/${id}`);
}

export async function getApiTokenServices(): Promise<ApiTokenService[]> {
    const res = await apiClient.get("/v1/api-tokens/services");
    return res.data.data ?? [];
}

/** ADMIN 만 (아니면 403). 응답은 바뀐 뒤 전체 서비스 상태 */
export async function setApiTokenService(service: string, enabled: boolean): Promise<ApiTokenService[]> {
    const res = await apiClient.put(`/v1/api-tokens/services/${service}`, {enabled});
    return res.data.data ?? [];
}
