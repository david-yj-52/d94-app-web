# L3 · 화면: 홈 (기능 대시보드)

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 home**

## 개요
- **URL:** `/home` · **파일:** `page.tsx` (서버 컴포넌트)
- **목적:** 로그인 후 첫 화면입니다. 앱의 각 기능으로 들어가는 카드(박스) 대시보드입니다.
- **진입:** 로그인 성공(`LoginForm`), `/` 접속, 로그인 상태에서 `/login`·`/register` 접속(middleware), 헤더 로고와 "홈" 메뉴.
- **접근:** 페이지에서 `auth()`를 확인하고, 세션이 없으면 `/login`으로 보냅니다(middleware 보호 대상 아님).

## 화면 구성
```
home/page.tsx
├── 인사말 (시간대별 문구 + session.user.name)
└── FEATURE_GROUPS 섹션별 카드 그리드 (1 / sm:2 / lg:3 열)
    ├── CIRA: 프로젝트 → /projects, 내 대시보드 → /dashboard, 검색 → /search, 알림 → /notifications
    └── 실험 모듈: Tasks → /todo, MPMS → /mpms, Solace → /solace
```
카드는 `Link` 하나로, 아이콘(`lucide-react`) · 이름 · 한 줄 설명으로 구성됩니다. 카탈로그 컴포넌트 없이 페이지 안에 마크업을 직접 작성했습니다.

## 데이터
- API를 호출하지 않습니다. 카드 목록은 파일 안의 상수 `FEATURE_GROUPS`입니다.

## 기능 (L4)
### 기능 카드
- 카드를 클릭하면 해당 기능 화면으로 이동합니다.
- **새 기능 화면을 추가하면 `FEATURE_GROUPS`의 알맞은 그룹에 카드를 추가**하세요(`href`, `label`, `desc`, `icon`, `iconClass`). 헤더 메뉴(`ApHeader`의 `NAV_ITEMS`)도 함께 고려하세요.

## 주의·예외
- 프로젝트 하위 화면(이슈·보드·스프린트 등)은 `projectId`가 필요해 카드가 없습니다. "프로젝트" 카드에서 들어갑니다.
