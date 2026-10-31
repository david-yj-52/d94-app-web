import {DefaultSession, DefaultUser} from "next-auth";

declare module "next-auth" {
    interface User extends DefaultUser {
        accessToken?: string;
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
        /** 백엔드 토큰 만료 시각(ms). 지나면 jwt 콜백이 세션을 끝낸다 */
        accessTokenExpiresAt?: number;
    }
}
