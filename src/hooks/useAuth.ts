"use client";

import {loginWithCredentials, registerUser} from "@/lib/api/auth";
import type {LoginRequest, RegisterRequest} from "@/types/auth";
import {useMutation} from "@tanstack/react-query";

/** 이메일 회원가입 (본문 암호화). 캐시할 데이터가 없어 무효화할 queryKey 도 없다 */
export function useRegister() {
    return useMutation({
        mutationFn: (data: RegisterRequest) => registerUser(data),
    });
}

/** 암호화 로그인. 결과 true/false = 자격 증명 일치 여부, 연결 실패는 error */
export function useLogin() {
    return useMutation({
        mutationFn: (data: LoginRequest) => loginWithCredentials(data),
    });
}
