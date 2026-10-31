// 서버 전용 (Route Handler·서버 컴포넌트). 클라이언트 컴포넌트에서 import 하지 않는다 — 브라우저는 백엔드 토큰을 몰라야 한다 (ADR 0005)
import {getToken} from "next-auth/jwt";

/**
 * 요청의 세션 쿠키(암호화된 JWE)를 풀어 백엔드 accessToken 을 꺼낸다. 세션이 없거나 풀 수 없으면 undefined.
 * - 쿠키 이름은 https 에서 `__Secure-authjs.session-token`, http(로컬)에서 `authjs.session-token` → 둘 다 시도
 * - getToken 은 Authorization: Bearer 헤더도 세션 토큰으로 받아 주므로, 쿠키만 넘겨 그 경로를 막는다
 */
export async function getBackendAccessToken(request: Request): Promise<string | undefined> {
    const secret = process.env.AUTH_SECRET;
    const cookie = request.headers.get("cookie");
    if (!secret || !cookie) return undefined;

    const req = {headers: new Headers({cookie})};
    for (const secureCookie of [true, false]) {
        const token = await getToken({req, secret, secureCookie});
        if (token) {
            // jwt 콜백을 거치지 않으므로 만료 확인을 여기서도 한다
            if (token.accessTokenExpiresAt && Date.now() >= token.accessTokenExpiresAt) return undefined;
            return token.accessToken;
        }
    }
    return undefined;
}
