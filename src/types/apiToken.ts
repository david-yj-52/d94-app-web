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

/** 전역 토큰 서비스 코드. 모든 서비스 API 를 호출할 수 있다(토큰·설정 관리 API 는 제외) */
export const GLOBAL_TOKEN_SERVICE = "all";

const SERVICE_LABELS: Record<string, string> = {
    [GLOBAL_TOKEN_SERVICE]: "전체 (전역)",
    cira: "CIRA",
    docs: "Docs",
    study: "Study",
    "interface-test": "인터페이스 테스트",
    "life-metric": "Life Metric",
    infra: "인프라",
};

/** 서비스 코드 → 화면 이름. 모르는 코드는 대문자로 */
export const serviceLabel = (code: string) => SERVICE_LABELS[code] ?? code.toUpperCase();
