# 아키텍처

## 개요

web-plate는 UI 학습과 웹 기능 실험장입니다. Next.js 16 App Router 단일 앱 안에 여러 실험 모듈([modules.md](modules.md))이 함께 있습니다.
아래 요청 흐름은 가장 큰 모듈인 **CIRA**의 표준 구조입니다. 비즈니스 데이터는 별도 백엔드(`BACKEND_URL`)에 있습니다.
브라우저는 백엔드를 직접 호출하지 않고 **Next 서버의 프록시 라우트**를 거칩니다. 예외는 알림 SSE입니다.
다른 모듈(todo의 Server Actions, Solace의 WebSocket)은 각자의 방식을 실험합니다.

## 요청 흐름

```
[Client Component]
   │  useIssues(projectId)                    src/hooks/useIssues.ts
   ▼
[lib/api/issues.ts]  apiClient.get("/v1/...") src/lib/api/client.ts (baseURL: /api/proxy)
   ▼
[/api/proxy/[...path]]                        src/app/api/proxy/[...path]/route.ts
   │  · auth()로 세션 조회 → Authorization: Bearer {accessToken} 주입
   │  · 메서드(GET/HEAD/POST/PUT/PATCH/DELETE)·쿼리·본문을 그대로 전달, 응답 상태·헤더·본문을 그대로 반환
   │  · DEV_MOCK_API=true 이면 src/lib/mock/router.ts 로 응답
   ▼
[UMD server]  ${BACKEND_URL}/v1/...  (AP-01 :8081, JWT 사전 확인)
   │  Redis Stream ↔ UMD local (Home PC) — 경로·헤더·본문·상태를 그대로 전달
   ▼
[Backend]  /v1/...   →  { success, data }
```

- **`BACKEND_URL`은 현재 UMD(server) 주소입니다.** UMD 는 투명 프록시라서 백엔드를 서버에 직접 올리면 `BACKEND_URL`만 백엔드 주소로 바꾸면 됩니다.
- UMD 자체 오류는 HTTP 상태(401/413/502/503/504)와 진단용 `X-Umd-Error` 헤더로 옵니다. UI 는 상태코드로 처리하고 `X-Umd-Error`에 의존하지 않습니다.
- 통신 규칙(상태코드별 처리, 재시도, 타임아웃, 프록시 라우트 정비 사항): [UMD ui-guide](https://github.com/david-yj-52/d94-app-umd/blob/main/docs/integration/ui-guide.md)

### 프록시 라우트 동작 (`src/app/api/proxy/[...path]/route.ts`)

UMD ui-guide §5 정비안을 따른 투명 프록시입니다.

| 항목 | 동작 |
|---|---|
| 메서드 | `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE` |
| 요청 헤더 | `accept`, `accept-language`, `content-type`, `if-none-match`, `if-modified-since`, `idempotency-key`, `x-forwarded-for` 전달 + 세션 토큰으로 `authorization` |
| 요청 본문 | 원본 스트림 그대로 (`duplex: "half"`) |
| 응답 | 상태·헤더(`X-Trace-Id`, `Location` 등)·본문 그대로. hop-by-hop·`content-length`·`content-encoding` 은 제거. 204·205·304·HEAD 는 본문 없음 |
| 타임아웃 | 35초 (`AbortSignal.timeout`) → 504. 연결 실패 → 502 |
| mock | `DEV_MOCK_API=true` 이면 mock 결과를 반환 (204 등 본문 없는 상태 지원) |

- 백엔드 오류 응답(4xx·5xx)도 상태와 본문을 바꾸지 않고 그대로 전달합니다.
- **로그인도 `BACKEND_URL`(UMD) 을 거칩니다.** UMD(server)는 토큰 없는 요청을 401 로 막으므로, UMD 의 `umd.server.public-paths` 에 로그인 경로(예 `/tsh/api/v1/auth/**`)가 있어야 로그인할 수 있습니다.

- 401 응답을 받으면 axios 인터셉터가 `signOut({callbackUrl: "/login?reason=expired"})`을 한 번만 호출하고, 로그인 화면이 "로그인 정보가 만료되었거나 유효하지 않습니다" 안내를 띄웁니다 (`src/lib/api/client.ts`, `LoginForm`). `/v1/auth/*` 요청의 401 은 제외(화면이 직접 처리).
- QueryClient 기본값은 `staleTime` 30초, `retry` 1입니다 (`src/components/Providers.tsx`).
- 알림은 브라우저가 `NEXT_PUBLIC_BACKEND_URL`에 SSE로 직접 연결합니다 (`src/hooks/useNotifications.ts`).

## 인증

| 파일 | 역할 |
|---|---|
| `src/auth.ts` | next-auth v5 설정. Credentials provider가 `POST ${BACKEND_URL}/v1/auth/login`을 호출하고, 받은 `accessToken`을 JWT에 저장. 응답에 `user` 가 없으면(d94-query) 표시 이름은 이메일. `DEV_ADMIN_LOGIN=true` 일 때 admin/admin 은 `DEV_ADMIN_EMAIL`·`DEV_ADMIN_PASSWORD` 실제 계정으로 로그인(없으면 1회 가입 후 로그인), 둘 다 없으면 가짜 토큰(mock 전용) |
| `src/next-auth.d.ts` | `session.user.accessToken` 타입 확장 |
| `src/app/api/auth/[...nextauth]/` | next-auth 라우트 핸들러 |
| `src/middleware.ts` | 로그인 여부에 따른 리다이렉트 |

`src/middleware.ts` 규칙:
- **보호 경로** (`PROTECTED_PREFIXES`): `/projects`, `/issues`, `/board`, `/dashboard`, `/search`, `/notifications`, `/interface-test`. 비로그인 상태면 `/login`으로 보냅니다.
- **비로그인 전용** (`PUBLIC_ONLY`): `/login`, `/register`. 로그인 상태면 `/home`으로 보냅니다.
- 정적 확장자(png, svg, css, js 등)는 통과시킵니다. `public/` 이미지가 리다이렉트되지 않게 하기 위함입니다.
- `/home`, `/mpms`, `/solace`, `/todo`는 보호되지 않습니다.

## 라우트 구조

- `src/app/(auth)/`: 로그인 화면 계열(`login`, `register` 이메일 회원가입, `cira/register` → `/register` redirect)
- `src/app/(main)/`: 공통 레이아웃(헤더·사이드바)이 적용되는 서비스 화면
  - `projects/[projectId]/` 아래:
    - `issues/[issueId]`
    - `boards/[boardId]`
    - `sprints`
    - `reports/{burndown,cfd,velocity}`
    - `settings/{automation,git,members,workflow}`
    - `versions`
    - `wiki`
  - `dashboard`, `home`, `notifications`, `search`, `search/advanced`(CQL)
  - `interface-test` (통신 확인용 실험 화면)
- `src/app/page.tsx`, `src/app/actions.ts`: todo 실험 모듈 ([modules.md](modules.md))
- 화면별 상세는 [src/app/AGENTS.md](../src/app/AGENTS.md)의 화면 목록(L3)을 보세요.

## 레이어별 책임

| 레이어 | 위치 | 책임 | 하지 않는 것 |
|---|---|---|---|
| 페이지 | `src/app/**/page.tsx` | 라우트 파라미터 해석, 컴포넌트 조립 | API 직접 호출, 큰 비즈니스 로직 |
| 컴포넌트 | `src/components/{domain}/` | UI, 로컬 상태, 훅 호출 | HTTP 호출 |
| 훅 | `src/hooks/use{Domain}.ts` | queryKey, 캐시 무효화, 로딩·에러 상태 | UI |
| API 함수 | `src/lib/api/{domain}.ts` | HTTP 호출 1회 + `res.data.data` 반환 | 캐싱, 상태 |
| 타입 | `src/types/{domain}.ts` | 백엔드 DTO 타입 | 로직 |
| 프록시 | `src/app/api/proxy/[...path]/route.ts` | 토큰 주입, 요청·응답 그대로 전달, 타임아웃(504)·연결 실패(502), mock 분기 | 도메인 로직, 응답 가공 |

## 배포

Vercel 배포를 전제로 합니다. [vercel.json](../vercel.json)의 `git.deploymentEnabled`로 **`deploy` 브랜치만 자동 배포**하고, 다른 브랜치는 push해도 배포하지 않습니다. Production 브랜치는 Vercel 대시보드(Settings → Environments → Production → Branch Tracking)에서 `deploy`로 지정해야 합니다. HTTPS로 배포된 사이트에서 로컬 HTTP 에이전트를 호출할 때 생기는 mixed-content 문제는 [LOCAL_AGENT_HTTPS_GUIDE.md](../LOCAL_AGENT_HTTPS_GUIDE.md)를 참고하세요.
