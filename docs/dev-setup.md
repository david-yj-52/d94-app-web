# 개발 환경

## 요구사항
- Node.js 20 이상 권장 (Next 16 요구사항), npm

## 시작하기

1. `npm install`
2. `.env.sample`을 `.env.local`로 복사하고 값을 채웁니다.
3. `npm run dev`를 실행하고 http://localhost:3000 에 접속합니다.

백엔드 없이 UI만 개발할 때는 `DEV_ADMIN_LOGIN=true`, `DEV_MOCK_API=true`로 두고 **admin / admin**으로 로그인합니다.

## 환경 변수

| 변수 | 사용처 | 설명 |
|---|---|---|
| `AUTH_SECRET` | next-auth | JWT 서명 시크릿. `npx auth secret`으로 생성 |
| `AUTH_TRUST_HOST` | next-auth | localhost 외 호스트에서 `next start`로 실행할 때 `true` |
| `DEV_ADMIN_LOGIN` | `src/auth.ts` | `true`면 백엔드 없이 admin/admin 로그인 허용 (production에서는 무시) |
| `DEV_MOCK_API` | `src/lib/mock/router.ts` | `true`면 `/api/proxy`가 mock으로 응답 (production에서는 무시) |
| `BACKEND_URL` | 프록시, 로그인 | 서버 사이드에서 쓰는 백엔드 주소 |
| `NEXT_PUBLIC_BACKEND_URL` | 알림 SSE | 브라우저가 직접 연결하는 백엔드 주소 |
| `NEXT_PUBLIC_LOCAL_URL` | `src/lib/agent-api-.ts` | 로컬 에이전트 주소 (기본 `http://127.0.0.1:8080`) |
| `SOLACE_USER_NAME`, `SOLACE_USER_PWD` | 미사용 | solaceConfig.ts가 값을 하드코딩하고 있어 실제로 쓰이지 않음 |

`.env.local`은 커밋하지 않습니다(`.gitignore`에 포함됨). 새 변수를 추가하면 `.env.sample`과 이 표를 함께 갱신하세요.

## 검증 명령

```bash
npx tsc --noEmit     # 타입 검사 (필수)
npm run docs:check   # 컨텍스트 문서 동기화 검사 (필수, AGENTS.md §10)
npm run build        # 프로덕션 빌드
```

`npm run lint`는 현재 동작하지 않습니다 → [known-issues.md](known-issues.md)

## 이미지 · 정적 파일

`public/`에 넣고 `/파일명`으로 참조합니다. `next/image`를 쓸 때는 `width`/`height`를 지정하세요. 외부 URL 이미지는 `next.config.mjs`의 `images.remotePatterns` 설정이 필요할 수 있습니다.
