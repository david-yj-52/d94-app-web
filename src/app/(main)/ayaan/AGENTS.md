# L3 · 화면: Ayaan 🧪

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 ayaan**

## 개요
- **URL:** `/ayaan`, `/ayaan/tasks`, `/ayaan/tasks/[taskId]`, `/ayaan/settings`, `/ayaan/setup` · **접근:** 보호 경로(`routeAccess.ts`)
- **목적:** d94-app-ayaan(AI CLI 작업·토큰 관리) 화면. API 는 `src/lib/api/ayaan.ts` (`/v1/ayaan/**`, 게이트웨이 경유). 설계: Brain `projects/david94/feature/app_ayaan/phase1/2026-11-10-ayaan-phase1-design.md` §7
- **진입:** 홈 "실험 모듈 › Ayaan" 카드

## 화면 구성
| 파일 | 내용 |
|---|---|
| `page.tsx` | Tool 카드(창별 사용률 막대·reset까지 남은 시간·상태 배지·출처·관측 시각), `warnings` 배너, 진행/중단 작업, [지금 수집]. 30초 재조회 |
| `tasks/page.tsx` | 상태·Tool 필터 목록, [새 작업] 폼: CIRA 프로젝트 드롭다운(`useProjects`, 작업공간 매핑 없는 프로젝트는 비활성) → 이슈 드롭다운(`useIssues`, 최대 100건) 또는 프롬프트. 본문 변환은 `tasks/taskBody.ts`(`toCreateBody`) |
| `tasks/[taskId]/page.tsx` | 실행 이력·토큰 합계·로그, [재개] [취소] |
| `settings/page.tsx` | 탭(전역 정책/Tool/작업공간). 입력마다 `HelpCard`(? 툴팁 + 펼침 설명). 저장 시 서버 422 메시지를 필드 옆에 표시 |
| `setup/page.tsx` | 6단계 체크리스트, 명령 복사 버튼, 자동 점검 ✅/❌, [다시 점검] [테스트 알림], Claude 플러그인 섹션([플러그인 설치] → `POST /plugins/sync`, 설치 목록 `GET /plugins`) |

- `constant/help.ts`: 부록 A 설명 원문(키 25개: 전역 12·Tool 9·작업공간 4). `constant/setupSteps.ts`: 부록 B 원문. DB 에 넣지 않습니다.
- `settings/validate.ts`: 즉시 피드백용 범위 검증(서버 검증이 최종).
- 출처가 `USAGE_API`/`RULE`인 한도는 회색 + "추정" 배지. 시각은 UTC(zone 없음) → `Z` 를 붙여 Asia/Seoul 표시(`format.ts`).
- mock: `src/lib/mock/ayaan.ts` (DEV_MOCK_API)
