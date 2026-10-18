# L3 · 화면: 리포트 (CIRA)

> 계층: [L1](../../../../../../AGENTS.md) › [L2 app](../../../../AGENTS.md) › [L3 projects](../../AGENTS.md) › **L3 reports**

## 개요
| URL | 파일 | 차트 |
|---|---|---|
| `/projects/:id/reports` | `page.tsx` | → `/burndown`으로 redirect |
| `/projects/:id/reports/burndown` | `burndown/page.tsx` | Recharts `LineChart` |
| `/projects/:id/reports/velocity` | `velocity/page.tsx` | Recharts `Bar` |
| `/projects/:id/reports/cfd` | `cfd/page.tsx` | Recharts `AreaChart` |

## 화면 구성
```
reports/layout.tsx
├── ProjectNav
├── 제목 "리포트" + 서브탭 (번다운 차트 / Velocity / CFD 차트) — usePathname으로 활성 표시
└── {children}
    ├── burndown: 스프린트 select → LineChart (이상선 vs 실제 잔여)
    ├── velocity: 최근 N개 select(6/10/12) → 스프린트별 계획 대비 완료 Bar
    └── cfd: 시작일·종료일 input → 상태별 누적 AreaChart
    (각 페이지 로딩: Skeleton)
```
**layout에 서브탭을 두는 패턴**입니다. 같은 구조의 탭 화면(예: 새 분석 화면)을 만들 때 참고하세요.

## 데이터
| 훅 | queryKey |
|---|---|
| `useSprints(projectId)` (번다운 스프린트 목록) | `["sprints", projectId]` |
| `useBurndown(sprintId)` | `["burndown", sprintId]` |
| `useVelocity(projectId, lastN)` | `["velocity", projectId, lastN]` |
| `useCfd(projectId, startDate, endDate)` | `["cfd", projectId, startDate, endDate]` |

## 기능 (L4)
### 번다운
- 기본값은 ACTIVE 스프린트이고, 없으면 첫 스프린트입니다. 다른 스프린트를 고를 수 있습니다. 차트는 이상선(`ideal`)과 실제(`actual`)를 비교합니다. `useMemo`로 응답을 차트 데이터로 바꿉니다. 날짜 라벨과 툴팁 포맷 헬퍼가 페이지 안에 있습니다.
### Velocity
- 최근 N개 스프린트의 계획(`committed`)과 완료(`completed`) 포인트를 비교하고, 평균 velocity(`avgVelocity`)를 함께 표시합니다.
### CFD
- 기본 기간은 `getDefaultDates()`가 정합니다. 상태 카테고리별 색상은 `getStatusColor`로 매핑합니다.

## 주의·예외
- 세 페이지 모두 차트 컨테이너에 인라인 style을 씁니다(Recharts 크기 지정).
- 차트 공통 요소(툴팁 포맷, 색상, 빈 상태)가 페이지마다 중복됩니다. 새 차트를 만든다면 `components/reports/ChartCard` 같은 공통 컴포넌트로 추출하는 것을 검토하세요.
