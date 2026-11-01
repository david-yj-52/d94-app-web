# 테스트

> 계층: [L1 프로젝트](../AGENTS.md) › docs › **testing**
> 최근 실행 결과와 발견한 결함: [test-report.md](test-report.md)

## 1. 도구

| 도구 | 버전 | 용도 |
|---|---|---|
| Vitest | 4.1.12 | 실행기 (`vitest.config.ts`) |
| @vitejs/plugin-react | 5.2.0 | JSX 변환 |
| jsdom | 27.4.0 | 기본 테스트 환경 (브라우저 흉내) |
| @testing-library/react · dom · user-event · jest-dom | 16.3.3 · 10.4.2 · 14.6.8 · 6.10.0 | 컴포넌트 렌더링·사용자 입력·DOM 매처 |
| MSW | 2.15.0 | 네트워크 가짜 응답 (`msw/node`, axios XHR 가로채기) |
| @vitest/coverage-v8 | 4.1.12 | 커버리지 |

버전은 모두 고정(`-E`)입니다. Vitest 5 / MSW 3 은 아직 쓰지 않습니다(2026-10 기준 갓 나온 메이저).

## 2. 명령

| 목적 | 명령 | 비고 |
|---|---|---|
| 전체 실행 | `npm test` | `vitest run` (watch 없음) |
| 커버리지 | `npm run test:coverage` | 결과: `coverage/` (`index.html`, `coverage-summary.json`, git 제외) |
| 파일 하나 | `npx vitest run src/lib/api/issues.test.ts` | |
| watch | `npx vitest` | |

`vitest.config.ts` 를 CommonJS 로 읽는다는 Vite 경고가 한 번 나옵니다(`package.json` 에 `"type": "module"` 없음). 동작에는 영향이 없고, 숨기려면 `VITE_CONFIG_NATIVE_IGNORE_WARNING=true`.

커버리지는 CIRA 로직 계층만 측정합니다: `src/lib/api/**`, `src/hooks/**`, `src/components/{board,issue,layout,sprint}/**`, `src/lib/mock/router.ts`. 화면(`page.tsx`)과 실험 모듈은 제외합니다.

## 3. 파일 위치

```
vitest.config.ts              @/* 별칭, jsdom, setupFiles, coverage 범위
src/test/
├── setup.ts                  jest-dom 매처, MSW 서버 시작·리셋·종료, next-auth/react mock
├── auth.ts                   next-auth mock 의 세션 상태 (authState.status 로 바꿈)
├── utils.tsx                 renderWithClient / renderHookWithClient / createTestQueryClient / lastRequest
└── msw/
    ├── backendTypes.ts       d94-query 응답 DTO 를 옮긴 타입 (web 타입과 별개)
    ├── fixtures.ts           백엔드 모양 샘플 데이터 + ok()/noContent()/error()/page() 래퍼
    ├── handlers.ts           d94-query 엔드포인트 핸들러 + 요청 기록(recorded)
    └── server.ts             setupServer
```

테스트는 **소스 옆**에 `*.test.ts(x)` 로 둡니다. 예: `src/lib/api/issues.ts` ↔ `src/lib/api/issues.test.ts`.
`npm run docs:check` 는 `*.test.ts(x)` 를 컴포넌트·훅 목록 검사와 "문서 미갱신" 경고에서 뺍니다.

## 4. 규칙

### MSW 는 백엔드 실제 모양을 쓴다 (가장 중요)
- `src/test/msw/` 의 응답은 **d94-query Java DTO 그대로**입니다. web 타입(`@/types/*`)으로 만들지 않습니다.
  - 원본: d94-query `apService/cira/dto/*.java`, 컨트롤러 `interfaces/controller/cira/*Controller.java`, lib-core `ApiResponse`·`UserResponse`.
  - 래퍼는 `{success, code, message, data}` (`ApiResponse`, `@JsonInclude(NON_NULL)`). 삭제류(`ApiResponse.noContent()`)는 HTTP 200 에 `data` 키가 없습니다.
  - 페이지는 Spring `PageImpl` 직접 직렬화(`content`·`pageable`·`totalElements`·`totalPages`·`number`·`size`·`first`·`last`…).
  - 필드가 비면 키를 빼지 않고 `null` 을 넣습니다(Jackson 기본).
- 이유: web 타입으로 MSW 를 만들면 web 과 백엔드가 어긋나도 테스트가 통과합니다. 실제로 알림 응답(페이지 vs 목록) 차이로 운영 화면이 하얗게 된 적이 있습니다([known-issues](known-issues.md)).
- **d94-query 에 없는 경로는 핸들러를 만들지 않습니다.** 마지막 catch-all 이 d94-query 처럼 500 `INTERNAL_ERROR` 를 줍니다(GlobalExceptionHandler 가 NoResourceFoundException 까지 500 으로 바꿈). 경로가 틀린 API 함수는 테스트에서 500 으로 드러납니다.
- 요청 검증도 백엔드와 같게 합니다(d94-query 통합 테스트로 확인된 계약 포함):
  - `@NotBlank` 필드가 없으면 400 `VALIDATION_ERROR`.
  - 이슈 생성: `statusId`·`issueTypeId` 가 없으면 500(`UnexpectedRollbackException`), `assigneeId` 는 검증 없이 저장되며 `KNOWN_USER_IDS`(사용자 objId)가 아니면 응답 `assignee` 가 null.
  - 운영 DB `varchar(255)` 컬럼(`fixtures.VARCHAR_LIMIT`): 이슈·댓글 `content`, 프로젝트 `description` 이 255자를 넘으면 500.
  - 스프린트 `sprintStat` 값은 `"Planned" | "Active" | "Completed"` (`BackendSprintStat`).
- 백엔드 DTO 가 바뀌면 `backendTypes.ts` → `fixtures.ts` → `handlers.ts` 순서로 함께 고칩니다.

### 테스트 작성
- 보낸 요청은 `lastRequest(method?, path?)` 로 확인합니다(경로는 `/v1/...`, `query`·`body` 포함).
  - ⚠️ `server.use(...)` 로 덮어쓴 핸들러는 기록 핸들러보다 먼저 응답하므로 그 요청은 기록되지 않습니다. 그때는 캐시(`client.getQueryData`)나 핸들러 안의 신호로 확인합니다.
- 한 테스트에서만 응답을 바꿀 때는 `server.use(http.get("*/api/proxy/v1/...", ...))`. 다음 테스트 전에 자동으로 원복됩니다.
- 훅은 `renderHookWithClient`, 컴포넌트는 `renderWithClient` 로 감쌉니다(재시도 없는 QueryClient).
- invalidate 는 `vi.spyOn(client, "invalidateQueries")` 의 `queryKey` 목록으로 확인합니다.
- 낙관적 갱신은 서버 응답을 붙잡아 두는 핸들러(`useBoards.test.ts` 의 `holdMove`)로 중간 상태를 봅니다.
- `next/navigation` 이 필요한 컴포넌트는 테스트 파일에서 `vi.mock("next/navigation", ...)` 합니다. `next-auth/react` 는 `setup.ts` 가 전역으로 mock 합니다.
- `any` 금지는 테스트에도 적용됩니다.

### 알려진 결함은 `it.fails`
- 코드 결함을 드러내는 테스트는 **고치지 않고** `it.fails("[결함] …")` 로 둡니다. 결함이 남아 있는 동안 통과하고, 누군가 고치면 실패해 `it` 으로 바꾸라고 알려 줍니다.
- 실패 지점이 의도한 단언이어야 합니다. 앞 단계(요청이 나갔는지 등)는 다른 결함에 걸리지 않게 준비합니다(예: `CreateIssueModal.test.tsx` 의 `fillAroundFormDefects`).
- 백엔드 확인이 필요한 추정은 `[결함 추정]`, 백엔드 작업을 기다리는 것은 `[결함·백엔드 대기]` 로 표시합니다.
- 결함 목록과 영향·수정 제안은 [test-report.md](test-report.md) 에 씁니다.

## 5. mock 라우터(`src/lib/mock/router.ts`)와의 관계

| | mock 라우터 | MSW (`src/test/msw/`) |
|---|---|---|
| 용도 | 백엔드 없이 `npm run dev` 화면 확인 (`DEV_MOCK_API=true`) | 자동 테스트 |
| 응답 모양 | **web 타입** 기준 (`@/types/*`) | **d94-query DTO** 기준 |
| 상태 | in-memory store, 변경 반영 | 고정 fixture (요청 기록만) |

- 둘은 일부러 따로 둡니다. mock 라우터는 web 모양이라 실제 백엔드와 다른 곳이 있습니다.
- `src/lib/mock/router.test.ts` 가 mock 응답과 MSW fixture 의 **키 차이를 `KNOWN_DIFFS` 로 고정**합니다. mock·백엔드 중 하나가 바뀌면 이 테스트가 깨지므로, 차이를 확인하고 `KNOWN_DIFFS` 와 [test-report.md](test-report.md) 를 함께 고칩니다.
- 새 엔드포인트를 추가하면 mock 라우트(AGENTS.md §5)와 함께 **d94-query 에 실제로 있을 때만** MSW 핸들러를 추가합니다.
