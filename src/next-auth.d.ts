import {DefaultSession, DefaultUser} from "next-auth";

declare module "next-auth" {
    interface User extends DefaultUser {
        accessToken?: string;
        refreshToken?: string;
    }

    // 브라우저로 나가는 세션. 백엔드 토큰은 넣지 않는다 (ADR 0005)
    interface Session {
        user: DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    // 암호화된 세션 쿠키 안에만 있는 값. 서버에서 lib/auth/accessToken 으로 읽는다
    interface JWT {
        accessToken?: string;
        /** 백엔드 토큰 만료 시각(ms). 지나면 refresh 하거나(refreshToken 있음) 세션을 끝낸다 */
        accessTokenExpiresAt?: number;
        /** 백엔드 refresh token (로그인 응답의 Set-Cookie 에서 꺼냄). 브라우저로 내리지 않는다 (ADR 0007) */
        refreshToken?: string;
        /** 로그인 시각(ms) — 절대 만료 기준 */
        loginAt?: number;
        /** 마지막 사용자 입력 시각(ms) — 유휴 만료 기준. 클라이언트 SessionActivity 가 갱신 요청 */
        lastActiveAt?: number;
    }
}
