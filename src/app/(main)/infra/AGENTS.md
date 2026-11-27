# L3 · 화면: 인프라 종합 현황

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 infra**

## 개요
- **URL:** `/infra` · **파일:** `page.tsx` (클라이언트 컴포넌트)
- **목적:** 테넌트 공용 장비(delap·OCI VM·Jetson·ESP32·Vercel)의 스펙·사용률·유휴 메모리를 한곳에서 봅니다. 설계: d94 Docs `D94 통합 리소스 및 사용량 관리 서비스 설계서`.
- **진입:** 홈 대시보드 "실험 모듈 › 인프라" 카드
- **접근:** 보호 경로 (`routeAccess.ts` `PROTECTED_PREFIXES`). 조회는 로그인 사용자 전체, 등록·수정은 ADMIN(버튼은 `useIsAdmin` 일 때만, 권한 검사는 백엔드)
- 상세: [[nodeKey]](./[nodeKey]/AGENTS.md)

## 화면 구성
```
infra/page.tsx   (filter·creating 상태, 조립)
├── 제목 + "노드 등록" 버튼(ADMIN)
├── 위치 필터 탭(전체·Home·OCI·Vercel) + 요약(노드 수·Online·메모리 사용/전체/유휴)
├── NodeCard 그리드 (1 / sm:2 / lg:3 열) · 로딩 SkeletonCard · EmptyState
└── {creating && <NodeFormModal onClose/>}
```
컴포넌트 카드: [infra](../../../components/infra/AGENTS.md)

## 데이터
| 훅 | API | 엔드포인트 | mock |
|---|---|---|---|
| `useInfraNodes` (`["infra","nodes"]`, 60초 재조회) | `getInfraNodes` | `GET /v1/infra/nodes` (스펙 + 최신 메트릭 + `online`·`memFreeMb`·`gpuMemFreeMb`) | ✅ |
| `useSaveInfraNode` | `createInfraNode` | `POST /v1/infra/nodes` (ADMIN) | ✅ |
| `useIsAdmin` | `getMe` | `GET /v1/users/me` | ✅ |

- 백엔드: d94-query `InfraController` (`/api/v1/infra`, 테이블 `SN_INFRA_*`, `V640`). 메트릭은 `d94-infra-agent`(d94-query `infra-agent/`)가 60초마다 `POST /ingest/{nodeKey}` 로 보냅니다. 처음 보는 키는 그때 자동 등록됩니다.

## 기능 (L4)
### 위치 필터·요약
- 탭으로 `node.location` 을 거릅니다. 요약의 메모리 합계는 메트릭이 있고 `memoryTotalMb` 가 있는 노드만 셉니다(유휴 = 각 노드 `memFreeMb` 합).

### 노드 등록 (NodeFormModal)
- 키(`[a-z0-9][a-z0-9-]{0,49}`)·이름·유형·위치·상태(기본 `PLANNED`)·스펙·접속 가이드. 실패(형식 400·중복 409)는 모달 안에 백엔드 메시지.

## 주의·예외
- Online = `LAST_SEEN_AT` 3분 이내(백엔드 계산). 메트릭 원시 스냅샷은 7일 보관.
- 비밀번호·개인키는 받지 않습니다(키 힌트에 `PRIVATE KEY` 가 있으면 백엔드가 400).
