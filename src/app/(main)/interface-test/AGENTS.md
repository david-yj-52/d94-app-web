# L3 · 화면: 인터페이스 테스트 🧪

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 interface-test**

## 개요
- **URL:** `/interface-test` · **파일:** `page.tsx` (클라이언트 컴포넌트)
- **목적:** REST 메서드(GET·HEAD·POST·PUT·PATCH·DELETE)별로 **브라우저 → `/api/proxy` → `BACKEND_URL`(UMD server → Redis → UMD local) → d94-query → DB** 왕복을 버튼으로 확인합니다. 상태코드·소요시간·`X-Trace-Id`·본문을 그대로 보여 줍니다.
- **진입:** 홈 대시보드 "실험 모듈 › 인터페이스 테스트" 카드
- **접근:** `middleware.ts` 보호 경로 (비로그인 시 `/login`). 백엔드가 JWT 를 요구하므로 실제 백엔드 계정으로 로그인해야 합니다.

## 화면 구성
```
interface-test/page.tsx   (form · logs 상태 보관, 조립)
├── 제목 + 경로 설명
├── 2열 (lg)
│   ├── InterfaceRequestPanel   대상 ID·name·status·content 입력 + 메서드 버튼 7개
│   └── InterfaceCallLog        호출 기록 (최신순, 최대 50건, 펼치면 Trace ID·요청/응답 본문)
├── InterfaceItemTable          DB 데이터 목록 (행 클릭 → 폼 채움)
└── {ToastComponent}
```
컴포넌트 카드: [interfaceTest](../../../components/interfaceTest/AGENTS.md)

## 데이터
| 훅 | API | 엔드포인트 | mock |
|---|---|---|---|
| `useInterfaceTestItems` (`["interface-tests"]`) | `getInterfaceTestItems` | `GET /v1/interface-tests` | ✅ |
| `useInterfaceCall` (mutation) | `callInterfaceTest` | 아래 7개 중 하나 | ✅ |

| 버튼 | 요청 | 기대 응답 |
|---|---|---|
| GET 목록 조회 | `GET /v1/interface-tests` | 200, 최근 100건 |
| GET 단건 조회 | `GET /v1/interface-tests/{id}` | 200 / 404 |
| HEAD 존재 확인 | `HEAD /v1/interface-tests/{id}` | 200 / 404, 본문 없음 |
| POST 생성 | `POST /v1/interface-tests` `{name, content?, status?}` | 201 + `Location`, name 없으면 400 |
| PUT 전체 수정 | `PUT /v1/interface-tests/{id}` | 200. 비운 content 는 null, status 는 `NEW` 로 |
| PATCH 부분 수정 | `PATCH /v1/interface-tests/{id}` (입력한 필드만) | 200 |
| DELETE 삭제 | `DELETE /v1/interface-tests/{id}` | 204 (soft delete), 이후 조회 404 |

- 백엔드: d94-query `InterfaceTestController` (`/api/v1/interface-tests`, 테이블 `SN_IF_TEST_ITEM`). `BACKEND_URL` 에 `/tsh/api` 까지 포함합니다.
- `callInterfaceTest` 는 4xx·5xx 도 throw 하지 않고 결과로 돌려줍니다(규칙 예외 → [conventions §7](../../../../docs/conventions.md)). `validateStatus` 를 모두 통과시키므로 401 이어도 `signOut` 하지 않습니다.

## 기능 (L4)
### 메서드 호출
- 버튼 클릭 → `useInterfaceCall().mutate(req)` → 결과를 호출 기록 맨 위에 추가합니다.
- 데이터를 바꾸는 메서드가 2xx 면 `["interface-tests"]` 를 무효화해 목록을 다시 읽습니다.
- POST 성공 시 새 id 를 대상 ID 에 채우고, DELETE 204 면 대상 ID 를 비웁니다.
- 상태 0(응답 없음) 또는 5xx 는 에러 토스트를 띄웁니다. 502·503·504 는 호출 기록에 "인프라" 판단 문구를 붙입니다 (UMD ui-guide §4-1).
- 대상 ID 가 비어 있으면 단건 메서드 버튼은 비활성입니다.

### 목록에서 선택
- 행 클릭 → 대상 ID·name·content·status 를 폼에 채웁니다. 선택한 행은 `bg-blue-50`.

## 주의·예외
- 호출 기록은 화면 상태(useState)라 새로고침하면 사라집니다.
- UMD 경유로 로그인하려면 UMD(server) `umd.server.public-paths` 에 로그인 경로가 있어야 합니다 → [architecture](../../../../docs/architecture.md)
