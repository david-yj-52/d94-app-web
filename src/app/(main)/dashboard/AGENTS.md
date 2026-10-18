# L3 · 화면: 내 대시보드 (CIRA)

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 dashboard**

## 개요
- **URL:** `/dashboard` · **파일:** `page.tsx` (클라이언트, 305줄)
- **목적:** 로그인한 사용자에게 할당된 작업, 최근 활동, 현재 스프린트 현황을 한 화면에서 보여 줍니다.

## 화면 구성
```
dashboard/page.tsx
├── 헤더 "내 대시보드"
├── 통계 카드 4개   내 할당 이슈 / 오늘 마감 / 이번 주 완료 / 진행 중인 작업
├── 나에게 할당된 이슈 (테이블: 키·제목·상태·우선순위·마감일, 기한 초과·오늘 강조)
├── 최근 활동 (이모지 아이콘 + 상대 시간)
├── 현재 스프린트 (진행률 바)
└── 로딩: Skeleton    → ui 카드
```

## 데이터
- `useDashboard()` → `GET /v1/users/me/dashboard` (`["dashboard"]`). mock 라우트가 있습니다.
- 응답 `DashboardResponse`: `assignedIssues`, `upcomingDeadlines`, `recentActivity`, `sprintProgress` 등(`types/reports.ts`)

## 기능 (L4)
### 할당 이슈 목록
- `isOverdue` / `isDueToday` 헬퍼로 마감 상태를 강조합니다.
- 행에 이슈 상세 링크가 없습니다(개선 후보). 하단에 `/projects` 링크가 있습니다.
### 최근 활동
- `formatRelativeTime`으로 "방금 전", "n분 전" 같은 상대 시간을 표시합니다.
### 현재 스프린트 진행률
- 활성 스프린트의 완료 비율을 진행률 바로 표시합니다.

## 주의·예외
- 진행률 바에 인라인 `style={{width}}`를 씁니다(동적 수치 예외).
- 날짜 포맷 헬퍼(`formatDate`, `formatRelativeTime`)가 페이지 안에 있습니다. notifications 등에도 비슷한 함수가 있어 `lib/format` 같은 공용 유틸로 추출할 후보입니다.
