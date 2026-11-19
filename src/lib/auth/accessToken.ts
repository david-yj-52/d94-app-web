// 서버 전용 (미들웨어·Route Handler·서버 컴포넌트). 클라이언트 컴포넌트에서 import 하지 않는다 — 브라우저는 백엔드 토큰을 몰라야 한다 (ADR 0005)
import {getToken, type JWT} from "next-auth/jwt";

import {isAccessTokenExpired, isSessionExpired} from "./sessionPolicy";

/**
 * 요청의 세션 쿠키(암호화된 JWE)를 **읽기만** 한다. 세션이 없거나, 풀 수 없거나, 만료 정책상 끝난 세션이면 null.
 * - 쿠키를 다시 쓰지 않는다: refresh 로 바뀐 쿠키를 늦게 끝난 요청이 옛 값으로 덮지 않도록 (ADR 0007)
 * - 쿠키 이름은 https 에서 `__Secure-authjs.session-token`, http(로컬)에서 `authjs.session-token` → 둘 다 시도
 * - getToken 은 Authorization: Bearer 헤더도 세션 토큰으로 받아 주므로, 쿠키만 넘겨 그 경로를 막는다
 */
export async function readSessionToken(request: Request): Promise<JWT | null> {
    const secret = process.env.AUTH_SECRET;
    const cookie = request.headers.get("cookie");
    if (!secret || !cookie) return null;

    const req = {headers: new Headers({cookie})};
    for (const secureCookie of [true, false]) {
        const token = await getToken({req, secret, secureCookie});
        if (token) return isSessionExpired(token) ? null : token;
    }
    return null;
}

/**
 * 백엔드 accessToken. 세션이 없거나 accessToken 이 만료됐으면 undefined
 * → 백엔드가 401 → apiClient 가 세션 refresh 후 재시도한다.
 */
export async function getBackendAccessToken(request: Request): Promise<string | undefined> {
    const token = await readSessionToken(request);
    if (!token || isAccessTokenExpired(token)) return undefined;
    return token.accessToken;
}
