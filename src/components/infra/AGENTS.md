# L2 · infra 컴포넌트 🧪

> 계층: [L1](../../../AGENTS.md) › [L2 components](../AGENTS.md) › **infra**
> 사용 화면: [infra](../../app/(main)/infra/AGENTS.md), [[nodeKey]](../../app/(main)/infra/[nodeKey]/AGENTS.md). 이 모듈 밖에서 import 하지 않습니다.

### NodeCard — `@/components/infra/NodeCard`
```ts
{ summary: NodeSummary }
```
- `/infra/{nodeKey}` 링크 카드. 이름·키·유형·위치, `PLANNED`/`MAINTENANCE` 배지, Online/Offline, 스펙 한 줄, CPU·메모리(유휴)·디스크·GPU 메모리 `UsageBar`, ESP32 heap·RSSI, Vercel 최근 배포 상태.

### UsageBar — `@/components/infra/UsageBar`
```ts
{ label: string; pct: number | null; detail?: string }
```
- 사용률 막대(`role="progressbar"`). 80% 이상 amber, 90% 이상 red. 너비만 인라인 style.

### NodeFormModal — `@/components/infra/NodeFormModal`
```ts
{ initial?: InfraNode; onClose: () => void; onSaved?: (nodeKey: string) => void }
```
- `ui/Dialog`. `initial` 이 있으면 수정(키 비활성). 안에서 `useSaveInfraNode`. 실패 메시지는 모달 안에.

### ServiceFormModal — `@/components/infra/ServiceFormModal`
```ts
{ nodeKey: string; initial?: InfraService; onClose: () => void }
```
- 이름·종류·포트·예상 메모리·엔드포인트·compose 경로·설명. 안에서 `useSaveInfraService(nodeKey)`.

### MetricChart — `@/components/infra/MetricChart`
```ts
{ data: InfraMetric[]; showGpu: boolean }
```
- Recharts 꺾은선(CPU·메모리·디스크·GPU %, y 0~100). 데이터가 없으면 안내 문구.

### ProcessTable — `@/components/infra/ProcessTable`
```ts
{ rows: InfraProcess[] }
```
- 이름(#pid)·종류 배지·메모리·MEM%·CPU%·명령/이미지(잘림, title 로 전체).

### format — `@/components/infra/format`
- `fmtMb`, `fmtPct`, `fmtUptime`, `infraError(e, fallback)`(서버 message), `parseExtra(json)`(깨지면 null).
