import {signIn} from "next-auth/react";

import apiClient from "./client";
import {encryptCredential} from "@/lib/crypto/credential";
import type {CredentialPublicKeyResponse, LoginRequest, RegisterRequest} from "@/types/auth";

/** 개발용 admin/admin 로그인 (DEV_ADMIN_LOGIN=true). 비밀번호 대신 표시만 보내고 서버(src/auth.ts)가 실제 계정으로 바꾼다 */
export const DEV_ADMIN = "admin";

/** 자격 증명 암호화용 공개키. 키가 바뀔 수 있어 캐시하지 않는다 */
export async function getCredentialPublicKey(): Promise<CredentialPublicKeyResponse> {
    const res = await apiClient.get("/v1/auth/public-key");
    return res.data.data;
}

/** 이메일 회원가입. 본문은 암호화해 보낸다. 성공 201, 이미 있는 이메일 400 (d94-query) */
export async function registerUser(data: RegisterRequest): Promise<void> {
    const enc = await encryptCredential(await getCredentialPublicKey(), "register", {...data});
    await apiClient.post("/v1/auth/register", {enc});
}

/**
 * next-auth Credentials 로그인. 브라우저에서 암호화한 봉투만 `/api/auth/callback/credentials` 로 나간다.
 * 자격 증명이 틀리면 false, 공개키를 못 받으면(서버 연결 실패) throw.
 */
export async function loginWithCredentials({email, password}: LoginRequest): Promise<boolean> {
    const credentials = email === DEV_ADMIN && password === DEV_ADMIN
        ? {devAdmin: "true"}
        : {enc: JSON.stringify(await encryptCredential(await getCredentialPublicKey(), "login", {email, password}))};
    const result = await signIn("credentials", {...credentials, redirect: false});
    return !result?.error;
}
