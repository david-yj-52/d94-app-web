import apiClient from "./client";
import type {RegisterRequest} from "@/types/auth";

/** 이메일 회원가입. 성공 201, 이미 있는 이메일 400 (d94-query). 로그인은 next-auth(src/auth.ts)가 서버에서 처리한다 */
export async function registerUser(data: RegisterRequest): Promise<void> {
    await apiClient.post("/v1/auth/register", data);
}
