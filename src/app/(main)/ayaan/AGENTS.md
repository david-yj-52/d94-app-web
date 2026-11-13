# L3 · 화면: Ayaan 🧪

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 ayaan**

## 개요
- **URL:** `/ayaan`, `/ayaan/tasks`, `/ayaan/tasks/[taskId]`, `/ayaan/settings`, `/ayaan/setup` · **접근:** 보호 경로(`routeAccess.ts`)
- **목적:** d94-app-ayaan(AI CLI 작업·토큰 관리) 화면. API 는 `src/lib/api/ayaan.ts` (`/v1/ayaan/**`, 게이트웨이 경유). 설계: Brain `projects/david94/feature/app_ayaan/phase1/2026-11-10-ayaan-phase1-design.md` §7, TSTA-1(skill·사람 응답 요청·기획→개발) d94-app-ayaan `docs/specs/2026-11-12-ayaan-skills-approvals-design.md` §9.4
- **진입:** 홈 "실험 모듈 › Ayaan" 카드

## 화면 구성
| 파일 | 내용 |
|---|---|
| `page.tsx` | Tool 카드(창별 사용률 막대·reset까지 남은 시간·상태 배지·출처·관측 시각), `warnings` 배너, **응답 대기**(WAITING) 섹션, 진행/중단 작업, [지금 수집]. 30초 재조회 |
| `tasks/page.tsx` | 상태·Tool 필터 목록, [새 작업] 폼: CIRA 프로젝트 드롭다운(`useProjects`, 작업공간 매핑 없는 프로젝트는 비활성) → 이슈 드롭다운(`useIssues`, 최대 100건) 또는 프롬프트. 단계 라디오(기획부터[기본]/바로 개발), Skill 드롭다운(`skillOptions`: Tool·단계로 거름, 첫 항목 "Tool 기본값", 마지막 "사용 안 함"=`NONE`). 본문 변환은 `tasks/taskBody.ts`(`toCreateBody`) |
| `tasks/[taskId]/page.tsx` | `components/RequestPanel`(열린 요청: 질문·선택지 버튼·질문이면 자유 답변, 권한이면 [허용 1회][거부], START면 [실행][취소] / 요청 이력·응답자), 단계·skill·기획서 경로·기획 작업 링크, 실행 이력·토큰 합계·로그, [재개] [취소] — WAITING은 취소만 가능하고 재개는 답변으로, PLAN·DONE이면 [개발 작업 만들기] |
| `settings/page.tsx` | 탭(전역 정책/Tool/작업공간/Skill/권한). Tool 카드에 기획·개발 기본 skill 드롭다운. Skill 탭: 표 + 편집(플러그인은 `CLAUDE_PLUGINS` 후보, 저장 경고 표시). 권한 탭: 행 편집 후 전체 저장(PUT 전체 교체), Claude·전체 외 Tool의 ASK는 경고(`askWarning`). 입력마다 `HelpCard`(? 툴팁 + 펼침 설명). 저장 시 서버 422 메시지를 필드 옆에 표시 |
| `setup/page.tsx` | 7단계 체크리스트(7 = CLI 세션 보존, 선택), 명령 복사 버튼, 자동 점검 ✅/❌, [다시 점검] [테스트 알림], Claude 플러그인 섹션([플러그인 설치] → `POST /plugins/sync`, 설치 목록 `GET /plugins`) |

- `constant/help.ts`: 부록 A 설명 원문 + Tool 기본 skill(키 27개: 전역 12·Tool 11·작업공간 4). `constant/setupSteps.ts`: 부록 B 원문. DB 에 넣지 않습니다.
- `settings/skillPermission.ts`: `skillOptions`, `askWarning`, `toSkillBody`, `pluginRefs` (순수 함수, 테스트 동봉).
- 상태 배지: WAITING="응답 대기"(보라), PAUSED="한도 대기"(`format.ts` `statusLabel`).
- `settings/validate.ts`: 즉시 피드백용 범위 검증(서버 검증이 최종).
- 출처가 `USAGE_API`/`RULE`인 한도는 회색 + "추정" 배지. 시각은 UTC(zone 없음) → `Z` 를 붙여 Asia/Seoul 표시(`format.ts`).
- mock: `src/lib/mock/ayaan.ts` (DEV_MOCK_API)
