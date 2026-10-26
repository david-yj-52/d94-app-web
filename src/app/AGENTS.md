# L2 · 라우트 · 화면 (`src/app/`)

> 계층: [L1 프로젝트](../../AGENTS.md) › **L2 app**
> 화면을 만들 때는 [컴포넌트 카탈로그](../components/AGENTS.md)를 먼저 보세요. 각 화면의 상세(L3)는 아래 표의 링크를 따라가세요.

## 1. 라우팅 구조

```
app/layout.tsx           Providers(Query+Session) → 로그인 시 ApHeader → children → NotificationMount
├── page.tsx             "/" (로그인 시 /home, 아니면 /login 으로 redirect) ⚠️ (main)/page.tsx 와 경로 중복
├── (auth)/              비로그인 전용. layout: 가운데 정렬 + TshLogo + "CIRA"
│   ├── login/                 → LoginForm
│   ├── register/              → RegisterForm (이메일 회원가입 → 자동 로그인)
│   └── cira/register/         → /register 로 redirect (예전 경로)
├── (main)/              로그인 영역 (라우트 그룹 layout 없음, 헤더는 루트 layout)
│   ├── page.tsx         "/" → 로그인 여부에 따라 /login 또는 /home 으로 redirect
│   ├── home/ dashboard/ notifications/ search/ projects/      CIRA + 허브
│   └── mpms/ solace/ todo/ interface-test/                    실험 모듈
└── api/
    ├── auth/[...nextauth]/    next-auth 핸들러
    └── proxy/[...path]/       백엔드 투명 프록시 (GET/HEAD/POST/PUT/PATCH/DELETE, Bearer 토큰 주입, 상태·헤더·본문 그대로, 35초 타임아웃, DEV_MOCK_API 시 mock 응답)
```

- **접근 제어**는 `src/middleware.ts`가 담당합니다.
  - 보호 경로(비로그인 시 `/login`으로): `/projects`, `/issues`, `/board`, `/dashboard`, `/search`, `/notifications`, `/interface-test`
  - `/home`, `/todo`는 페이지에서 직접 `auth()`를 확인해 redirect합니다. `/mpms`, `/solace`는 **보호되지 않습니다**.

## 2. 화면 목록 (L3)

| 화면 | URL | 모듈 | 한 줄 설명 | L3 문서 |
|---|---|---|---|---|
| 홈 | `/home` | 공통 | 첫 화면. 기능별 카드 대시보드 | [home](./(main)/home/AGENTS.md) |
| 대시보드 | `/dashboard` | CIRA | 내 할당 이슈·오늘 마감·최근 활동·현재 스프린트 | [dashboard](./(main)/dashboard/AGENTS.md) |
| 검색 | `/search`, `/search/advanced` | CIRA | 키워드·필터 검색, 저장 필터, CQL 고급 검색 | [search](./(main)/search/AGENTS.md) |
| 프로젝트 | `/projects` (+ 하위 공통) | CIRA | 프로젝트 목록·생성, 하위 탭 구조 | [projects](./(main)/projects/AGENTS.md) |
| 이슈 | `/projects/:id/issues[/:issueId]` | CIRA | 목록·필터·생성, 상세(인라인 편집·댓글·첨부) | [issues](./(main)/projects/[projectId]/issues/AGENTS.md) |
| 보드 | `/projects/:id/boards[/:boardId]` | CIRA | 칸반 보드 DnD | [boards](./(main)/projects/[projectId]/boards/AGENTS.md) |
| 스프린트 | `/projects/:id/sprints` | CIRA | 스프린트 CRUD·시작·완료·이슈 할당 | [sprints](./(main)/projects/[projectId]/sprints/AGENTS.md) |
| 리포트 | `/projects/:id/reports/*` | CIRA | 번다운·CFD·Velocity 차트 | [reports](./(main)/projects/[projectId]/reports/AGENTS.md) |
| 설정 | `/projects/:id/settings/*` | CIRA | 기본정보·멤버·워크플로우·Git·자동화 | [settings](./(main)/projects/[projectId]/settings/AGENTS.md) |
| 버전 | `/projects/:id/versions` | CIRA | 버전·마일스톤 탭 | [versions](./(main)/projects/[projectId]/versions/AGENTS.md) |
| 위키 | `/projects/:id/wiki` | CIRA | 트리·뷰어·Tiptap 편집·이력 | [wiki](./(main)/projects/[projectId]/wiki/AGENTS.md) |
| MPMS | `/mpms` | 🧪 | 플랫폼·제품 마스터-디테일 | [mpms](./(main)/mpms/AGENTS.md) |
| Solace | `/solace` | 🧪 | WebSocket 메시징 테스트 | [solace](./(main)/solace/AGENTS.md) |
| Todo | `/todo` | 🧪 | Server Actions | [todo](./(main)/todo/AGENTS.md) |
| 인터페이스 테스트 | `/interface-test` | 🧪 | REST 메서드별 UI→UMD→백엔드→DB 통신 확인 | [interface-test](./(main)/interface-test/AGENTS.md) |

**L3 문서 없이 여기서만 설명하는 화면**
- `/login`, `/register`: 폼 컴포넌트 하나만 렌더링합니다([카탈로그 §5](../components/AGENTS.md)). `/login?reason=expired` 면 "로그인 정보가 만료되었거나 유효하지 않습니다" 안내를 띄웁니다(API 401 → `apiClient` 가 로그아웃시키며 붙임).
- `/cira/register`: `/register` 로 redirect 합니다. 소셜(Google) 가입은 미구현입니다.
- `/notifications`: 알림 목록(페이지네이션)입니다.
  - 클릭하면 읽음 처리한 뒤 `/search?q={issueKey}`로 이동합니다. "모두 읽음"도 있습니다.
  - ⚠️ 페이지 안에서 `useQuery`와 `lib/api/notifications`를 직접 사용합니다(규칙 예외).
- `/projects/:id/reports`: `/reports/burndown`으로 redirect합니다.

## 3. 이 폴더의 규칙

- `page.tsx`는 **조립만** 담당합니다. 라우트 파라미터를 해석하고, 훅으로 데이터를 가져와 컴포넌트에 넘기고, 모달 열림 상태를 관리합니다.
- 클라이언트 페이지는 `params: Promise<{…}>`를 `use(params)`로 풉니다. 서버 페이지는 `await params`를 씁니다.
- 프로젝트 하위 탭에 공통 헤더가 필요하면 `layout.tsx`에서 `ProjectNav`를 렌더링합니다(reports, settings, versions, wiki 방식).
- 새 화면을 추가할 때:
  1. 폴더에 `AGENTS.md`(L3 템플릿)와 `CLAUDE.md`를 만듭니다.
  2. 위 표와 L1 §0 지도에 등록합니다.
  3. 보호가 필요하면 `middleware.ts`에 경로를 추가합니다.
  4. 헤더 메뉴에 노출하려면 `ApHeader`의 `NAV_ITEMS`에, 홈 대시보드에 노출하려면 `home`의 `FEATURE_GROUPS`에 추가합니다.
  5. `npm run docs:check`로 누락이 없는지 확인합니다([L1 §10](../../AGENTS.md)).

### L3 화면 문서 템플릿
```md
# L3 · 화면: {이름}
> 계층: [L1](…) › [L2 app](…) › **L3 {이름}**
## 개요        URL, 파일, 목적, 진입 경로, layout
## 화면 구성    컴포넌트 조립 트리 (카탈로그 카드 링크)
## 데이터      훅 → API 엔드포인트, mock 여부
## 기능 (L4)
### {기능명}   사용자 동작 → 처리 흐름 → 관련 컴포넌트/훅 → 성공·실패 피드백
## 주의·예외
```

## 4. 알려진 예외 (따라 하지 말 것)

- **페이지에서 `lib/api`를 직접 import하는 곳:** notifications, search, wiki, settings/automation, settings/git
- **400줄이 넘는 페이지:** `search/page.tsx`(567), `issues/[issueId]/page.tsx`(398). 내부에 컴포넌트를 함께 정의하고 있습니다(`InlineText`, `SaveFilterModal` 등).
- **브라우저 `confirm()`으로 삭제 확인하는 곳:** sprints, versions, wiki, settings/git·workflow, MemberTable, AutomationRuleCard. 새 코드는 [ui 표준 삭제 다이얼로그](../components/ui/AGENTS.md)를 쓰세요.
- **`/` 경로 중복:** `app/page.tsx`와 `app/(main)/page.tsx`가 같은 URL을 가집니다 → [known-issues](../../docs/known-issues.md)
