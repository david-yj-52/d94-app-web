# L2 · lifeMetric 컴포넌트 🧪

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **lifeMetric**
> 사용 화면: [life-metric](../../app/(main)/life-metric/AGENTS.md), [[metricId]](../../app/(main)/life-metric/[metricId]/AGENTS.md). 이 모듈 밖에서 import 하지 않습니다.

### MetricCard — `@/components/lifeMetric/MetricCard`
```ts
{ metric: Metric }
```
- `/life-metric/{id}` 링크 카드. 이름·`@code`·현재 값+단위, 계산할 수 없으면 `error` 를 amber 로.

### MetricCreateModal — `@/components/lifeMetric/MetricCreateModal`
```ts
{ onClose: () => void; onCreated: (m: Metric) => void }
```
- 안에서 `useMetricTemplates`·`useMetrics`·`useCreateMetric`·`useFormulaPreview` 를 씁니다.
- 탭: 템플릿(카드 선택 + 코드·이름) / 커스텀 수식(입력 항목 행 편집 + `FormulaEditor` + 결과 단위 + 미리보기). 실패 메시지는 모달 안에.

### FormulaEditor — `@/components/lifeMetric/FormulaEditor`
```ts
{ value: string; onChange: (v: string) => void; codes: string[] }
```
- textarea(`aria-label="수식"`). 커서 앞이 `@부분코드` 면 `codes` 중 앞이 같은 것 최대 8개를 listbox 로 제안, 클릭·Enter 로 `@code ` 삽입. 아래에 지원 함수 안내.

### BaselineForm — `@/components/lifeMetric/BaselineForm`
```ts
{ metric: Metric; onSave: (values: Record<string, number | string | null>) => void; isPending: boolean }
```
- BASELINE 항목 + 스키마 밖 저장값. 날짜는 `<input type="date">`. 빈 칸 → null(삭제). 초기값은 마운트 때만 읽으므로 부모가 `key` 로 다시 그립니다.

### LogPanel — `@/components/lifeMetric/LogPanel`
```ts
{ metric: Metric; logs: MetricLog[]; onAdd: (req: LogRequest) => void; onDelete: (logId: number) => void; isPending: boolean }
```
- 빠른 입력(키 datalist·값·메모, Enter), 선택 키 Recharts `LineChart`(2건 이상), 최근 기록 목록 + ✕ 삭제.

### formulaRef (함수) — `@/components/lifeMetric/formulaRef`
```ts
refQueryAt(text: string, caret: number): string | null
insertRef(text: string, caret: number, code: string): { text: string; caret: number }
formatValue(v: number | null): string   // null → "—", |v|≥100 정수, 아니면 소수 2자리, ko-KR 구분자
```
- 테스트: `formulaRef.test.ts`.
