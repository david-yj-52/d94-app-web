// TODO: 임시 - mock 모드의 자격 증명 암호화 키 (ADR 0004). d94-query CredentialCryptoService 의 복호화를 흉내 낸다

import {CREDENTIAL_ALG, credentialAad, type CredentialPurpose, fromBase64, toBase64} from "@/lib/crypto/credential";
import type {CredentialPublicKeyResponse, EncryptedCredential} from "@/types/auth";

const MOCK_KID = "mock";

// dev 서버 HMR·라우트 번들 간에도 같은 키를 쓰도록 globalThis 에 보관
const g = globalThis as unknown as { __mockCredentialKey?: Promise<CryptoKeyPair> };

function keyPair(): Promise<CryptoKeyPair> {
    g.__mockCredentialKey ??= globalThis.crypto.subtle.generateKey(
        {name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256"},
        true,
        ["encrypt", "decrypt"],
    );
    return g.__mockCredentialKey;
}

export async function mockCredentialPublicKey(): Promise<CredentialPublicKeyResponse> {
    const spki = await globalThis.crypto.subtle.exportKey("spki", (await keyPair()).publicKey);
    return {kid: MOCK_KID, alg: CREDENTIAL_ALG, publicKey: toBase64(spki)};
}

/** 봉투를 풀어 평문 필드를 돌려준다. 형식·키·용도가 맞지 않으면 null */
export async function mockDecryptCredential(
    enc: EncryptedCredential | undefined,
    purpose: CredentialPurpose,
): Promise<Record<string, string> | null> {
    if (!enc || enc.kid !== MOCK_KID) return null;
    try {
        const {subtle} = globalThis.crypto;
        const rawKey = await subtle.decrypt({name: "RSA-OAEP"}, (await keyPair()).privateKey, fromBase64(enc.key));
        const aesKey = await subtle.importKey("raw", rawKey, "AES-GCM", false, ["decrypt"]);
        const plain = await subtle.decrypt(
            {name: "AES-GCM", iv: fromBase64(enc.iv), additionalData: credentialAad(purpose)}, aesKey, fromBase64(enc.data),
        );
        return JSON.parse(new TextDecoder().decode(plain));
    } catch {
        return null;
    }
}
