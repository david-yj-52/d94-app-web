# ADR 0004: 로그인·회원가입 자격 증명 종단 암호화

- 상태: 채택
- 날짜: 2026-10-25
- 관련 저장소: d94-web, d94-query (브랜치 `feat/credential-encryption`)

## 배경 (분석 결과)

| 구간 | 기존 동작 |
|---|---|
| 브라우저 → d94-web | `signIn("credentials")`가 `/api/auth/callback/credentials`에 `email`·`password`를 **평문 폼**으로 보냄. 회원가입은 `/api/proxy/v1/auth/register`에 **평문 JSON**. DevTools 네트워크 탭에 그대로 보임 |
| d94-web → UMD(server) → Redis Stream → UMD(local) → d94-query | `src/auth.ts`가 `{email, password}` 평문 JSON 을 그대로 전달. 중간 구간(UMD·Redis)에도 평문이 남음 |
| d94-query 저장·검증 | lib-core `AuthService.register`가 `BCryptPasswordEncoder(12)`로 해시해 `GS_USER.PWD_HASH`에 저장. 로그인은 `DaoAuthenticationProvider`가 BCrypt 로 비교. **저장은 이미 해시** |
| 회원가입 | d94-web `/register` 화면, d94-query `POST /api/v1/auth/register` 모두 이미 있음 |

→ 해결할 문제는 **전송 구간 평문**입니다. 저장 방식(BCrypt)은 그대로 둡니다.

## 결정

1. **하이브리드 암호화 (RSA-OAEP-256 + AES-256-GCM)**
   - d94-query 가 RSA-2048 키쌍을 갖고 `GET /api/v1/auth/public-key`로 공개키(SPKI, base64)와 `kid`를 줍니다.
   - **브라우저**가 WebCrypto 로 직접 암호화합니다. 일회용 AES 키로 `{email, password, name?, ts, nonce}`를 GCM 암호화하고, AES 키는 RSA-OAEP(SHA-256, MGF1-SHA256)로 감쌉니다.
   - AAD 는 `d94-auth:v1:{login|register}` → 로그인 암호문을 가입에, 가입 암호문을 로그인에 쓸 수 없습니다.
   - 요청 본문은 `{"enc": {"v":1, "alg":"RSA-OAEP-256+A256GCM", "kid", "key", "iv", "data"}}` 하나입니다.
2. **d94-web 은 복호화하지 않습니다.** next-auth `authorize`·`/api/proxy`는 암호문을 그대로 전달만 합니다(UMD·Redis 구간도 암호문).
3. **d94-query 복호화**: `RequestBodyAdvice`가 `LoginRequest`·`RegisterRequest` 본문을 읽기 전에 봉투를 풀어 평문 JSON 으로 바꿉니다. lib-core(`BaseAuthController`, `AuthService`)는 수정하지 않습니다.
4. **재전송 방지**: `ts`가 ±5분(`max-age-seconds`)을 벗어나거나 이미 쓴 `nonce`면 400 `AUTH_CREDENTIAL_INVALID`.
5. **키는 환경 변수**: `AUTH_CREDENTIAL_PRIVATE_KEY`(PKCS#8, PEM 또는 base64 DER). 비어 있으면 기동 시 임시 키를 만들고 경고를 남깁니다(재기동하면 바뀜 — 브라우저가 매번 공개키를 받으므로 동작은 함). 운영은 반드시 설정합니다.
6. **평문 허용 스위치**: `AUTH_CREDENTIAL_ALLOW_PLAINTEXT`(기본 `false`). 웹·백엔드 배포 순서가 어긋날 때만 잠깐 켭니다.
7. **개발용 admin**: 브라우저는 `admin/admin` 입력 시 비밀번호 대신 `devAdmin` 표시만 보냅니다. 서버(`src/auth.ts`)가 `DEV_ADMIN_EMAIL`·`DEV_ADMIN_PASSWORD`를 **서버에서** 같은 방식으로 암호화해 백엔드에 보냅니다.

## 기존 계정 처리

- 모든 가입 경로가 `AuthService.register` → BCrypt 이고, Flyway 마이그레이션에 `GS_USER` 시드(INSERT)가 없습니다 → **DB 마이그레이션 불필요**, 기존 계정은 그대로 로그인됩니다.
- 수동으로 넣은 평문 행이 있는지는 아래 **읽기 전용** 쿼리로 확인합니다. 0 이 아니면 해당 계정은 로그인이 원래부터 안 되므로, 비밀번호 재설정(재가입)으로 처리합니다. 자동 변환·삭제는 하지 않습니다.

```sql
SELECT COUNT(*) FROM GS_USER WHERE PWD_HASH IS NULL OR PWD_HASH !~ '^\$2[aby]\$[0-9]{2}\$.{53}$';
```

## 범위 밖 (후속 후보)

- HTTPS 는 별도 전제(Vercel 은 HTTPS). 이 암호화는 TLS 를 대체하지 않고, TLS 종료 지점 이후(Next 서버 로그, UMD, Redis)와 브라우저 DevTools 노출을 줄입니다.
- 비밀번호 변경·재설정 API, 로그인 실패 횟수 제한, refresh 쿠키 `Secure` 플래그(lib-core) — 후속 작업 후보.
- 다중 인스턴스 배포 시 nonce 저장소를 Redis 로 옮겨야 함(현재 인메모리).
