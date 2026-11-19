// 세션 만료 정책 (순수 함수 — 미들웨어·jwt 콜백·프록시가 같은 규칙을 쓴다). 결정 → docs/decisions/0007
import type {JWT} from "next-auth/jwt";

// ponytail: 제품 정책이 정해지면 값만 바꾼다. 환경마다 달라야 하면 그때 env 로
/** 마지막 사용자 입력 뒤 이 시간이 지나면 다시 로그인 */
export const IDLE_TIMEOUT_MS = 30 * 60_000;
/** 로그인 뒤 활동과 무관하게 이 시간이 지나면 다시 로그인 */
export const MAX_SESSION_MS = 12 * 60 * 60_000;
/** 백엔드 accessToken(15분) 만료 이 시간 전부터 refresh */
export const REFRESH_BEFORE_MS = 2 * 60_000;

/** 세션을 끝내야 하는가 (유휴·절대 만료, 또는 갱신할 수 없는 만료 토큰) */
export function isSessionExpired(token: JWT, now = Date.now()): boolean {
    if (token.loginAt && now - token.loginAt >= MAX_SESSION_MS) return true;
    if (token.lastActiveAt && now - token.lastActiveAt >= IDLE_TIMEOUT_MS) return true;
    return !token.refreshToken && isAccessTokenExpired(token, now);
}

/** 백엔드 accessToken 만료. exp 가 없는 토큰(mock)은 만료되지 않는다 */
export function isAccessTokenExpired(token: JWT, now = Date.now()): boolean {
    return !!token.accessTokenExpiresAt && now >= token.accessTokenExpiresAt;
}

/** refresh 할 때가 됐는가 (refresh token 이 있고 accessToken 만료가 가까움) */
export function needsRefresh(token: JWT, now = Date.now()): boolean {
    return !!token.refreshToken && !!token.accessTokenExpiresAt && now >= token.accessTokenExpiresAt - REFRESH_BEFORE_MS;
}
