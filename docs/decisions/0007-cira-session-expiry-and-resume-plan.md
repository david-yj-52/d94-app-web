# ADR 0007: 세션 refresh · 유휴 만료 · 화면을 떠나지 않는 재로그인

- 상태: 채택 (구현)
- 날짜: 2026-11-18
- 관련 저장소: d94-web (d94-query·lib-core 는 변경 없음)
- 이전 결정: [ADR 0005](0005-backend-token-server-only.md)의 "백엔드 토큰 만료 = 세션 종료"를 대체

## 배경 (분석 결과)

| 항목 | 기존 동작 |
|---|---|
| 세션 수명 | 백엔드 accessToken(15분)이 만료되면 `jwt` 콜백이 세션을 끝냄 → 작업 중이어도 15분마다 로그아웃 |
| 401 처리 | `apiClient` 가 `signOut` → `/login` 으로 이동 → 작성 중이던 화면 상태(React 메모리)가 사라짐 |
| 복귀 | 로그인 뒤 항상 `/home`. 미들웨어도 `callbackUrl` 없이 `/login` 으로 보냄 |
| 백엔드 refresh | **이미 있음**. lib-core `BaseAuthController` `POST /v1/auth/refresh`(회전, Redis 7일)·`/logout`(폐기). refreshToken 은 로그인 응답 `Set-Cookie`(httpOnly)로만 오는데 web 이 버리고 있었음 |
| 쿠키 덮어쓰기 | next-auth `auth()` 미들웨어 래퍼는 **요청마다** 세션 쿠키를 다시 씀 → refresh 로 회전한 쿠키를, 먼저 출발한 요청의 응답이 옛 refreshToken 으로 덮을 수 있음 |

## 결정

1. **refreshToken 도 서버에만 둔다.** `backendLogin` 이 로그인 응답 `Set-Cookie` 에서 `refreshToken` 을 꺼내 next-auth JWE 쿠키 안에 넣는다. 백엔드 호출 때는 `Cookie: refreshToken=…` 헤더로 보낸다. 브라우저 세션 응답에는 여전히 표시용 정보만 있다(ADR 0005 유지).
2. **refresh 는 세션 update(`POST /api/auth/session`) 한 곳에서만 한다.** `jwt` 콜백이 `trigger === "update"` 이고 accessToken 만료 2분 전(`REFRESH_BEFORE_MS`)이 지났을 때 백엔드 refresh 로 회전한다. 클라이언트(`lib/api/session.ts` `refreshSession`)는 탭 안에서 한 번에 하나만 보낸다.
3. **세션 쿠키를 쓰는 곳을 줄인다.** 미들웨어는 `auth()` 래퍼 대신 `readSessionToken`(읽기만)으로 판정한다. `SessionProvider refetchOnWindowFocus={false}`.
4. **유휴·절대 만료는 JWE 안의 시각으로 판단한다** (`lib/auth/sessionPolicy.ts`). `lastActiveAt`·`loginAt` 은 `AUTH_SECRET` 으로 암호화·서명돼 위조할 수 없으므로 서버 저장소가 필요 없다. 유휴 30분(`IDLE_TIMEOUT_MS`), 절대 12시간(`MAX_SESSION_MS`, 쿠키 maxAge 도 같음).
5. **활동 = 사용자 입력.** `SessionActivity` 가 `pointerdown`·`keydown` 이 있으면 1분에 한 번 `update({active: true})` 를 보낸다. 폴링·401 재시도는 활동이 아니다 → 자리를 비우면 30분 뒤 세션이 끝난다. 활동 중에는 이 신호가 accessToken 을 미리 회전시킨다.
6. **401 → refresh 후 재시도 → 그래도 안 되면 그 자리에서 재로그인.** `apiClient` 가 `refreshSession()` 뒤 원래 요청을 한 번 다시 보낸다. 실패(유휴·절대 만료, refresh 실패)면 `ReauthModal` 을 띄우고 요청은 기다린다. 로그인하면 기다리던 요청을 다시 보낸다 — 페이지를 떠나지 않으므로 입력 중이던 내용이 남는다. 다른 계정으로 로그인하면 `/home` 으로 새로 연다. 모달을 닫으면 요청만 실패하고 화면은 그대로다.
7. **프록시는 accessToken 이 만료된 세션이면 백엔드에 보내지 않고 401** 을 준다. 토큰 없이 보내면 d94-query 는 403 을 줘서 재시도가 일어나지 않는다.
8. **원래 경로 복귀.** 미들웨어가 `/login?callbackUrl={경로+쿼리}` 로 보내고(세션 쿠키가 남아 있었으면 `reason=expired` 도), `LoginForm`·`/login` 이 `safeCallbackUrl`(같은 origin 의 내부 경로만, `/login`·`/register` 제외)로 검증한 경로로 이동한다.
9. **로그아웃하면 백엔드 refreshToken 도 폐기**한다 (`events.signOut` → `POST /v1/auth/logout`).

## 하지 않은 것 (계획에서 뺌)

| 항목 | 이유 |
|---|---|
| 백엔드 refresh API 추가 | 이미 있음 |
| 서버의 마지막 활동 저장소(Redis 등) | JWE 안의 `lastActiveAt` 으로 충분 (위조 불가) |
| `BroadcastChannel` 탭 동기화 | 세션 쿠키를 모든 탭이 공유 — 활동·로그아웃이 그대로 반영됨 |
| 화면별 초안 저장(storage) | 재로그인 모달이 모든 화면의 메모리 상태를 그대로 둔다. **탭을 닫거나 새로고침한 뒤에도** 복원해야 한다는 요구가 생기면 그때 |
| 만료 직전 경고 모달 | 만료돼도 모달로 이어서 작업할 수 있어 우선순위 낮음 |
| `#해시` 보존(미들웨어 경로) | 해시는 서버로 오지 않는다. 클라이언트 401 경로는 페이지를 떠나지 않아 필요 없음 |

## 남은 위험

- **UMD 경유 확인 필요**: UMD(server) `public-paths` 에 `/v1/auth/refresh`·`/v1/auth/logout` 이 있어야 하고, 로그인 응답의 `Set-Cookie` 를 UMD 가 넘겨줘야 한다. 넘겨주지 않으면 refreshToken 이 없어 **이전처럼 15분에 세션이 끝난다**(`[auth] refresh 실패` 로그는 남지 않음 — refresh 를 시도하지 않음).
- **회전 경합**: lib-core 회전은 조회→삭제라 원자적이지 않다. 다른 탭과 동시에 회전하면 한쪽이 실패할 수 있다 → accessToken 이 아직 유효하면 세션을 유지하고, 만료됐으면 재로그인 모달.
- **세션 조회(GET `/api/auth/session`)·서버 컴포넌트의 `auth()`** 도 쿠키를 다시 쓴다. refresh 와 정확히 겹치면 회전된 쿠키가 덮일 수 있다(재로그인 모달로 복구).
- 유휴·절대 시간은 상수다. 제품 정책이 정해지면 `sessionPolicy.ts` 값만 바꾼다.

## 검증

- 단위: `lib/auth/sessionPolicy.test.ts`(유휴·절대·refresh 시점), `lib/api/client.test.ts`(refresh 합류·재시도, 모달 하나로 동시 요청 재개, 모달 닫기), `lib/routeAccess.test.ts`(`safeCallbackUrl` 외부 URL 차단).
- 브라우저(mock 모드, 2026-11-18): 보호 경로 → `/login?callbackUrl=` → 로그인 후 원래 경로·쿼리로 복귀. 입력 시 `POST /api/auth/session` 활동 신호. 프로젝트 생성 폼 입력 중 세션 삭제 → 제출 401 → 재로그인 모달(폼 입력 유지) → 로그인 후 같은 POST 재시도 성공.
- 실제 백엔드 refresh 회전은 mock 에 refreshToken 이 없어 브라우저로 확인하지 못했다.
