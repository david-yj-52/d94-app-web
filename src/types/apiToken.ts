/** d94-query /api/v1/api-tokens (MCP·AI 도구용 API 토큰). 날짜는 백엔드 LocalDateTime 문자열 */
export type ApiTokenAccess = "READ" | "WRITE";

export interface ApiToken {
    id: string;
    name: string;
    service: string;
    access: ApiTokenAccess;
    /** 원문 앞 12자 (예: d94_cira_3q2) */
    prefix: string;
    expiresAt: string;
    lastUsedAt: string | null;
    createdAt: string;
}

export interface IssueApiTokenRequest {
    service: string;
    name: string;
    access: ApiTokenAccess;
    expiresInDays: 30 | 90 | 365;
}

/** token 원문은 이 응답에서만 한 번 내려온다 */
export interface IssuedApiToken {
    token: string;
    info: ApiToken;
}

export interface ApiTokenService {
    service: string;
    enabled: boolean;
}
