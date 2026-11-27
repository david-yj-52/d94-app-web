# L2 · test (`src/test/`)

> 계층: [L1 프로젝트](../../AGENTS.md) › **L2 test**
> 상세 규칙: [docs/testing.md](../../docs/testing.md)

테스트 공용 파일만 둡니다. 테스트 자체는 소스 옆 `*.test.ts(x)` 입니다. 앱 코드에서 이 폴더를 import 하지 않습니다.

| 파일 | 역할 |
|---|---|
| `setup.ts` | `vitest.config.ts` 의 setupFiles. jest-dom 매처, MSW `server.listen({onUnhandledRequest: "error"})`·리셋·종료, `next-auth/react` mock |
| `auth.ts` | `authState.status` — next-auth mock 의 세션 상태 (테스트마다 `"authenticated"` 로 되돌림) |
| `utils.tsx` | `createTestQueryClient`, `renderWithClient`, `renderHookWithClient`, `lastRequest(method?, path?)` |
| `msw/backendTypes.ts` | d94-query 응답 DTO 타입. **web 타입(`@/types/*`)을 쓰지 않는다** |
| `msw/fixtures.ts` | 백엔드 모양 샘플 + `ok()`·`noContent()`·`error()`·`page()` |
| `msw/handlers.ts` | d94-query 에 있는 엔드포인트만. 없는 경로는 500. 요청은 `recorded` 에 기록, `KNOWN_USER_IDS`. 프로젝트 필드(`fixtures.projectFields`)에는 필수 선택형 `cf:CF-1` "계약 단계" 가 있다. 라이브러리는 전역 `fixtures.globalField`(`cf:CF-G` "고객사") 하나, 가져오기 응답은 `fixtures.importedCopy(sourceId)`. Docs vault(`/docs/vaults`, Private 하나)·`/issue-types`·문서 기준정보(빈 목록)·Task 연결 문서("메인 없음")·작업 공간(`/projects/:id/spaces` 기본 공간 `SPACE-1` 하나)·Feature 트리(빈 목록)·전사 산출물 규칙(빈 목록)은 인라인 응답 |
| `msw/server.ts` | `server`, `resetRecorded()` |

- d94-query DTO 가 바뀌면 `backendTypes.ts` → `fixtures.ts` → `handlers.ts` 를 함께 고칩니다.
- `src/lib/mock/`(dev 용 web 모양 mock)과 섞지 않습니다. 둘의 차이는 `src/lib/mock/router.test.ts` 가 고정합니다.
