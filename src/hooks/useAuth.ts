"use client";

import {registerUser} from "@/lib/api/auth";
import type {RegisterRequest} from "@/types/auth";
import {useMutation} from "@tanstack/react-query";

/** 이메일 회원가입. 캐시할 데이터가 없어 무효화할 queryKey 도 없다 */
export function useRegister() {
    return useMutation({
        mutationFn: (data: RegisterRequest) => registerUser(data),
    });
}
