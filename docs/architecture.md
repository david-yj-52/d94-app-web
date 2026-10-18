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
   │  · DEV_MOCK_API=true 이면 src/lib/mock/router.ts 로 응답
   ▼
[Backend]  ${BACKEND_URL}/v1/...   →  { success, data }
```

- 401 응답을 받으면 axios 인터셉터가 `signOut({callbackUrl: "/login"})`을 호출합니다 (`src/lib/api/client.ts`).
- QueryClient 기본값은 `staleTime` 30초, `retry` 1입니다 (`src/components/Providers.tsx`).
- 알림은 브라우저가 `NEXT_PUBLIC_BACKEND_URL`에 SSE로 직접 연결합니다 (`src/hooks/useNotifications.ts`).

## 인증

| 파일 | 역할 |
|---|---|
| `src/auth.ts` | next-auth v5 설정. Credentials provider가 `POST ${BACKEND_URL}/v1/auth/login`을 호출하고, 받은 `accessToken`을 JWT에 저장 |
| `src/next-auth.d.ts` | `session.user.accessToken` 타입 확장 |
| `src/app/api/auth/[...nextauth]/` | next-auth 라우트 핸들러 |
| `src/middleware.ts` | 로그인 여부에 따른 리다이렉트 |

`src/middleware.ts` 규칙:
- **보호 경로** (`PROTECTED_PREFIXES`): `/projects`, `/issues`, `/board`, `/dashboard`, `/search`, `/notifications`. 비로그인 상태면 `/login`으로 보냅니다.
- **비로그인 전용** (`PUBLIC_ONLY`): `/login`, `/register`. 로그인 상태면 `/projects`로 보냅니다.
- 정적 확장자(png, svg, css, js 등)는 통과시킵니다. `public/` 이미지가 리다이렉트되지 않게 하기 위함입니다.
- `/home`, `/mpms`, `/solace`, `/todo`는 보호되지 않습니다.

## 라우트 구조

- `src/app/(auth)/`: 로그인 화면 계열(`login`, `register`, `cira/register`)
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
| 프록시 | `src/app/api/proxy/[...path]/route.ts` | 토큰 주입, 백엔드 전달, mock 분기 | 도메인 로직 |

## 배포

Vercel 배포를 전제로 합니다(`vercel.json` 없음). HTTPS로 배포된 사이트에서 로컬 HTTP 에이전트를 호출할 때 생기는 mixed-content 문제는 [LOCAL_AGENT_HTTPS_GUIDE.md](../LOCAL_AGENT_HTTPS_GUIDE.md)를 참고하세요.
