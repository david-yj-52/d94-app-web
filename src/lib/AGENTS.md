# L2 · lib (`src/lib/`)

> 계층: [L1 프로젝트](../../AGENTS.md) › **L2 lib**

| 폴더/파일 | 역할 | 상태 |
|---|---|---|
| `api/` | axios 기반 도메인별 HTTP 함수 (`client.ts` + 17개 도메인) | ✅ 표준 |
| `auth/` | **서버 전용** 인증 헬퍼. `accessToken.ts`의 `getBackendAccessToken(request)` — 세션 쿠키에서 백엔드 토큰을 꺼냄 ([ADR 0005](../../docs/decisions/0005-backend-token-server-only.md)). 클라이언트에서 import 금지 | ✅ 표준 |
| `crypto/` | 로그인·회원가입 자격 증명 암호화 (WebCrypto) | ✅ 표준 |
| `mock/` | 개발용 in-memory mock 백엔드 (`DEV_MOCK_API`) | ✅ 임시 |
| `messaging/solace/` | Solace WebSocket 설정·훅 | 🧪 Solace 실험 전용 |
| `api.ts` | 구 fetch 래퍼 (서버·클라이언트 겸용) | 🧪 todo 실험 전용, 새 코드에서 사용 금지 |

## 1. API 함수 (`api/{domain}.ts`)

- `apiClient`(`./client`)만 사용합니다. 경로는 `/v1/...`이고, 실제 요청은 `/api/proxy/v1/...`로 나갑니다.
- 반환값은 `res.data.data`이고, 반환 타입을 명시합니다. 함수 하나가 HTTP 호출 하나를 맡으며 캐싱이나 상태 관리는 하지 않습니다.
- `apiClient`는 401 응답을 받으면 `signOut({callbackUrl: "/login?reason=expired"})`을 **한 번만** 호출합니다(동시 401 여러 건 대비). `/login`은 `reason`을 보고 "로그인 정보가 만료되었거나 유효하지 않습니다" 안내를 띄웁니다. `/v1/auth/*`(로그인·회원가입) 요청의 401 은 제외합니다.
- `api/auth.ts`: 자격 증명은 **암호화해서만** 보냅니다 ([ADR 0004](../../docs/decisions/0004-credential-encryption.md)).
  - `getCredentialPublicKey()` → `GET /v1/auth/public-key` (`CredentialPublicKeyResponse`, 캐시하지 않음)
  - `registerUser(data)` → 공개키로 암호화해 `POST /v1/auth/register` 에 `{enc}` 전송
  - `loginWithCredentials({email, password})` → 암호화한 봉투를 `signIn("credentials", {enc})`로 보내고 성공 여부(boolean) 반환. admin/admin(`DEV_ADMIN`)이면 비밀번호 대신 `{devAdmin: "true"}`. 공개키 조회 실패는 throw. 백엔드 호출은 next-auth(`src/auth.ts`)가 서버에서 암호문 그대로 `${BACKEND_URL}/v1/auth/login`에 전달합니다.

## 1-1. 자격 증명 암호화 (`crypto/credential.ts`)

- 브라우저·Node·Edge 공용(WebCrypto만 사용). `encryptCredential(publicKey, purpose, fields)` → `EncryptedCredential` (`{v:1, alg:"RSA-OAEP-256+A256GCM", kid, key, iv, data}`).
- 평문에 `ts`(epoch ms)·`nonce`를 붙이고, AAD `d94-auth:v1:{login|register}`로 용도를 묶습니다. 형식은 d94-query `CredentialCryptoService`와 짝입니다. 바꾸면 양쪽을 같이 바꿔야 합니다.

```ts
import apiClient from "./client";
import type {MilestoneResponse} from "@/types/milestone";

export async function getMilestones(projectId: string): Promise<MilestoneResponse[]> {
    const res = await apiClient.get(`/v1/projects/${projectId}/milestones`);
    return res.data.data;
}
```

### 파일 업로드
`apiClient`의 기본 헤더가 `application/json`이므로, `FormData`를 보낼 때는 헤더를 **명시적으로 제거**해야 합니다. 그래야 axios가 boundary를 포함해 헤더를 다시 설정합니다.
```ts
await apiClient.post(url, formData, {headers: {"Content-Type": undefined as unknown as string}});
```
예시: `api/attachments.ts`(업로드 진행률 `onUploadProgress` 포함)

### 예외: `api/interfaceTests.ts`의 `callInterfaceTest`
통신 확인 화면 전용입니다. `res.data.data` 대신 `InterfaceCallResult`(상태·소요시간·`X-Trace-Id`·`Location`·본문)를 돌려주고, `validateStatus: () => true` 로 4xx·5xx 도 throw 하지 않습니다(따라서 401 에서도 `signOut` 하지 않음). 목록 조회 `getInterfaceTestItems` 는 표준 규칙을 따릅니다.

### 타입
`src/types/{domain}.ts`에 `XxxResponse`, `CreateXxxRequest`, `UpdateXxxRequest`로 정의합니다. 페이지네이션은 `PageResponse<T>`(`types/issue.ts`)를 사용합니다.

## 2. Mock 백엔드 (`mock/`)

`DEV_MOCK_API=true`이고 production이 아니면, `/api/proxy` 요청이 백엔드 대신 mock으로 처리됩니다.

- `data.ts`: 시드 데이터와 in-memory store(`getStore()`). dev 서버를 재시작하면 초기화됩니다.
- `router.ts`: `on(method, pattern, handler)`로 라우트를 등록합니다. `:param` 패턴을 지원합니다.

```ts
on("GET", "/v1/projects/:projectId/milestones", ({params}) =>
    ok(getStore().milestones.filter((m) => m.projectId === params.projectId)));
```

- **새 엔드포인트를 추가하면 mock 라우트도 함께 추가하세요.** 없으면 mock 모드에서 404가 납니다.
- 응답 헬퍼: `ok(data)` → `{success: true, data}`, `notFound(what)` → 404. 본문 없는 상태(`{status: 204}`)도 반환할 수 있습니다(프록시가 본문 없이 응답).
- 인터페이스 테스트 mock(`/v1/interface-tests`)은 백엔드와 같은 상태코드(201·204·400·404)를 돌려줍니다. 저장소는 `getStore().interfaceTests`.
- multipart 업로드는 `handleMockRequest`의 attachments 분기에서 특수 처리합니다.
- 인증 mock(`/v1/auth/public-key`·`login`·`register`)은 `credential.ts`의 실제 RSA 키(globalThis 보관, 재시작 시 새로 생성)로 봉투를 복호화합니다. 풀리지 않거나 평문이면 400 `AUTH_CREDENTIAL_INVALID`, 로그인은 비밀번호를 검사하지 않고 아무 계정이나 통과시킵니다. 핸들러는 `Promise<MockResult>`도 반환할 수 있습니다.
- `enabled.ts`의 `isMockEnabled`는 `src/auth.ts`(미들웨어 번들)가 라우터 전체를 끌어오지 않도록 분리해 둔 것입니다. `router.ts`도 같은 함수를 다시 export 합니다.

## 3. Solace (`messaging/solace/`) 🧪

- `solaceConfig.ts`: 접속 정보입니다. ⚠️ `ws://localhost:8008`, VPN `TSH`, admin/admin이 **하드코딩**되어 있습니다(env 미사용).
- `useSolace.ts`: 연결, 구독, 발행을 감싼 훅입니다. 반환값은 `{isConnected, isConnecting, messages, error, connect, publish, disconnect, clearMessages}`입니다. 사용처는 [solace 화면](../app/(main)/solace/AGENTS.md)입니다.

## 4. 백엔드 API 명세

- 백엔드 요청은 `BACKEND_URL` → **UMD(server) → Redis → UMD(local) → 로컬 백엔드** 로 갑니다. UMD 는 경로·본문을 바꾸지 않습니다 → [docs/architecture.md](../../docs/architecture.md)
- UI 쪽 통신 규칙(상태코드 처리, 재시도, 35초 타임아웃, 1MB 요청 / 5MB 응답 상한): [UMD ui-guide](https://github.com/david-yj-52/d94-app-umd/blob/main/docs/integration/ui-guide.md)
- 엔드포인트별 명세 위치는 아직 문서화되지 않았습니다. 백엔드 레포가 정해지면 여기에 링크를 추가하세요.
