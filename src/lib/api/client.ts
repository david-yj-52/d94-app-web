"use client";

import axios from "axios";
import {signOut} from "next-auth/react";

/** 401 로 로그아웃될 때 /login 이 사용자에게 보여 줄 안내 (LoginForm 의 LOGIN_NOTICES 키) */
export const SESSION_EXPIRED_REASON = "expired";

const apiClient = axios.create({
    baseURL: "/api/proxy",
    headers: {"Content-Type": "application/json"},
});

// 화면에서 동시에 나간 요청들이 모두 401 을 받아도 로그아웃은 한 번만
let signingOut = false;

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const url: string = error.config?.url ?? "";
        // 로그인·회원가입 자체의 401 은 "토큰 만료"가 아니므로 화면이 직접 처리한다
        const isAuthEndpoint = url.startsWith("/v1/auth/");
        if (error.response?.status === 401 && !isAuthEndpoint && !signingOut) {
            signingOut = true;
            await signOut({callbackUrl: `/login?reason=${SESSION_EXPIRED_REASON}`});
        }
        return Promise.reject(error);
    },
);

export default apiClient;
