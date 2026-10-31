// 로그인·회원가입 자격 증명 암호화 (ADR 0004). 브라우저·Node·Edge 공용 — WebCrypto(globalThis.crypto.subtle)만 사용한다
// 형식은 d94-query CredentialCryptoService 와 맞춘다: RSA-OAEP(SHA-256, MGF1-SHA256) 로 감싼 AES-256-GCM 키

import type {CredentialPublicKeyResponse, EncryptedCredential} from "@/types/auth";

export type CredentialPurpose = "login" | "register";

export const CREDENTIAL_ALG = "RSA-OAEP-256+A256GCM";

const encoder = new TextEncoder();

/** 로그인 암호문을 가입에(또는 그 반대로) 쓰지 못하게 용도를 GCM AAD 로 묶는다 */
export const credentialAad = (purpose: CredentialPurpose) => encoder.encode(`d94-auth:v1:${purpose}`);

export function toBase64(bytes: ArrayBuffer | Uint8Array): string {
    const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let binary = "";
    view.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
}

export function fromBase64(value: string): Uint8Array<ArrayBuffer> {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

/**
 * `fields`(email·password·name)에 ts·nonce 를 붙여 암호화한다. 평문은 이 함수 밖으로 나가지 않는다.
 * 백엔드는 ts 가 허용 범위를 벗어나거나 nonce 가 재사용되면 거절한다.
 */
export async function encryptCredential(
    publicKey: CredentialPublicKeyResponse,
    purpose: CredentialPurpose,
    fields: Record<string, string>,
): Promise<EncryptedCredential> {
    const {subtle} = globalThis.crypto;
    const rsaKey = await subtle.importKey(
        "spki", fromBase64(publicKey.publicKey), {name: "RSA-OAEP", hash: "SHA-256"}, false, ["encrypt"],
    );
    const aesKey = await subtle.generateKey({name: "AES-GCM", length: 256}, true, ["encrypt"]);
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const nonce = toBase64(globalThis.crypto.getRandomValues(new Uint8Array(16)));

    const plaintext = encoder.encode(JSON.stringify({...fields, ts: Date.now(), nonce}));
    const data = await subtle.encrypt({name: "AES-GCM", iv, additionalData: credentialAad(purpose)}, aesKey, plaintext);
    const key = await subtle.encrypt({name: "RSA-OAEP"}, rsaKey, await subtle.exportKey("raw", aesKey));

    return {v: 1, alg: CREDENTIAL_ALG, kid: publicKey.kid, key: toBase64(key), iv: toBase64(iv), data: toBase64(data)};
}
