# L3 · 화면: 인프라 노드 상세

> 계층: [L1](../../../../../AGENTS.md) › [L2 app](../../../AGENTS.md) › [L3 infra](../AGENTS.md) › **[nodeKey]**

## 개요
- **URL:** `/infra/[nodeKey]` · **파일:** `page.tsx` (클라이언트 컴포넌트, `useParams`)
- **목적:** 노드 하나의 스펙·현재 사용량·접속 가이드·사용률 추이·프로세스/컨테이너 Top-N·서비스 문서
- **진입:** `/infra` 의 NodeCard

## 화면 구성
```
infra/[nodeKey]/page.tsx   (range·editing·svcEdit 상태, 조립)
├── 제목 + Online/상태 Badge + 수정·삭제(ADMIN, 삭제는 useConfirm)
├── 하드웨어·현재 사용량 (UsageBar × CPU·메모리·디스크·GPU, EXTRA_JSON 원문)
├── 접속 가이드 (ssh 명령 복사 — sshAlias 우선, 없으면 -p/-i/user@host 조립)
├── 사용률 추이 (range 탭 1h·6h·24h·7d → MetricChart)
├── 프로세스·컨테이너 Top-N (ProcessTable)
├── 서비스 목록 + 추가·수정·삭제(ADMIN)
└── {editing && <NodeFormModal initial/>} {svcEdit && <ServiceFormModal/>} Toast·Confirm
```

## 데이터
| 훅 | API | 엔드포인트 | mock |
|---|---|---|---|
| `useInfraNode` (`["infra","nodes",nodeKey]`, 60초) | `getInfraNode` | `GET /v1/infra/nodes/{nodeKey}` → `{summary, services, processes}` | ✅ |
| `useInfraMetrics` (`["infra","nodes",nodeKey,"metrics",range]`, 60초) | `getInfraMetrics` | `GET …/{nodeKey}/metrics?range=` (1h=1분·6h=5분·24h=15분·7d=1시간 평균) | ✅ |
| `useSaveInfraNode` · `useDeleteInfraNode` | `updateInfraNode` · `deleteInfraNode` | `PUT·DELETE /v1/infra/nodes/{nodeKey}` (ADMIN) | ✅ |
| `useSaveInfraService` · `useDeleteInfraService` | `saveInfraService` · `deleteInfraService` | `POST·PUT·DELETE …/{nodeKey}/services[/{id}]` (ADMIN) | ✅ |

## 기능 (L4)
### 노드 삭제
- 확인 창 → 삭제(서비스·스냅샷 CASCADE) → `/infra` 로 이동. 실패는 토스트.

## 주의·예외
- 프로세스 명령줄은 에이전트가 `password·token·secret·api_key` 뒤 값을 `***` 로 가린 뒤 500자로 자릅니다.
