import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import {type CredentialPurpose, encryptCredential} from "@/lib/crypto/credential";
import {isMockEnabled} from "@/lib/mock/enabled";
import type {CredentialPublicKeyResponse, EncryptedCredential} from "@/types/auth";

const API_BASE_URL = process.env.BACKEND_URL;

interface AuthUser {
    id: string;
    email: string;
    name: string;
    accessToken: string;
}

/**
 * 인증 API 호출. mock 모드면 브라우저가 mock 공개키로 암호화했으므로 로그인도 mock 이 복호화한다.
 * mock 라우터는 미들웨어 번들에 들어가지 않도록 필요할 때만 불러온다.
 */
async function authFetch(path: string, body?: unknown): Promise<Response> {
    const init: RequestInit = body === undefined
        ? {method: "GET"}
        : {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)};
    if (isMockEnabled()) {
        const {handleMockRequest} = await import("@/lib/mock/router");
        const mock = await handleMockRequest(new Request(`http://mock${path}`, init), path.slice(1).split("/"));
        return Response.json(mock.body ?? {success: true}, {status: mock.status});
    }
    return fetch(`${API_BASE_URL}${path}`, {...init, cache: "no-store"});
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

/** 서버에서 직접 암호화할 때 (개발용 admin) 쓰는 백엔드 공개키 */
async function encryptOnServer(purpose: CredentialPurpose, fields: Record<string, string>): Promise<EncryptedCredential> {
    const res = await authFetch("/v1/auth/public-key");
    if (!res.ok) throw new Error(`공개키 조회 실패 ${await describeFailure(res)}`);
    const publicKey = (await res.json()).data as CredentialPublicKeyResponse;
    return encryptCredential(publicKey, purpose, fields);
}

/** 백엔드 로그인 (암호문 그대로 전달). 실패(자격 증명 오류·연결 실패)면 null — 이유는 Vercel 런타임 로그에 남긴다 */
async function backendLogin(enc: EncryptedCredential): Promise<AuthUser | null> {
    try {
        const res = await authFetch("/v1/auth/login", {enc});
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
        };
    } catch (error) {
        console.error(`[auth] 로그인 요청 실패 (BACKEND_URL=${API_BASE_URL}):`, error);
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

/** 백엔드 회원가입 (서버에서 암호화). 이미 있는 계정이면 false */
async function backendRegister(email: string, name: string, password: string): Promise<boolean> {
    try {
        const res = await authFetch("/v1/auth/register", {enc: await encryptOnServer("register", {email, name, password})});
        if (!res.ok) console.warn(`[auth] 회원가입 실패 ${await describeFailure(res)}`);
        return res.ok;
    } catch (error) {
        console.error(`[auth] 회원가입 요청 실패 (BACKEND_URL=${API_BASE_URL}):`, error);
        return false;
    }
}

/**
 * 개발용 admin/admin 로그인 (DEV_ADMIN_LOGIN=true). 브라우저는 비밀번호 없이 `devAdmin` 표시만 보낸다.
 * - DEV_ADMIN_EMAIL·DEV_ADMIN_PASSWORD 가 있으면 그 **실제 계정**으로 백엔드에 로그인해 유효한 JWT 를 받는다
 *   (서버에서 암호화해 보낸다). 계정이 없으면 한 번 가입시킨 뒤 다시 로그인한다.
 * - 없으면 가짜 토큰을 준다 → mock 모드(DEV_MOCK_API) 에서만 쓸 수 있고, 실제 백엔드는 401 로 거절한다.
 */
async function devAdminLogin(): Promise<AuthUser | null> {
    const email = process.env.DEV_ADMIN_EMAIL;
    const password = process.env.DEV_ADMIN_PASSWORD;
    if (!email || !password) {
        console.warn("[auth] DEV_ADMIN_EMAIL/DEV_ADMIN_PASSWORD 없음 → 가짜 토큰 (mock 모드 전용, 실제 백엔드는 401)");
        return {id: "admin", email: "admin", name: "Admin", accessToken: "dev-admin-token"};
    }
    const login = async () => {
        try {
            return await backendLogin(await encryptOnServer("login", {email, password}));
        } catch (error) {
            console.error("[auth] 개발용 admin 암호화 실패:", error);
            return null;
        }
    };
    const user = await login();
    if (user) return {...user, name: "Admin"};
    console.info("[auth] 개발용 admin 계정 로그인 실패 → 가입 시도");
    if (!(await backendRegister(email, "Admin", password))) return null;
    const registered = await login();
    return registered && {...registered, name: "Admin"};
}

export const {handlers, auth, signIn, signOut} = NextAuth({
    providers: [
        Credentials({
            // 브라우저가 보내는 값: enc(암호화 봉투 JSON) 또는 devAdmin. 평문 email·password 는 받지 않는다 (ADR 0004)
            credentials: {
                enc: {type: "text"},
                devAdmin: {type: "text"},
            },
            async authorize(credentials) {
                // TODO: 임시 - 개발용 admin/admin (DEV_ADMIN_LOGIN=true 일 때만, Vercel 포함). 정식 운영 전 제거
                if (credentials?.devAdmin === "true") {
                    return process.env.DEV_ADMIN_LOGIN === "true" ? devAdminLogin() : null;
                }
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
        async jwt({token, user}) {
            if (user) {
                token.accessToken = user.accessToken;
                token.accessTokenExpiresAt = accessTokenExpiresAt(user.accessToken);
            }
            // 백엔드 토큰이 만료되면 세션도 끝낸다 (null → 세션 쿠키 삭제, 미들웨어가 /login 으로 보냄)
            if (token.accessTokenExpiresAt && Date.now() >= token.accessTokenExpiresAt) return null;
            return token;
        },
        // 브라우저로 나가는 세션(/api/auth/session)에는 표시용 정보만 담는다. accessToken 은 절대 넣지 않는다 (ADR 0005)
        async session({session}) {
            return session;
        },
    },

    pages: {
        signIn: "/login",
    },

    secret: process.env.AUTH_SECRET,
});
