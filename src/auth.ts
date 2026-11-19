import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import {isMockEnabled} from "@/lib/mock/enabled";
import {isAccessTokenExpired, isSessionExpired, MAX_SESSION_MS, needsRefresh} from "@/lib/auth/sessionPolicy";
import type {EncryptedCredential} from "@/types/auth";

const API_BASE_URL = process.env.BACKEND_URL;

interface AuthUser {
    id: string;
    email: string;
    name: string;
    accessToken: string;
    refreshToken?: string;
}

/**
 * 인증 API 호출 (POST). refreshToken 은 백엔드가 쿠키로만 받으므로 Cookie 헤더로 보낸다.
 * mock 모드면 브라우저가 mock 공개키로 암호화했으므로 로그인도 mock 이 복호화한다.
 * mock 라우터는 미들웨어 번들에 들어가지 않도록 필요할 때만 불러온다.
 */
async function authFetch(path: string, {body, refreshToken}: { body?: unknown; refreshToken?: string } = {}): Promise<Response> {
    const headers: Record<string, string> = {"Content-Type": "application/json"};
    if (refreshToken) headers.cookie = `refreshToken=${refreshToken}`;
    const init: RequestInit = {method: "POST", headers, body: body === undefined ? undefined : JSON.stringify(body)};
    if (isMockEnabled()) {
        const {handleMockRequest} = await import("@/lib/mock/router");
        const mock = await handleMockRequest(new Request(`http://mock${path}`, init), path.slice(1).split("/"));
        return Response.json(mock.body ?? {success: true}, {status: mock.status});
    }
    return fetch(`${API_BASE_URL}${path}`, {...init, cache: "no-store"});
}

/** 백엔드가 Set-Cookie 로 내려 준 refreshToken (lib-core BaseAuthController). 없으면 undefined (mock·UMD 가 쿠키를 안 넘길 때) */
function refreshTokenFromResponse(res: Response): string | undefined {
    for (const cookie of res.headers.getSetCookie()) {
        const value = /^refreshToken=([^;]*)/.exec(cookie)?.[1];
        if (value) return value;
    }
    return undefined;
}

/** 실패한 백엔드 응답의 상태·오류 코드 (요청 값은 남기지 않는다 — 어차피 암호문이다) */
async function describeFailure(res: Response): Promise<string> {
    const umdError = res.headers.get("x-umd-error");
    const body = await res.text().catch(() => "");
    let code = "";
    try {
        code = JSON.parse(body).code ?? "";
    } catch {
        // 본문이 JSON 이 아님 (게이트웨이 401 은 본문 없음)
    }
    return `status=${res.status}${umdError ? ` x-umd-error=${umdError}` : ""}${code ? ` code=${code}` : ""}${body ? "" : " (본문 없음)"}`;
}

/** 브라우저가 보낸 `enc` 문자열을 봉투로 파싱. 형식이 아니면 null (평문 자격 증명은 받지 않는다) */
function parseEnvelope(raw: unknown): EncryptedCredential | null {
    if (typeof raw !== "string") return null;
    try {
        const enc = JSON.parse(raw);
        const fields = [enc?.kid, enc?.key, enc?.iv, enc?.data];
        return enc?.v === 1 && fields.every((f) => typeof f === "string") ? enc as EncryptedCredential : null;
    } catch {
        return null;
    }
}

/** 백엔드 로그인 (암호문 그대로 전달). 실패(자격 증명 오류·연결 실패)면 null — 이유는 Vercel 런타임 로그에 남긴다 */
async function backendLogin(enc: EncryptedCredential): Promise<AuthUser | null> {
    try {
        const res = await authFetch("/v1/auth/login", {body: {enc}});
        if (!res.ok) {
            console.warn(`[auth] 로그인 실패 ${await describeFailure(res)}`);
            return null;
        }
        const json = await res.json();
        if (!json.success) {
            console.warn(`[auth] 로그인 실패 success=false code=${json.code}`);
            return null;
        }
        const data = json.data;
        // 이메일은 암호문 안에 있어 서버가 모른다 → JWT 의 sub 를 쓴다 (d94-query 는 sub = email)
        const email = emailFromAccessToken(data.accessToken) ?? data.user?.name ?? "user";
        return {
            id: email,
            email,
            // d94-query 로그인 응답에는 user 가 없다 (accessToken·tokenType·expiresIn 만) → 이메일로 대체
            name: (data.user?.name ?? email) as string,
            accessToken: data.accessToken,
            refreshToken: refreshTokenFromResponse(res),
        };
    } catch (error) {
        console.error(`[auth] 로그인 요청 실패 (BACKEND_URL=${API_BASE_URL}):`, error);
        return null;
    }
}

/** 백엔드 refresh (회전: 새 refreshToken 이 Set-Cookie 로 온다). 실패면 null — 이유만 로그에 남긴다 (토큰 값은 남기지 않음) */
async function backendRefresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
        const res = await authFetch("/v1/auth/refresh", {refreshToken});
        const json = res.ok ? await res.json() : null;
        const next = refreshTokenFromResponse(res);
        if (!json?.success || !json.data?.accessToken || !next) {
            console.warn(`[auth] refresh 실패 ${res.ok ? "응답에 토큰 없음" : await describeFailure(res)}`);
            return null;
        }
        return {accessToken: json.data.accessToken, refreshToken: next};
    } catch (error) {
        console.error("[auth] refresh 요청 실패:", error);
        return null;
    }
}

/** 백엔드 JWT payload (서명 검증은 백엔드 몫 — 여기서는 표시용 이메일·만료 시각만 읽는다). JWT 가 아니면 null (mock 토큰) */
function accessTokenClaims(token: unknown): { sub?: unknown; exp?: unknown } | null {
    if (typeof token !== "string") return null;
    try {
        const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

function emailFromAccessToken(token: unknown): string | null {
    const sub = accessTokenClaims(token)?.sub;
    return typeof sub === "string" ? sub : null;
}

/** 백엔드 토큰 만료 시각(ms). exp 가 없으면 undefined (mock 토큰 — 세션 만료에 맡긴다) */
function accessTokenExpiresAt(token: unknown): number | undefined {
    const exp = accessTokenClaims(token)?.exp;
    return typeof exp === "number" ? exp * 1000 : undefined;
}

export const {handlers, auth, signIn, signOut} = NextAuth({
    providers: [
        Credentials({
            // 브라우저가 보내는 값: enc(암호화 봉투 JSON) 뿐. 평문 email·password 는 받지 않는다 (ADR 0004)
            credentials: {
                enc: {type: "text"},
            },
            async authorize(credentials) {
                const enc = parseEnvelope(credentials?.enc);
                if (!enc) {
                    console.warn("[auth] 로그인 거절: 암호화 봉투가 없거나 형식이 아님");
                    return null;
                }
                return backendLogin(enc);
            },
        }),
    ],

    callbacks: {
        // 백엔드 토큰은 암호화된 세션 쿠키(JWE) 안에만 둔다. 서버 쪽에서는 lib/auth/accessToken 으로 꺼낸다
        // refresh 는 update(POST /api/auth/session) 때만 한다 — 클라이언트가 한 번에 하나씩 보내므로 회전 경합이 없다 (ADR 0007)
        async jwt({token, user, trigger, session}) {
            const now = Date.now();
            if (user) {
                token.accessToken = user.accessToken;
                token.accessTokenExpiresAt = accessTokenExpiresAt(user.accessToken);
                token.refreshToken = user.refreshToken;
                token.loginAt = now;
                token.lastActiveAt = now;
                return token;
            }
            // 유휴·절대 만료, 또는 갱신할 수 없는 만료 토큰 → null (세션 쿠키 삭제)
            if (isSessionExpired(token, now)) return null;
            if (trigger !== "update") return token;

            // SessionActivity 가 사용자 입력이 있을 때만 {active: true} 를 보낸다 (폴링은 활동이 아님)
            if ((session as { active?: unknown } | undefined)?.active === true) token.lastActiveAt = now;
            if (needsRefresh(token, now)) {
                const next = await backendRefresh(token.refreshToken!);
                if (next) {
                    token.accessToken = next.accessToken;
                    token.accessTokenExpiresAt = accessTokenExpiresAt(next.accessToken);
                    token.refreshToken = next.refreshToken;
                } else if (isAccessTokenExpired(token, now)) {
                    return null;
                }
                // ponytail: 아직 유효한 토큰이면 실패해도 유지 (다른 탭과 동시에 회전한 경우 등). 만료되면 위에서 끝난다
            }
            return token;
        },
        // 브라우저로 나가는 세션(/api/auth/session)에는 표시용 정보만 담는다. accessToken 은 절대 넣지 않는다 (ADR 0005)
        async session({session}) {
            return session;
        },
    },

    events: {
        // 로그아웃하면 백엔드 refresh token 도 폐기한다 (Redis 에서 삭제). 실패해도 로그아웃은 진행
        async signOut(message) {
            const refreshToken = "token" in message ? message.token?.refreshToken : undefined;
            if (refreshToken) await authFetch("/v1/auth/logout", {refreshToken}).catch(() => undefined);
        },
    },

    // 쿠키 수명 = 절대 만료. 유휴 만료는 jwt 콜백·미들웨어가 lastActiveAt 으로 판단한다
    session: {maxAge: MAX_SESSION_MS / 1000},

    pages: {
        signIn: "/login",
    },

    secret: process.env.AUTH_SECRET,
});
