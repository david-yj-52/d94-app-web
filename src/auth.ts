import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API_BASE_URL = process.env.BACKEND_URL;

export const {handlers, auth, signIn, signOut} = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: {label: "Email", type: "email"},
                password: {label: "Password", type: "password"},
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                // TODO: 임시 - 백엔드 미기동 시 admin/admin 로그인 허용 (DEV_ADMIN_LOGIN=true 일 때만, Vercel 포함. 백엔드 복구 후 제거)
                if (
                    process.env.DEV_ADMIN_LOGIN === "true" &&
                    credentials.email === "admin" &&
                    credentials.password === "admin"
                ) {
                    return {
                        id: "admin",
                        email: "admin",
                        name: "Admin",
                        accessToken: "dev-admin-token",
                    };
                }
                try {
                    const res = await fetch(`${API_BASE_URL}/v1/auth/login`, {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });
                    if (!res.ok) return null;
                    const json = await res.json();
                    if (!json.success) return null;
                    const data = json.data;
                    return {
                        id: credentials.email as string,
                        email: credentials.email as string,
                        // d94-query 로그인 응답에는 user 가 없다 (accessToken·tokenType·expiresIn 만) → 이메일로 대체
                        name: (data.user?.name ?? credentials.email) as string,
                        accessToken: data.accessToken,
                    };
                } catch {
                    return null;
                }
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
