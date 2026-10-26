import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API_BASE_URL = process.env.BACKEND_URL;

interface AuthUser {
    id: string;
    email: string;
    name: string;
    accessToken: string;
}

/** 실패한 백엔드 응답의 상태·오류 코드 (비밀번호 등 요청 값은 남기지 않는다) */
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

/** 백엔드 로그인. 실패(자격 증명 오류·연결 실패)면 null — 이유는 Vercel 런타임 로그에 남긴다 */
async function backendLogin(email: string, password: string): Promise<AuthUser | null> {
    try {
        const res = await fetch(`${API_BASE_URL}/v1/auth/login`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email, password}),
        });
        if (!res.ok) {
            console.warn(`[auth] 로그인 실패 email=${email} ${await describeFailure(res)}`);
            return null;
        }
        const json = await res.json();
        if (!json.success) {
            console.warn(`[auth] 로그인 실패 email=${email} success=false code=${json.code}`);
            return null;
        }
        const data = json.data;
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

/** 백엔드 회원가입. 이미 있는 계정이면 false */
async function backendRegister(email: string, name: string, password: string): Promise<boolean> {
    try {
        const res = await fetch(`${API_BASE_URL}/v1/auth/register`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email, name, password}),
        });
        if (!res.ok) console.warn(`[auth] 회원가입 실패 email=${email} ${await describeFailure(res)}`);
        return res.ok;
    } catch (error) {
        console.error(`[auth] 회원가입 요청 실패 (BACKEND_URL=${API_BASE_URL}):`, error);
        return false;
    }
}

/**
 * 개발용 admin/admin 로그인 (DEV_ADMIN_LOGIN=true).
 * - DEV_ADMIN_EMAIL·DEV_ADMIN_PASSWORD 가 있으면 그 **실제 계정**으로 백엔드에 로그인해 유효한 JWT 를 받는다.
 *   계정이 없으면 한 번 가입시킨 뒤 다시 로그인한다.
 * - 없으면 가짜 토큰을 준다 → mock 모드(DEV_MOCK_API) 에서만 쓸 수 있고, 실제 백엔드는 401 로 거절한다.
 */
async function devAdminLogin(): Promise<AuthUser | null> {
    const email = process.env.DEV_ADMIN_EMAIL;
    const password = process.env.DEV_ADMIN_PASSWORD;
    if (!email || !password) {
        console.warn("[auth] DEV_ADMIN_EMAIL/DEV_ADMIN_PASSWORD 없음 → 가짜 토큰 (mock 모드 전용, 실제 백엔드는 401)");
        return {id: "admin", email: "admin", name: "Admin", accessToken: "dev-admin-token"};
    }
    const user = await backendLogin(email, password);
    if (user) return {...user, name: "Admin"};
    console.info(`[auth] 개발용 admin 계정 로그인 실패 → 가입 시도 email=${email}`);
    if (!(await backendRegister(email, "Admin", password))) return null;
    const registered = await backendLogin(email, password);
    return registered && {...registered, name: "Admin"};
}

/** admin/admin, 또는 DEV_ADMIN_EMAIL·DEV_ADMIN_PASSWORD 를 그대로 입력한 경우 */
function isDevAdminCredentials(email: string, password: string): boolean {
    if (process.env.DEV_ADMIN_LOGIN !== "true") return false;
    if (email === "admin" && password === "admin") return true;
    return !!process.env.DEV_ADMIN_EMAIL
        && email === process.env.DEV_ADMIN_EMAIL
        && password === process.env.DEV_ADMIN_PASSWORD;
}

export const {handlers, auth, signIn, signOut} = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: {label: "Email", type: "email"},
                password: {label: "Password", type: "password"},
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                // TODO: 임시 - 개발용 admin/admin (DEV_ADMIN_LOGIN=true 일 때만, Vercel 포함). 정식 운영 전 제거
                const email = credentials.email as string;
                const password = credentials.password as string;
                if (isDevAdminCredentials(email, password)) {
                    return devAdminLogin();
                }
                return backendLogin(email, password);
            },
        }),
    ],

    callbacks: {
        async jwt({token, user}) {
            if (user) {
                token.accessToken = (user as { accessToken?: string }).accessToken;
            }
            return token;
        },
        async session({session, token}) {
            (session.user as { accessToken?: string }).accessToken =
                token.accessToken as string | undefined;
            return session;
        },
    },

    pages: {
        signIn: "/login",
    },

    secret: process.env.AUTH_SECRET,
});
