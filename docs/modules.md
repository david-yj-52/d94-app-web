# 실험 모듈

web-plate는 UI 학습과 웹 기능 실험장입니다. 하나의 Next.js 앱 안에 여러 모듈이 독립적으로 함께 있습니다.
**모듈끼리는 서로 import하지 않습니다.** 공유가 필요한 코드는 `components/ui`, `lib`, `hooks`로 올립니다.

## 모듈 목록

| 모듈 | 경로 | 실험 주제 | 데이터 방식 | 상태 | L3 문서 |
|---|---|---|---|---|---|
| **CIRA** | `/projects/**`, `/dashboard`, `/search`, `/notifications` | Jira 유사 협업 도구 | axios + TanStack Query + `/api/proxy` (+ mock) | 주력 | [projects](../src/app/(main)/projects/AGENTS.md) 외 |
| **MPMS** | `/mpms` | 마스터-디테일 테이블 CRUD | 로컬 상태 + 상수 mock | 동작 | [mpms](../src/app/(main)/mpms/AGENTS.md) |
| **Solace** | `/solace` | WebSocket 메시징 (solclientjs) | Solace 브로커 직접 연결 | 브로커 필요 | [solace](../src/app/(main)/solace/AGENTS.md) |
| **todo** | `/todo` | Server Actions + `revalidatePath` | 서버 컴포넌트 + fetch 래퍼 | 목록 하드코딩 | [todo](../src/app/(main)/todo/AGENTS.md) |
| **인터페이스 테스트** | `/interface-test` | REST 메서드별 UI → UMD → 백엔드 → DB 통신 확인 | axios + TanStack Query + `/api/proxy` (+ mock) | 동작 (d94-query `/api/v1/interface-tests`) | [interface-test](../src/app/(main)/interface-test/AGENTS.md) |

허브(첫 화면 대시보드): [/home](../src/app/(main)/home/AGENTS.md)

## 모듈별 파일

| 모듈 | 파일 |
|---|---|
| CIRA | `src/app/(main)/{projects,dashboard,search,notifications}`, `src/components/{board,issue,milestone,project,search,sprint,version,wiki}`, `src/hooks/*`, `src/lib/api/*`, `src/lib/mock/*`, `src/types/*` |
| MPMS | `src/app/(main)/mpms/`, `src/components/mpns/`, `src/app/model/`, `src/app/constant/` |
| Solace | `src/app/(main)/solace/`, `src/lib/messaging/solace/` |
| todo | `src/app/(main)/todo/`, `src/app/page.tsx`, `src/app/actions.ts`, `src/lib/api.ts`, `src/components/{AddTodoForm,TodoItem}.tsx` |
| 인터페이스 테스트 | `src/app/(main)/interface-test/`, `src/components/interfaceTest/`, `src/hooks/useInterfaceTests.ts`, `src/lib/api/interfaceTests.ts`, `src/types/interfaceTest.ts`, mock: `src/lib/mock/router.ts` 인터페이스 테스트 절 |
| (초기 데모, 미사용) | `src/components/{AuthCheck,LoginButton}.tsx` |

## 새 실험 모듈 추가하기

1. **라우트:** `src/app/(main)/{module}/page.tsx`를 만듭니다. 인증이 필요하면 `middleware.ts`의 `PROTECTED_PREFIXES`에 등록합니다.
2. **컴포넌트:** `src/components/{module}/`에 둡니다. 공통 UI는 [카탈로그](../src/components/AGENTS.md)에서 먼저 찾습니다.
3. **데이터:** 백엔드를 쓰면 CIRA 방식(`types → lib/api → hooks → mock`)을 기본으로 합니다. 다른 방식을 실험하는 것이 목적이면 그 방식을 L3 문서에 명시합니다.
4. **노출:** 허브 `home/page.tsx`의 `FEATURE_GROUPS`에 카드를 추가합니다. 필요하면 헤더 `ApHeader`의 `NAV_ITEMS`에도 추가합니다.
5. **문서:**
   - L3 `AGENTS.md`와 `CLAUDE.md`를 만듭니다.
   - 이 표와 L1 §0 지도, `src/app/AGENTS.md` 화면 목록에 등록합니다.
