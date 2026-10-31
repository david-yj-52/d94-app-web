# ADR 0005: 백엔드 accessToken 은 서버에만 둔다

- 상태: 채택
- 날짜: 2026-10-31
- 관련 저장소: d94-web

## 배경 (분석 결과)

| 항목 | 기존 동작 |
|---|---|
| 세션 응답 | `session` 콜백이 `session.user.accessToken`에 백엔드 JWT 를 넣음 → `GET /api/auth/session` 응답에 그대로 노출. 페이지의 JavaScript 가 읽을 수 있어 XSS 한 번이면 토큰 탈취 |
| 토큰을 내린 이유 | 알림 SSE 하나. `EventSource`는 헤더를 못 붙여 `?token=` 쿼리로 `NEXT_PUBLIC_BACKEND_URL`에 직접 연결 (URL 이라 접근 로그에도 남음) |
| SSE 실제 동작 | 동작하지 않음. 백엔드 `JwtAuthenticationFilter`(lib-core)는 `Authorization` 헤더만 읽고 `?token=`은 무시. 백엔드는 UMD 뒤에 있고 UMD 는 SSE·스트리밍을 지원하지 않음 |
| 나머지 API | 이미 `/api/proxy`가 서버에서 `Authorization`을 붙임 → 브라우저가 토큰을 알 필요 없음 |
| 만료 | 백엔드 토큰 15분, next-auth 세션 30일 → 화면은 로그인 상태인데 API 는 401/403 |

## 결정

1. **세션 응답에는 표시용 정보(`name`, `email`)만 담는다.** `accessToken`은 next-auth 의 암호화된 세션 쿠키(JWE, httpOnly) 안에만 둔다.
2. **서버에서만 꺼낸다.** `src/lib/auth/accessToken.ts`의 `getBackendAccessToken(request)`가 `getToken()`으로 쿠키를 풀어 반환한다. 쿠키 이름은 https(`__Secure-`)·http 둘 다 시도하고, `Authorization: Bearer` 헤더 경로는 쓰지 않도록 쿠키만 넘긴다. `/api/proxy`가 이 함수를 쓴다.
3. **백엔드 토큰이 만료되면 세션도 끝낸다.** `jwt` 콜백이 로그인 때 토큰의 `exp`를 `accessTokenExpiresAt`에 저장하고, 지나면 `null`을 돌려 세션 쿠키를 지운다. `exp`가 없는 토큰(mock)은 세션 만료에 맡긴다.
4. **알림은 SSE 대신 폴링한다.** `useNotifications`가 `/api/proxy/v1/notifications`를 30초마다 조회해 처음 보는 안 읽은 알림만 토스트로 띄운다. `NEXT_PUBLIC_BACKEND_URL`은 더 쓰지 않는다.

## 대안

| 대안 | 채택하지 않은 이유 |
|---|---|
| Next 서버에 SSE 중계 라우트 | 백엔드까지 UMD 를 거쳐야 하는데 UMD 가 스트리밍 미지원. Vercel 함수 실행 시간 제한도 있음 |
| 백엔드가 1회용 SSE 티켓 발급 | d94-query·lib-core 수정 필요, 그래도 UMD 구간 스트리밍 문제는 남음 |
| 토큰을 그대로 두고 CSP 강화 | XSS 피해를 줄일 뿐 노출 자체는 그대로 |

## 결과

- 브라우저(DevTools, JavaScript)에서 백엔드 토큰을 볼 수 없다. 토큰이 실리는 구간은 Next 서버 → UMD → 백엔드뿐이다.
- 알림 토스트는 최대 30초 늦게 뜬다. 화면이 숨겨져 있으면 폴링을 멈춘다.
- 백엔드 토큰 만료(15분) 뒤에는 다음 요청에서 로그인 화면으로 간다. 리프레시 토큰은 아직 없다(백엔드 지원 필요).
- 새 서버 코드에서 백엔드를 부를 때는 `getBackendAccessToken`을 쓴다. 클라이언트 컴포넌트에서 import 하지 않는다.
