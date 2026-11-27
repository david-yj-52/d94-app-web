# L3 · 화면: Life Metric 지표 상세

> 계층: [L1](../../../../../AGENTS.md) › [L2 app](../../../AGENTS.md) › [L3 life-metric](../AGENTS.md) › **[metricId]**

## 개요
- **URL:** `/life-metric/[metricId]` · **파일:** `page.tsx` (클라이언트, `use(params)`)
- **목적:** 지표 하나의 현재 값·수식을 보고, 기준값을 고치고, 기록(로그)을 쌓아 추이를 봅니다.
- **진입:** 대시보드 카드 클릭, 지표 생성 직후

## 화면 구성
```
[metricId]/page.tsx
├── ← Life Metric
├── 머리 카드: 이름·@code·삭제 버튼, 현재 값+단위(또는 error), 수식(“수식 편집” → FormulaEditor + 저장/취소)
├── 2열 (lg: 20rem | 1fr)
│   ├── BaselineForm (key=modifiedAt — 저장 후 새 값으로 다시 그림)
│   └── LogPanel     (빠른 입력 · 추이 LineChart · 최근 기록 목록)
├── 삭제 버튼 → `useConfirm`("지표 삭제", 참조 지표 경고) → 성공 시 목록으로
└── {ToastComponent}
```
컴포넌트 카드: [lifeMetric](../../../../components/lifeMetric/AGENTS.md)

## 데이터
| 훅 | API | 엔드포인트 | mock |
|---|---|---|---|
| `useMetric(id)` (`["life-metric","metrics",id]`) | `getMetric` | `GET /v1/life-metric/metrics/{id}` | ✅ |
| `useMetricLogs(id)` (`["life-metric","metrics",id,"logs"]`) | `getMetricLogs` | `GET /v1/life-metric/metrics/{id}/logs?limit=500` | ✅ |
| `useMetrics` | `getMetrics` | `GET /v1/life-metric/metrics` (수식 편집기 `@code` 제안용) | ✅ |
| `usePutMetricInputs(id)` | `putMetricInputs` | `PUT /v1/life-metric/metrics/{id}/inputs` `{values}` (null = 삭제) | ✅ |
| `useAddMetricLog(id)` · `useDeleteMetricLog(id)` | `addMetricLog` · `deleteMetricLog` | `POST /logs` · `DELETE /logs/{logId}` | ✅ |
| `useUpdateMetric(id)` | `updateMetric` | `PUT /v1/life-metric/metrics/{id}` (`formula`) | ✅ |
| `useDeleteMetric` | `deleteMetric` | `DELETE /v1/life-metric/metrics/{id}` | ✅ |

- 모든 mutation 은 성공 시 `["life-metric"]` 전체를 무효화합니다(다른 지표가 `@code` 로 이 값을 쓰기 때문).

## 기능 (L4)
### 기준값 저장
- 스키마의 BASELINE 항목 + 스키마 밖에 저장된 값을 입력칸으로. 숫자 항목은 숫자로, 날짜는 `yyyy-MM-dd` 문자열로 보냅니다. 빈 칸 = 삭제. 성공 토스트.
### 기록
- 키(LOG 항목 datalist, 직접 입력 가능)·값·메모 → Enter 또는 "기록". 선택한 키의 기록이 2건 이상이면 날짜별 LineChart.
- 목록의 ✕ 로 기록 삭제.
### 수식 편집
- 저장 시 백엔드가 문법·순환 참조를 검사합니다. 실패는 에러 토스트.

## 주의·예외
- 없는 지표·남의 지표는 백엔드 404 → "지표를 찾을 수 없습니다".
