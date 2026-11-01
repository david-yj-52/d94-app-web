# 테스트 보고서 — CIRA (d94-web)

> 계층: [L1 프로젝트](../AGENTS.md) › docs › **test-report**
> 도구·규칙: [testing.md](testing.md). 이 문서는 실행 결과와 결함 기록입니다.
> 진행: ① 2026-10-31 테스트 도입·결함 보고(코드 수정 없음) → ② 같은 날 사용자 승인 후 **웹 결함 수정**(§7). 아래 수치는 ② 이후입니다.

## 1. 실행 정보

| 항목 | 값 |
|---|---|
| 실행일 | 2026-10-31 |
| 환경 | Windows 11, Node 24.21.0, npm 11.19.0, Vitest 4.1.12 (jsdom 27.4.0) |
| 비교 기준 백엔드 | d94-query 작업 사본(`interfaces/controller/cira/*`, `apService/cira/dto/*`, lib-core `ApiResponse`·`UserResponse`), 같은 날 확인. 여기에 d94-query 통합 테스트 세션이 알려 준 계약(스프린트 상태 값, 이슈 생성 필수값, varchar(255), 이메일 assigneeId 는 그대로 저장)을 반영 |
| `npx tsc --noEmit` | 통과 (오류 0) |
| `npm test` | 테스트 파일 19개 통과, 테스트 107개 = **통과 106 + 예상 실패(`it.fails`, 남은 결함) 1**, 실패 0. 3회 연속 같은 결과 |
| `npm run test:coverage` | 위와 같은 결과 + 아래 §3 |
| `npm run docs:check` | 오류 0 |

## 2. 테스트 목록

| 파일 | 테스트 | 남은 결함(`it.fails`) | 확인 내용 |
|---|---|---|---|
| `src/lib/api/issues.test.ts` | 8 | 0 | 경로·필터 파라미터(배열은 반복 키)·Spring Page 응답, 생성 필수값·255자 제한 시 500 |
| `src/lib/api/projects.test.ts` | 3 | 0 | 경로·본문 |
| `src/lib/api/boards.test.ts` | 5 | 0 | 보드·컬럼·이동 경로와 본문 |
| `src/lib/api/sprints.test.ts` | 2 | 0 | 9개 함수 경로, `sprintStat` 값 |
| `src/lib/api/comments.test.ts` | 6 | 0 | `/v1/comments/{id}` 수정·삭제, 반응 토글 `{reactionType}`, 답글 `parentId` |
| `src/lib/api/notifications.test.ts` | 6 | 0 | 목록 → `NotificationPage` 변환, `{count}`, mock 모양 통과 |
| `src/lib/api/projectSettings.test.ts` | 3 | 0 | 멤버(`userNm`), 역할 변경 경로 `/role`, 워크플로우 상태 |
| `src/lib/api/client.test.ts` | 1 | 0 | 401 → `signOut` 1회, `/v1/auth/*` 제외 |
| `src/hooks/useIssues.test.ts` | 8 | 0 | queryKey, invalidate, 상태 변경 낙관적 갱신·롤백 |
| `src/hooks/useBoards.test.ts` | 16 | 0 | queryKey, invalidate, 칸반 순서 계산(제자리 포함)·서버 응답 반영·롤백 |
| `src/hooks/useSprints.test.ts` | 8 | 0 | queryKey, invalidate 7종 |
| `src/hooks/useComments.test.ts` | 5 | 0 | queryKey, invalidate 4종 |
| `src/hooks/useProjects.test.ts` | 2 | 0 | queryKey, invalidate |
| `src/hooks/useNotifications.test.tsx` | 4 | 0 | 로그인 전 조회 안 함, 기준선, 새 알림 토스트, unread-count 무효화 |
| `src/components/issue/CreateIssueModal.test.tsx` | 7 | 1 | 검증, 빈 선택 항목, 초기 상태, 멤버 담당자, 성공·오류 처리, issueTypeId |
| `src/components/sprint/CompleteSprintModal.test.tsx` | 2 | 0 | 백로그로 완료, 다음 스프린트(Planned) 선택 후 완료 |
| `src/components/board/KanbanBoard.test.tsx` | 7 | 0 | HTML5 DnD 드롭 → 요청·화면 순서·제자리·롤백·토스트 |
| `src/components/layout/NotificationBell.test.tsx` | 7 | 0 | 배지(99+·0), 지연 조회, 클릭 읽음·이동, 모두 읽음, 바깥 클릭 |
| `src/lib/mock/router.test.ts` | 7 | 0 | mock ↔ 백엔드 모양·경로·값 차이 고정(§5) |
| **합계** | **107** | **1** | |

**실패 목록:** 없음. 남은 `it.fails` 1개는 일시적으로 `it` 으로 바꿔 실행해 **의도한 단언**(`issueTypeId` 없음)에서 실패하는 것을 확인했습니다.

## 3. 커버리지 (`coverage/coverage-summary.json`)

측정 범위: `src/lib/api/**/*.ts`, `src/hooks/**/*.ts`, `src/components/{board,issue,layout,sprint}/**/*.tsx`, `src/lib/mock/router.ts` (테스트 파일 제외). 테스트를 쓰지 않은 도메인(위키·자동화·리포트 등)의 api·훅도 범위에 들어 있어 전체 수치가 낮습니다.

| 전체 | 비율 | 커버/전체 |
|---|---|---|
| Statements | 36.69% | 754/2055 |
| Branches | 28.51% | 292/1024 |
| Functions | 31.79% | 268/843 |
| Lines | 38.84% | 686/1766 |

폴더별 (파일별 수치를 합산):

| 폴더 | Lines | Statements | Branches | Functions |
|---|---|---|---|---|
| `src/lib/api` | 101/224 | 108/235 | 37/87 | 44/104 |
| `src/hooks` | 194/367 | 201/376 | 35/59 | 113/244 |
| `src/components/board` | 69/136 | 71/139 | 54/120 | 17/53 |
| `src/components/issue` | 20/253 | 21/286 | 20/182 | 9/120 |
| `src/components/layout` | 39/108 | 43/120 | 35/76 | 14/40 |
| `src/components/sprint` | 25/65 | 25/66 | 26/77 | 9/23 |
| `src/lib/mock` (router.ts) | 238/613 | 285/833 | 85/423 | 62/259 |

테스트 대상 파일 (%, Lines / Statements / Branches / Functions):

| 파일 | L | S | B | F |
|---|---|---|---|---|
| `lib/api/issues.ts` | 100 | 93.33 | 83.33 | 100 |
| `lib/api/projects.ts` | 100 | 100 | 100 | 100 |
| `lib/api/boards.ts` | 100 | 100 | 100 | 100 |
| `lib/api/sprints.ts` | 100 | 100 | 100 | 100 |
| `lib/api/comments.ts` | 100 | 100 | 100 | 100 |
| `lib/api/notifications.ts` | 100 | 100 | 88.88 | 100 |
| `lib/api/client.ts` | 100 | 100 | 85.71 | 100 |
| `lib/api/projectSettings.ts` | 37.5 | 37.5 | 100 | 33.33 |
| `hooks/useIssues.ts` | 100 | 100 | 87.5 | 100 |
| `hooks/useBoards.ts` | 100 | 100 | 80 | 100 |
| `hooks/useSprints.ts` | 100 | 100 | 100 | 100 |
| `hooks/useComments.ts` | 100 | 100 | 100 | 100 |
| `hooks/useProjects.ts` | 100 | 100 | 100 | 100 |
| `hooks/useNotifications.ts` | 100 | 100 | 100 | 100 |
| `components/issue/CreateIssueModal.tsx` | 100 | 100 | 90.9 | 100 |
| `components/sprint/CompleteSprintModal.tsx` | 92.59 | 92.59 | 86.66 | 81.81 |
| `components/board/KanbanBoard.tsx` | 59.52 | 59.77 | 65 | 26.47 |
| `components/board/KanbanColumn.tsx` | 78.57 | 78.57 | 81.81 | 66.66 |
| `components/board/KanbanCard.tsx` | 75 | 75 | 71.42 | 50 |
| `components/layout/NotificationBell.tsx` | 95.12 | 91.48 | 94.59 | 87.5 |
| `lib/mock/router.ts` | 38.82 | 34.21 | 20.09 | 23.93 |

`KanbanBoard` 의 나머지는 컬럼·보드 삭제 확인 모달과 컬럼 추가 모달 경로입니다(테스트 안 함).

## 4. 결함 목록

심각도: **높음** = 실제 백엔드에서 기능이 동작하지 않음 / **중간** = 데이터가 틀리게 저장·표시됨 / **낮음** = UX.
상태: ✅ 수정(§7, 테스트를 `it` 으로 바꿈) / ⏳ 남음.

| # | 심각도 | 상태 | 결함 | 영향 | 수정 내용 / 남은 일 |
|---|---|---|---|---|---|
| D13 | 높음 | ⏳ 일부 | 이슈 생성에 `statusId`·`issueTypeId` 를 보내지 않음 | **운영 "이슈 생성 500" 의 실제 원인.** d94-query `IssueService.mapToResponse` 의 `findByIdOptional(null)` → 트랜잭션 rollback-only → `UnexpectedRollbackException` → 500 | ✅ `statusId` 는 워크플로우 첫 상태(sortOrd 최솟값)를 보낸다. ⏳ `issueTypeId` 는 **d94-query 에 이슈 유형 목록 API 가 없고 전역 유형 테이블도 비어 있어** 웹만으로는 못 고친다 → 남은 테스트: `CreateIssueModal.test.tsx` › `[결함·백엔드 대기] 생성 요청에 issueTypeId 를 담는다`. 백엔드에 유형 목록 API + 시드(또는 기본 유형 처리)가 생기면 폼에 유형 선택을 넣는다. **그 전까지 실제 백엔드에서 이슈 생성은 계속 500** |
| D1 | 높음 | ✅ | 담당자 칸이 이메일을 `assigneeId` 로 보냄 | d94-query 가 이메일을 사용자 objId 자리에 그대로 저장 → 담당자가 비어 보이고 필터·알림이 닿지 않음 | 담당자를 **프로젝트 멤버 선택**(`useProjectMembers`)으로 바꾸고 `userId` 를 보낸다 |
| D2 | 높음 | ✅ | 스토리 포인트를 비우면 제출이 조용히 막힘 | `valueAsNumber` → NaN → zod 거부, 오류 표시 없음 | `setValueAs` 로 빈 값 → `undefined` |
| D3 | 높음 | ✅ | 우선순위 "선택 안 함"이면 제출이 조용히 막힘 | `""` 를 `z.enum().optional()` 이 거부 | `setValueAs: v => v \|\| undefined` |
| D4 | 높음 | ✅ | 스프린트 상태 필드·값 불일치 | 백엔드 `sprintStat` = `Planned`/`Active`/`Completed` 를 web 이 `status` = `CREATED`/`ACTIVE`/`COMPLETED` 로 읽음 → 스프린트 화면 배지·버튼, 번다운 활성 스프린트가 틀림 | `types/sprint.ts` 를 백엔드 계약(`sprintStat`, 백엔드 값)으로 바꾸고 화면 비교문·mock 을 맞춤. `issueCount`(백엔드에 없음) 제거 |
| D14 | 높음 | ✅ | 스프린트 완료 모달의 다음 스프린트 후보가 항상 비어 있음 | D4 의 화면 영향 | `s.sprintStat === "Planned"` 로 후보 선택 |
| D5 | 높음 | ✅ | 댓글 수정 경로가 백엔드에 없음 (500) | | `PUT /v1/comments/{commentId}` |
| D6 | 높음 | ✅ | 댓글 삭제 경로가 백엔드에 없음 (500) | | `DELETE /v1/comments/{commentId}` |
| D7 | 높음 | ✅ | 반응 추가 본문 `{emoji}` (400) | | `{reactionType}` |
| D8 | 높음 | ✅ | 반응 취소 엔드포인트가 백엔드에 없음 (500) | | `addReaction`/`removeReaction` → **`toggleReaction`** 하나(POST 토글), 훅 `useToggleReaction` |
| D9 | 중간 | ✅ | 응답의 반응 이름을 `emoji` 로 읽음 | 반응 칩이 비어 보임 | `CommentReaction.reactionType` |
| D10 | 중간 | ✅ | 답글이 `parentCommentId` 로 나가 최상위 댓글로 저장 | | `CreateCommentRequest.parentId` (`CommentResponse.parentId` 도 추가) |
| D11 | 낮음 | ✅ | 카드를 제자리에 놓으면 컬럼 끝으로 감 | | `KanbanBoard.handleDrop` 이 `beforeIssueId === issueId` 면 요청하지 않음, `useMoveIssue` 도 그 경우 낙관적 갱신을 하지 않음 |
| D12 | 추정 | ✅ | 배열 파라미터가 `status[]=a` 로 나감 | Spring `List<String>` 바인딩 실패 가능 | `apiClient` 에 `paramsSerializer: {indexes: null}` → `status=a&status=b` (모든 API 공통) |
| D15 | 중간 | ✅ (수정 중 발견) | 멤버 이름 필드 `userNm` 을 web 은 `name` 으로 읽음 | 설정 › 멤버 표의 이름이 비어 보임, 담당자 선택에 이름 없음 | `ProjectMemberResponse.userNm`, `MemberTable`·mock 수정 |
| D16 | 높음 | ✅ (수정 중 발견) | 멤버 역할 변경 경로 `PUT /members/{userId}` 가 백엔드에 없음 (500) | | `PUT /v1/projects/{id}/members/{userId}/role` (mock 도) |
| D17 | 중간 | ⏳ (수정 중 발견) | 멤버 역할 값 불일치 | 백엔드 `ADMIN \| DEVELOPER \| REPORTER \| VIEWER`, web `ProjectRole = "ADMIN" \| "MEMBER"` → `MEMBER` 로 추가·변경하면 백엔드가 모르는 값, 백엔드의 `DEVELOPER` 등은 web 이 표시 못함 | **고치지 않음** — 역할 체계를 4개로 넓힐지(설정 화면 UI 변경) 정해야 함. 테스트 없음 |

백엔드 쪽 문제 (d94-query 통합 테스트 세션 확인, web 코드로는 고칠 수 없음):
- **운영 DB 텍스트 컬럼이 `varchar(255)`**: 이슈 content, 댓글 content, 알림 msg, 프로젝트 descr. 255자를 넘으면 저장이 실패합니다(500). web 폼은 길이를 제한하지 않습니다(이슈 제목만 500자). MSW 도 같은 제한을 둡니다(`issues.test.ts`·`comments.test.ts` 가 500 을 확인). 근본 수정은 컬럼을 `text` 로 넓히는 것입니다.
- **`@이메일` 멘션이 풀리지 않음**: 백엔드 정규식 `@([\w.-]+)` + `findByEmail` 조합으로는 `@user@domain` 이 이메일로 인식되지 않습니다.
- **이슈 유형**: 목록 API 없음 + 전역 유형 테이블 비어 있음 (D13).

## 5. mock 라우터 ↔ 백엔드 응답 모양 차이

`src/lib/mock/router.test.ts` 의 `KNOWN_DIFFS`. 표기: `-` 백엔드에만 있는 키, `+` mock 에만 있는 키, `~` 형태 다름. §7 수정으로 mock 의 스프린트·댓글·멤버를 백엔드 모양으로 맞췄습니다.

| 엔드포인트 | 남은 차이 | web 영향 |
|---|---|---|
| 응답 래퍼 (전체) | mock `{success, data}` / 백엔드 `{success, code, message, data}` | 없음 (web 은 `data` 만 읽음) |
| 삭제류 | mock `data: null` / 백엔드 `data` 키 없음 | 없음 |
| `GET /v1/projects/:id/issues` | `-empty -first -last -numberOfElements -pageable -sort`, `-content[].assignee.avatarUrl -content[].reporter.avatarUrl` | 없음 (web `PageResponse` 는 5개 필드만 사용) |
| `GET /v1/issues/:id` | `-assignee.avatarUrl -reporter.avatarUrl` (mock 은 키 생략, 백엔드는 null) | 없음 |
| `GET /v1/boards/:id` | `-columns[].issues[].rankStr` | 없음 (web 은 순서만 사용) |
| `GET /v1/issues/:id/comments` | `-[].parentId`(최상위, 백엔드 null), `-[].author.avatarUrl`, 답글 `-replies[].reactions -replies[].replies -replies[].author.avatarUrl` | 없음 (선택 필드) |
| `GET /v1/projects/:id/members` | `-[].avatarUrl` | 없음 |
| `GET /v1/notifications` | mock 페이지 객체(web 필드 `isRead`·`body`) / 백엔드 목록(`read`·`message`·`resourceType`…) | 없음 (`getNotifications` 가 둘 다 처리) |
| `GET /v1/notifications/unread-count` | mock 숫자 / 백엔드 `{count}` | 없음 (`getUnreadCount` 가 둘 다 처리) |
| `GET /v1/users/search` | `-[].id -[].avatarUrl` | 없음 (멘션은 email 만 사용, 담당자는 멤버 `userId`) |

없어진 차이: 스프린트(`sprintStat`·값·`issueCount`), 댓글(`reactionType`·답글 `parentId`), 댓글 경로(`/v1/comments/{id}`, 반응 POST 토글), 멤버(`userNm`, `/role` 경로).

mock 이 백엔드보다 너그러운 점 (일부러 둠 — mock 모드 화면 확인용):
- `statusId`·`issueTypeId` 없이도 이슈를 만든다(백엔드는 500). web 이 `issueTypeId` 를 보낼 수 없어서(D13) mock 까지 막으면 mock 모드에서 이슈를 만들 수 없다.
- 255자 제한이 없다. 이메일 `assigneeId` 로도 담당자를 채운다.

## 6. 기타

- 테스트 도입 때 바뀐 기존 파일: `package.json`(devDependencies 9개, `test`·`test:coverage` 스크립트), `package-lock.json`(새 패키지 + 기존 `postcss` 8.5.29 → 8.5.32, 범위 `^8.4.49` 안의 패치), `.gitignore`(`/coverage`), `scripts/check-docs.mjs`(`*.test.ts(x)` 를 컴포넌트·훅 목록 검사와 미갱신 경고에서 제외).
- `@testing-library/dom` 은 `@testing-library/react` 16 의 peer 라 함께 설치했습니다.
- 설치 시 npm 이 `msw` postinstall(브라우저용 워커 파일 생성)을 실행하지 않았습니다. Node(`msw/node`)만 쓰므로 영향 없습니다.

## 7. 수정 기록 (2026-10-31, 웹 결함 수정)

| 파일 | 변경 | 결함 |
|---|---|---|
| `src/types/sprint.ts` | `status` → `sprintStat`, `SprintStatus = "Planned" \| "Active" \| "Completed"`, `issueCount` 삭제 | D4 |
| `src/app/(main)/projects/[projectId]/sprints/page.tsx`, `reports/burndown/page.tsx`, `components/sprint/CompleteSprintModal.tsx` | 상태 비교를 새 값으로 | D4·D14 |
| `src/types/comment.ts` | `CommentReaction.reactionType`, `CommentResponse.parentId`, `CreateCommentRequest.parentId` | D9·D10 |
| `src/lib/api/comments.ts` | `updateComment(commentId, data)`, `deleteComment(commentId)` → `/v1/comments/{id}`; `addReaction`·`removeReaction` → `toggleReaction(commentId, reactionType)` | D5–D8 |
| `src/hooks/useComments.ts` | `useAddReaction`·`useRemoveReaction` → `useToggleReaction` | D8 |
| `src/components/issue/CommentSection.tsx` | 토글 훅, `reactionType`, `parentId` | D8–D10 |
| `src/components/issue/CreateIssueModal.tsx` | 우선순위·포인트 빈 값 → `undefined`, 담당자 = 멤버 select(`userId`), `statusId` = 워크플로우 첫 상태, 우선순위 select 에 `aria-label` | D1–D3, D13(일부) |
| `src/types/member.ts`, `components/project/settings/MemberTable.tsx` | `name` → `userNm` | D15 |
| `src/lib/api/projectSettings.ts` | 역할 변경 경로 `/members/{userId}/role` | D16 |
| `src/components/board/KanbanBoard.tsx`, `src/hooks/useBoards.ts` | 제자리 드롭 무시 | D11 |
| `src/lib/api/client.ts` | `paramsSerializer: {indexes: null}` | D12 |
| `src/lib/mock/data.ts`, `src/lib/mock/router.ts` | 스프린트·댓글·멤버를 백엔드 모양·경로로 | — |

화면 동작은 브라우저로 확인하지 않았습니다(사용자 확인 예정). 특히 확인할 곳: 스프린트 화면 상태 배지·버튼, 이슈 생성 모달의 담당자 목록, 댓글 반응·답글·수정·삭제, 설정 › 멤버 이름 표시.
