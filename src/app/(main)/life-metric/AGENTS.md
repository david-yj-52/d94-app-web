# L3 · 화면: Life Metric 대시보드

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 life-metric**

## 개요
- **URL:** `/life-metric` · **파일:** `page.tsx` (클라이언트 컴포넌트)
- **목적:** 삶에서 수치화하기 어려운 요소(남은 수명·내 시급·km당 차량 비용 등)를 내가 정한 수식으로 숫자로 환산해 카드로 봅니다. 계획: d94 Docs `life_metric 서비스 기획 및 개발 계획서`, CIRA LMTR-1~6.
- **진입:** 홈 대시보드 "실험 모듈 › Life Metric" 카드
- **접근:** 보호 경로 (`routeAccess.ts` `PROTECTED_PREFIXES`)
- 상세: [[metricId]](./[metricId]/AGENTS.md)

## 화면 구성
```
life-metric/page.tsx   (creating 상태, 조립)
├── 제목 + "새 지표" 버튼
├── MetricCard 그리드 (1 / sm:2 / lg:3 열) · 로딩 SkeletonCard · 빈 안내
└── {creating && <MetricCreateModal onClose onCreated=상세로 이동/>}
```
컴포넌트 카드: [lifeMetric](../../../components/lifeMetric/AGENTS.md)

## 데이터
| 훅 | API | 엔드포인트 | mock |
|---|---|---|---|
| `useMetrics` (`["life-metric","metrics"]`) | `getMetrics` | `GET /v1/life-metric/metrics` (값·error 포함) | ✅ |
| `useMetricTemplates` (`["life-metric","templates"]`) | `getMetricTemplates` | `GET /v1/life-metric/templates` | ✅ |
| `useCreateMetric` | `createMetric` | `POST /v1/life-metric/metrics` | ✅ |
| `useFormulaPreview` (`["life-metric","preview",{formula,inputs}]`, 400ms 디바운스) | `previewFormula` | `POST /v1/life-metric/preview` | ✅ (계산 안 함) |

- 백엔드: d94-query `LifeMetricController` (`/api/v1/life-metric`, 테이블 `SN_LIFE_METRIC*`, `V610`). 수식 계산은 백엔드 `LifeMetricFormulaEngine` 만 합니다.

## 기능 (L4)
### 지표 생성 (MetricCreateModal)
- **템플릿 모드(기본):** 템플릿 카드 선택 → 코드·이름 자동 채움 → 만들기. 백엔드가 템플릿의 입력 항목·수식·단위를 복사합니다.
- **커스텀 수식 모드:** 입력 항목(키·라벨·기준값/기록·숫자/날짜·단위) 정의 + `FormulaEditor`(`@` 입력 시 내 지표 코드 제안) + 미리보기(기준값 예시 입력, 기록 집계는 0).
- 템플릿 선택 후 "이 템플릿의 수식 고치기" → 템플릿 내용을 채운 채 커스텀 모드로.
- 성공 시 상세(`/life-metric/{id}`)로 이동. 실패(코드 형식·중복 409·수식 문법·순환 참조 400)는 모달 안에 백엔드 메시지를 표시합니다.

## 주의·예외
- mock 모드는 수식을 계산하지 않고 `value=null` + 안내 error 를 돌려줍니다(`src/lib/mock/lifeMetric.ts`).
- 지표 코드는 생성 후 바꿀 수 없습니다(다른 지표의 `@code` 참조 보호).
