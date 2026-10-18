# AGENTS.md — web-plate (UI 학습 · 웹 기능 실험장)

> 이 파일은 모든 AI 코딩 도구 (Claude Code, Cursor, Codex, Copilot 등)가 공통으로 읽는 **L1 프로젝트 가이드**입니다.
> 도구별 파일 (`CLAUDE.md`)은 같은 폴더의 `AGENTS.md`를 import 하기만 합니다. 규칙은 **AGENTS.md 계열과 `docs/`에만** 씁니다.

## 0. 문서 계층 지도

가이드와 컨텍스트는 4계층으로 나뉩니다. 하위 문서는 해당 폴더를 작업할 때 도구가 자동으로 함께 읽습니다.

| 계층 | 범위 | 위치 |
|---|---|---|
| **L1 프로젝트** | 성격, 전역 규칙, 명령어 | 이 파일 + [docs/](docs/) |
| **L2 폴더** | 폴더의 역할·규칙·목록 (컴포넌트 카탈로그 포함) | `src/{폴더}/AGENTS.md` |
| **L3 화면** | 화면 조립도, 데이터, 진입 경로 | `src/app/(main)/**/AGENTS.md` |
| **L4 기능** | 화면 안 기능의 동작·흐름 | L3 문서의 `## 기능` 섹션 |

```
AGENTS.md (L1)
├── src/app/AGENTS.md (L2 라우팅·화면 목록)
│   ├── (main)/home/AGENTS.md ............ 실험 모듈 허브
│   ├── (main)/dashboard/AGENTS.md ....... 개인 대시보드
│   ├── (main)/search/AGENTS.md .......... 통합 검색 + CQL 고급 검색
│   ├── (main)/projects/AGENTS.md ........ 프로젝트 목록 + 프로젝트 공통 탭
│   │   └── [projectId]/
│   │       ├── issues/AGENTS.md ......... 이슈 목록·상세
│   │       ├── boards/AGENTS.md ......... 칸반 보드
│   │       ├── sprints/AGENTS.md ........ 스프린트
│   │       ├── reports/AGENTS.md ........ 번다운·CFD·Velocity
│   │       ├── settings/AGENTS.md ....... 기본정보·멤버·워크플로우·자동화·Git
│   │       ├── versions/AGENTS.md ....... 버전·마일스톤
│   │       └── wiki/AGENTS.md ........... 위키
│   ├── (main)/mpms/AGENTS.md ............ [실험] 플랫폼·제품 관리
│   ├── (main)/solace/AGENTS.md .......... [실험] Solace 메시징
│   └── (main)/todo/AGENTS.md ............ [실험] Server Actions
├── src/components/AGENTS.md (L2 ★컴포넌트 카탈로그)
│   ├── ui/AGENTS.md ..................... Primitive + 디자인 토큰
│   └── {board,issue,layout,mpns,project,sprint,version,wiki}/AGENTS.md  도메인 컴포넌트 카드
├── src/hooks/AGENTS.md (L2 Query 훅·queryKey)
└── src/lib/AGENTS.md (L2 API·mock·messaging)
```

**새 화면이나 폴더를 추가하면 이 지도에 등록하고, 같은 폴더에 `AGENTS.md`와 `CLAUDE.md`(`@AGENTS.md` 한 줄)를 함께 만드세요.**

## 1. 프로젝트 요약

- **UI 기술 학습과 다양한 웹 기능 실험을 위한 연습장**입니다. 특정 서비스 하나만을 위한 앱이 아닙니다.
- 하나의 Next.js App Router 앱 안에 여러 **실험 모듈**이 함께 있습니다. 상세: [docs/modules.md](docs/modules.md)

| 모듈 | 경로 | 실험 주제 |
|---|---|---|
| **CIRA** | `/projects`, `/dashboard`, `/search` | 가장 큰 모듈. Jira 유사 협업 도구 (TanStack Query, 칸반 DnD, 차트, 리치 에디터) |
| **MPMS** | `/mpms` | 마스터-디테일 테이블 CRUD (로컬 상태) |
| **Solace** | `/solace` | WebSocket 메시징 (solclientjs) |
| **todo** | `/todo` | Server Actions + `revalidatePath` |
| **local-agent** | (화면 미연결) | HTTPS 사이트에서 로컬 HTTP 에이전트 호출 (`AgentStatusButton`) |

- `/home`은 모듈 허브 화면입니다. 새 실험은 언제든 추가할 수 있습니다. 다만 아래 공통 규칙은 지켜야 합니다.
- 백엔드는 별도 서버(`BACKEND_URL`)입니다. 백엔드 없이 개발할 때는 mock 모드를 씁니다 → [docs/dev-setup.md](docs/dev-setup.md)

## 2. 기술 스택

| 영역          | 사용 기술                                                          |
|---------------|--------------------------------------------------------------------|
| 프레임워크    | Next.js 16.1.3 (App Router, Turbopack), React 19.0.1               |
| 언어          | TypeScript 5 (`strict`), 경로 별칭 `@/*` → `src/*`                 |
| 서버 상태     | TanStack Query v5 + axios (`src/lib/api/client.ts`)                |
| 인증          | next-auth v5 beta (Credentials → JWT, `src/auth.ts`)               |
| 폼            | react-hook-form + zod                                              |
| 스타일        | Tailwind CSS v3 + `clsx` / `tailwind-merge`, 아이콘 `lucide-react` |
| 기타          | Recharts(차트), Tiptap(리치 텍스트), react-markdown                |
| 패키지 매니저 | npm (`package-lock.json`)                                          |

## 3. 명령어

| 목적      | 명령               | 비고                                                                   |
|-----------|--------------------|------------------------------------------------------------------------|
| 개발 서버 | `npm run dev`      | `.env.local` 필요 → [docs/dev-setup.md](docs/dev-setup.md)             |
| 타입 검사 | `npx tsc --noEmit` | **유일한 정적 검증 수단**. 작업 후 반드시 실행                         |
| 빌드      | `npm run build`    | 큰 변경 후 실행                                                        |
| 문서 검사 | `npm run docs:check` | 컨텍스트 문서와 코드의 동기화 검사. **작업 후 반드시 실행** → §10 |
| 린트      | `npm run lint`     | ⚠️ 현재 동작하지 않음 (Next 16에서 `next lint` 제거, ESLint 설정 없음) |
| 테스트    | 없음               | 테스트 프레임워크 미도입                                               |

## 4. 디렉터리 맵

```
src/
├── auth.ts, middleware.ts, next-auth.d.ts   인증 설정 / 라우트 보호 / 세션 타입
├── app/                 라우트 (화면)                        → src/app/AGENTS.md
├── components/          UI 컴포넌트 (ui / layout / {domain}) → src/components/AGENTS.md
├── hooks/               TanStack Query 훅                    → src/hooks/AGENTS.md
├── lib/                 api / mock / messaging               → src/lib/AGENTS.md
└── types/{domain}.ts    도메인 타입 (Request/Response)
```

상세: [docs/architecture.md](docs/architecture.md)

## 5. 핵심 규칙

### UI는 "조립"으로 만든다 (가장 중요)

컴포넌트 계층과 의존 방향은 **Screen(`app/**/page.tsx`) → Domain(`components/{domain}`) → Primitive(`components/ui`)** 입니다.
반대 방향으로 import하거나 도메인끼리 import하지 않습니다. 공유가 필요하면 `ui/`로 올리세요.

화면이나 UI를 만들기 전에 다음 순서를 따릅니다:
1. [src/components/AGENTS.md](src/components/AGENTS.md) 카탈로그에서 쓸 수 있는 컴포넌트를 찾습니다.
2. 있으면 그대로 씁니다. 비슷하면 **props나 variant를 추가**합니다. 복사해서 새로 만들지 않습니다.
3. 없으면 한 화면에서만 쓸 경우 `components/{domain}/`에 만듭니다. **두 곳 이상에서 필요하면 `components/ui/`로 승격**합니다.
4. 비슷한 화면의 L3 문서에 있는 "화면 구성" 조립도를 참고해 같은 패턴으로 조립합니다.
5. 컴포넌트를 추가하거나 바꿨다면 카탈로그 표와 컴포넌트 카드를 갱신합니다(§10).

### 반드시

- 데이터 흐름은 **컴포넌트 → `hooks/useX.ts` → `lib/api/x.ts` → `/api/proxy` → 백엔드** 순서를 지킵니다.
- API 함수는 `res.data.data`를 반환합니다. 백엔드 응답은 `{ success, data }` 형태입니다.
- queryKey는 `[도메인, id, ...필터]` 형태입니다. mutation `onSuccess`에서 관련 키를 `invalidateQueries` 합니다.
- 클라이언트 컴포넌트에만 `"use client"`를 붙입니다.
- 스타일 토큰(색, 라운드, 버튼 높이)은 [src/components/ui/AGENTS.md](src/components/ui/AGENTS.md)의 디자인 토큰을 따릅니다.
- 로딩은 `Skeleton` 계열로 보여 줍니다. 에러는 `useToast()`의 `show(msg, "error")`로 띄우고 `{ToastComponent}`를 렌더링합니다.
- 모달은 부모가 `{open && <XxxModal onClose=…/>}` 형태로 조건부 렌더링하고, 바깥을 클릭하면 닫혀야 합니다.
- 새 엔드포인트를 쓰면 `src/lib/mock/router.ts`에도 mock 라우트를 추가합니다.

### 금지

- `page.tsx`에서 API 직접 호출 (반드시 훅을 통해서)
- 인라인 `style={{}}` (Tailwind로 불가능한 동적 수치만 예외, 주석으로 사유 명시)
- `any` 타입 (불가피하면 주석으로 사유 명시)
- `localStorage` / `sessionStorage` 직접 접근
- 외부 CDN 스크립트 삽입
- 실험 모듈끼리 서로 import (예: CIRA 코드에서 `components/mpns` 사용). 구 fetch 래퍼(`src/lib/api.ts`, `src/app/actions.ts`)는 todo 실험 전용입니다.
- multipart 업로드 시 `Content-Type` 직접 지정 (반드시 `undefined`로 제거 → [src/lib/AGENTS.md](src/lib/AGENTS.md))

기존 코드에 이 규칙을 어기는 예외가 있습니다. **고치지 않은 예외를 따라 하지 마세요** → [docs/conventions.md](docs/conventions.md)

## 6. 새 기능 추가 절차

1. `src/types/{domain}.ts`: Request/Response 타입 정의
2. `src/lib/api/{domain}.ts`: `apiClient`로 HTTP 함수 작성 (`/v1/...` 경로)
3. `src/hooks/use{Domain}.ts`: `useQuery` / `useMutation` + invalidate
4. 카탈로그 확인 → `src/components/{domain}/`에 필요한 컴포넌트만 추가
5. `page.tsx`에서 조립 (조립만 담당)
6. `src/lib/mock/router.ts`: `on("METHOD", "/v1/...", handler)` mock 추가
7. 보호가 필요한 새 최상위 경로라면 `src/middleware.ts`의 `PROTECTED_PREFIXES`에 추가
8. 문서: §10 매핑표에 따라 갱신 (새 화면이면 L3 `AGENTS.md`+`CLAUDE.md`, §0 지도, 카탈로그)

예시 구현: `src/lib/api/milestones.ts` + `src/hooks/useMilestones.ts`

## 7. 작업 완료 전 체크리스트

- [ ] `npx tsc --noEmit` 통과
- [ ] 구조 변경·라우트 추가 시 `npm run build` 통과
- [ ] 새 엔드포인트의 mock 라우트 추가
- [ ] **§10 문서 동기화 수행 + `npm run docs:check` 오류 0개, 경고 전부 확인**
- [ ] 작업 보고에 "갱신한 문서 목록" 포함

## 8. 커밋 메시지

`type: 설명` (한국어 가능). type은 `feat`, `fix`, `refactor`, `docs`, `style`, `chore` 중 하나입니다.
태스크 ID가 있으면 앞에 붙입니다. 예: `feat: [3-4] 번다운 차트 추가`

## 9. 공통 상세 문서 (`docs/`, 필요할 때 읽기)

| 문서                                         | 언제 읽나                                       |
|----------------------------------------------|-------------------------------------------------|
| [docs/architecture.md](docs/architecture.md) | 구조, 인증, 라우팅, 요청 흐름을 이해해야 할 때  |
| [docs/conventions.md](docs/conventions.md)   | 네이밍·포맷·타입 판단이 필요할 때, 기존 예외 목록 |
| [docs/dev-setup.md](docs/dev-setup.md)       | 로컬 실행, 환경 변수, 개발용 우회 설정          |
| [docs/modules.md](docs/modules.md)           | 실험 모듈 목록과 상태, 새 실험 추가 방법        |
| [docs/known-issues.md](docs/known-issues.md) | 알려진 문제, 기술 부채                          |
| [docs/decisions/](docs/decisions/)           | 주요 결정 기록 (ADR)                            |

## 10. 문서 동기화 (필수)

컨텍스트 문서(AGENTS.md 계열과 `docs/`)는 **항상 현재 코드 상태와 일치**해야 합니다. 낡은 문서는 AI를 틀린 방향으로 이끌기 때문에, 문서가 없는 것보다 해롭습니다.

### 원칙
- 코드 변경과 문서 변경은 **같은 작업, 같은 커밋**에서 함께 합니다. "문서는 나중에"는 금지합니다.
- 사용자가 따로 요청하지 않아도 문서 갱신은 작업 범위에 **기본으로 포함**됩니다.
- 문서에는 코드에서 확인한 사실만 씁니다. 계획이나 추측은 "계획"·"후보"라고 명시합니다.
- props 시그니처, queryKey, 경로는 기억에 의존하지 말고 **코드에서 그대로 복사**합니다.
- 예외는 사용자가 "문서 갱신 생략"을 명시한 경우뿐이며, 이때도 작업 보고에 생략 사실을 적습니다.

### 변경 유형 → 갱신할 문서

| 코드 변경 | 갱신할 문서 |
|---|---|
| 컴포넌트 추가·삭제·이름 변경 | `src/components/AGENTS.md` 목록 + 해당 폴더 `AGENTS.md` 카드 |
| 컴포넌트 props·동작 변경 | 해당 폴더 `AGENTS.md` 카드 |
| `ui/` primitive 추가, 디자인 토큰 변경 | `src/components/ui/AGENTS.md` (§1 토큰, §2 카드, §4 승격 계획 상태) |
| 컴포넌트를 `ui/`로 승격 | 위 두 문서 + 그 컴포넌트를 쓰는 L3 "화면 구성" |
| 화면(page/layout) 추가·삭제·경로 변경 | 화면 폴더 L3 `AGENTS.md`+`CLAUDE.md` 생성·삭제, `src/app/AGENTS.md` 화면 목록, §0 지도 |
| 화면 구성·기능 변경 | 해당 L3의 "화면 구성"·"데이터"·"기능(L4)" |
| 훅 추가·변경, queryKey 변경 | `src/hooks/AGENTS.md` 표 + 그 훅을 쓰는 L3 "데이터" |
| API·mock·messaging 변경 | `src/lib/AGENTS.md` (+ 관련 L3 "데이터") |
| 새 폴더(도메인·모듈) 추가 | 폴더 `AGENTS.md`+`CLAUDE.md`, §0 지도, (모듈이면) `docs/modules.md` |
| 라우트 보호·인증·프록시 변경 | `docs/architecture.md`, `src/app/AGENTS.md` §1 |
| 환경 변수 추가·변경 | `.env.sample`, `docs/dev-setup.md` |
| 규칙 예외를 해소하거나 새로 만듦 | `docs/conventions.md` §7, `src/app/AGENTS.md` §4, 해당 L3 "주의·예외" |
| 알려진 문제를 해결하거나 발견함 | `docs/known-issues.md` |
| 규칙·구조에 대한 의사결정 | 이 파일의 해당 절 + `docs/decisions/` ADR |
| 의존성·명령어 변경 | 이 파일 §2·§3 |

### 작업 마무리 절차
1. 위 표에 따라 문서를 갱신합니다.
2. `npm run docs:check`를 실행합니다.
   - **✖ 오류는 0개여야 합니다.** 끊긴 링크, AGENTS/CLAUDE 짝 누락, 지도·카탈로그·훅 표·화면 문서 누락, 존재하지 않는 import 경로가 오류입니다.
   - **⚠ 경고는 하나씩 확인합니다.** 코드는 바뀌었는데 가장 가까운 문서가 바뀌지 않은 경우입니다. 문서를 갱신하거나, 작업 보고에 "갱신 불필요" 사유를 적습니다.
3. 작업 보고에 **갱신한 문서 목록**을 포함합니다.

### 삭제·이름 변경 시
문서에 남은 옛 이름, 경로, 링크를 검색해 함께 정리합니다. docs:check가 끊긴 링크와 없는 import 경로를 오류로 잡아냅니다.
