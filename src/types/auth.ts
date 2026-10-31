export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
}

export interface RegisterRequest {
    email: string;
    name: string;
    password: string;
}

/** d94-query `GET /v1/auth/public-key`. publicKey 는 SPKI DER 의 base64 */
export interface CredentialPublicKeyResponse {
    kid: string;
    alg: string;
    publicKey: string;
}

/** 암호화된 자격 증명 봉투 (ADR 0004). 로그인·가입 본문은 `{enc: EncryptedCredential}` 하나다 */
export interface EncryptedCredential {
    v: 1;
    alg: string;
    kid: string;
    /** RSA-OAEP 로 감싼 AES-256 키 (base64) */
    key: string;
    /** AES-GCM IV 12바이트 (base64) */
    iv: string;
    /** AES-GCM 암호문+태그 (base64) */
    data: string;
}
