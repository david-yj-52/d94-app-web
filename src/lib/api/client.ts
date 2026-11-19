"use client";

import axios, {type InternalAxiosRequestConfig} from "axios";

import {refreshSession, requestReauth} from "./session";

const apiClient = axios.create({
    baseURL: "/api/proxy",
    headers: {"Content-Type": "application/json"},
    // 배열은 status=a&status=b — Spring List<String> 바인딩 형식 (axios 기본 status[]=a)
    paramsSerializer: {indexes: null},
});

type RetriableConfig = InternalAxiosRequestConfig & { _sessionRetried?: boolean };

// 401 → 세션 refresh 후 한 번 재시도 → 그래도 안 되면(유휴·절대 만료) 화면을 떠나지 않고 재로그인 모달.
// 로그인하면 기다리던 요청을 다시 보낸다 → 작성 중이던 화면 상태가 그대로 남는다 (ADR 0007)
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config as RetriableConfig | undefined;
        // 로그인·회원가입 자체의 401 은 "토큰 만료"가 아니므로 화면이 직접 처리한다
        const isAuthEndpoint = (config?.url ?? "").startsWith("/v1/auth/");
        if (error.response?.status === 401 && config && !isAuthEndpoint && !config._sessionRetried) {
            config._sessionRetried = true;
            if ((await refreshSession()) || (await requestReauth())) return apiClient(config);
        }
        return Promise.reject(error);
    },
);

export default apiClient;
