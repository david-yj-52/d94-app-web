# L2 · lib (`src/lib/`)

> 계층: [L1 프로젝트](../../AGENTS.md) › **L2 lib**

| 폴더/파일 | 역할 | 상태 |
|---|---|---|
| `api/` | axios 기반 도메인별 HTTP 함수 (`client.ts` + 17개 도메인) | ✅ 표준 |
| `auth/` | **서버 전용** 인증 헬퍼. `accessToken.ts`의 `readSessionToken(request)`(세션 쿠키를 읽기만, 만료 정책 적용)·`getBackendAccessToken(request)`, `sessionPolicy.ts` 만료 정책(유휴·절대·refresh 시점) ([ADR 0005](../../docs/decisions/0005-backend-token-server-only.md), [ADR 0007](../../docs/decisions/0007-cira-session-expiry-and-resume-plan.md)). 클라이언트에서 import 금지 | ✅ 표준 |
| `crypto/` | 로그인·회원가입 자격 증명 암호화 (WebCrypto) | ✅ 표준 |
| `mock/` | 개발용 in-memory mock 백엔드 (`DEV_MOCK_API`) | ✅ 임시 |
| `messaging/solace/` | Solace WebSocket 설정·훅 | 🧪 Solace 실험 전용 |
| `routeAccess.ts` | 미들웨어 경로 판정 `classifyPath(pathname)` → `"protected" \| "publicOnly" \| "open"`, 로그인 뒤 복귀 경로 검증 `safeCallbackUrl(raw)`(내부 경로만, 아니면 `/home`), `SESSION_EXPIRED_REASON`. 보호 접두사 `/cira`·`/interface-test`·`/study`·`/ayaan`·`/settings`·`/docs`·`/life-metric`·`/infra` ([architecture](../../docs/architecture.md)) | ✅ 표준 |
| `api.ts` | 구 fetch 래퍼 (서버·클라이언트 겸용) | 🧪 todo 실험 전용, 새 코드에서 사용 금지 |

## 1. API 함수 (`api/{domain}.ts`)

- `apiClient`(`./client`)만 사용합니다. 경로는 `/v1/...`이고, 실제 요청은 `/api/proxy/v1/...`로 나갑니다.
- 반환값은 `res.data.data`이고, 반환 타입을 명시합니다. 함수 하나가 HTTP 호출 하나를 맡으며 캐싱이나 상태 관리는 하지 않습니다.
- `apiClient`는 401 응답을 받으면 `refreshSession()`(세션 update, 탭 안에서 동시 요청은 하나로 합류) 뒤 원래 요청을 **한 번** 다시 보냅니다. 그래도 안 되면 `requestReauth()` 로 재로그인 모달을 띄우고 기다렸다가, 로그인하면 다시 보내고 모달을 닫으면 401 로 실패합니다. `/v1/auth/*`(로그인·회원가입) 요청의 401 은 제외합니다 → [ADR 0007](../../docs/decisions/0007-cira-session-expiry-and-resume-plan.md)
- `api/session.ts`: `refreshSession(active?)` — `GET /api/auth/csrf` 후 `POST /api/auth/session {csrfToken, data: {active}}`, 결과 true = 세션 살아 있음. `useReauthStore`(zustand `{open}`)·`requestReauth()`·`settleReauth(ok)` — 재로그인 모달 상태와 기다리는 요청들.
- `api/auth.ts`: 자격 증명은 **암호화해서만** 보냅니다 ([ADR 0004](../../docs/decisions/0004-credential-encryption.md)).
  - `getCredentialPublicKey()` → `GET /v1/auth/public-key` (`CredentialPublicKeyResponse`, 캐시하지 않음)
  - `registerUser(data)` → 공개키로 암호화해 `POST /v1/auth/register` 에 `{enc}` 전송
  - `loginWithCredentials({email, password})` → 암호화한 봉투를 `signIn("credentials", {enc})`로 보내고 성공 여부(boolean) 반환. 공개키 조회 실패는 throw. 백엔드 호출은 next-auth(`src/auth.ts`)가 서버에서 암호문 그대로 `${BACKEND_URL}/v1/auth/login`에 전달합니다.

- `api/settings.ts`: 기준정보 설정. `getSettings()` → `GET /v1/settings` (`SettingMap`, 없으면 `{}`), `updateSettings(changes)` → `PUT /v1/settings` (바뀐 키만, 응답은 전체 설정, ADMIN 아니면 403). 허용 키는 `general.logo.text`·`general.logo.font` (d94-query `SettingService`)
- `api/fields.ts`: CIRA 작업 공간 프리셋(구 프로젝트 타입, 경로는 `project-types` 그대로)·필드(d94-query `CiraFieldController`). 기준정보(쓰기 ADMIN): `getFieldCatalog` `GET /v1/cira/field-catalog`, `get/create/update/deleteProjectType` `/v1/cira/project-types[/{id}]`(그 프리셋으로 만든 공간이 있어도 삭제 가능), `replaceProjectTypeFields` `PUT /{id}/fields`(배열 순서 = 순서), `create/update/deleteGlobalField` `/v1/cira/custom-fields[/{id}]`, `getFieldUsage` `GET /{id}/usage`. 프로젝트(쓰기 프로젝트 ADMIN): `getProjectFields`·`replaceProjectFields` `/v1/projects/{id}/fields`, `create/update/deleteProjectField` `/v1/projects/{id}/custom-fields[/{cfId}]`, `getColumnPref`·`saveColumnPref`·`resetColumnPref` `GET·PUT·DELETE /v1/projects/{id}/column-pref`(→ `fieldKeys`). 필드 키는 `sys:<name>` / `cf:<id>`. 라이브러리(전역·타입 필드는 가져가면 복사본): `create/update/deleteTypeField` `/v1/cira/project-types/{id}/custom-fields[/{cfId}]`, `importToType` `POST …/custom-fields/import`(ADMIN), `getFieldLibrary` `GET /v1/projects/{id}/field-library`(→ `LibraryItem[]`, `importedAs` = 이미 가져온 복사본), `importToProject` `POST /v1/projects/{id}/custom-fields/import`(멤버). 본문 `{sourceFieldId}`
- `api/spaces.ts` (V650, d94-query `SpaceController`·`IssueController`·`CiraDocsController`): `getSpaces`·`createSpace` `/v1/projects/{id}/spaces`, `updateSpace`·`deleteSpace` `/v1/spaces/{spaceId}`(기본 공간·Task 남은 공간 삭제 409), `getFeatures(projectId, spaceId?)` `GET /v1/projects/{id}/features`, 산출물 규칙 `getGlobalDocRules`·`saveGlobalDocRules(issueTypeId, rules)` `/v1/cira/doc-rules[/{issueTypeId}]`(쓰기 ADMIN), `importDocRules(projectId, ruleIds?)` `POST /v1/projects/{id}/doc-rules/import`(잠금 복사), `getSpaceDocRules`·`saveSpaceDocRules` `/v1/spaces/{spaceId}/doc-rules[/{issueTypeId}]`.
- 작업 공간 소유(V650): `getWorkflowStatuses`·`createWorkflowStatus`·`getWorkflowTransitions`·`updateWorkflowTransitions`(`api/projectSettings.ts`), `getProjectFields`·`replaceProjectFields`·`createProjectField`·`importToProject`·`get/save/resetColumnPref`(`api/fields.ts`), `getBoards`(`api/boards.ts`)는 마지막 인자 `spaceId?` 를 쿼리 `?spaceId=` 로 보냅니다(없음 = 기본 공간). `getIssues` 필터 `spaceId`·`featureId`. `promoteNoteToCira(..., spaceId?)` — Team vault 노트는 그 노트 자체가 메인 문서가 됩니다.
- `api/issues.ts` `getIssues`: `filters.sort`(`"sys:dueDate,asc"`)를 `sort` 로 보냅니다. Task 생성·수정 본문의 `customFields` 는 `{"cf:<id>": 값}`(null = 삭제)
- `api/apiTokens.ts`: API 토큰(MCP·AI 도구용). `getApiTokens` `GET /v1/api-tokens`, `issueApiToken` `POST`(201, `{token, info}` — 원문은 이 응답 1회), `revokeApiToken` `DELETE /{id}`(204), `getApiTokenServices` `GET /services`, `setApiTokenService` `PUT /services/{service}` `{enabled}`(ADMIN 아니면 403)
- `api/lifeMetric.ts`: Life Metric(d94-query `LifeMetricController`). `getMetricTemplates` `GET /v1/life-metric/templates`, `getMetrics`·`getMetric`·`createMetric`·`updateMetric`·`deleteMetric` `/v1/life-metric/metrics[/{id}]`, `putMetricInputs(id, values)` `PUT …/{id}/inputs` `{values}`(null·"" = 삭제), `getMetricLogs(id, key?)` `GET …/{id}/logs?limit=500`, `addMetricLog`·`deleteMetricLog` `POST·DELETE …/{id}/logs[/{logId}]`, `previewFormula(formula, inputs)` `POST /v1/life-metric/preview`. mock: `mock/lifeMetric.ts` `registerLifeMetricMock(on)` — 수식은 계산하지 않고 `value=null` + 안내 error
- `api/infra.ts`: 인프라(d94-query `InfraController`). `getInfraNodes` `GET /v1/infra/nodes`, `getInfraNode` `GET …/{nodeKey}`(→ `{summary, services, processes}`), `getInfraMetrics(nodeKey, range)` `GET …/{nodeKey}/metrics?range=1h|6h|24h|7d`, `create/update/deleteInfraNode` `POST /v1/infra/nodes`·`PUT·DELETE …/{nodeKey}`, `saveInfraService(nodeKey, svc)`(id 없으면 POST, 있으면 PUT `…/services/{id}`), `deleteInfraService`. 쓰기는 ADMIN. mock: `mock/infra.ts` `registerInfraMock(on)` — 시드 노드 delap(온라인)·jetson-01(예정), 메트릭은 가짜 60분
- `api/users.ts`: `searchUsers(keyword)`, `getMe()` → `GET /v1/users/me` (`Me`, `roles` 는 `ROLE_` 접두사 없음)

## 1-1. 자격 증명 암호화 (`crypto/credential.ts`)

- 브라우저·Node·Edge 공용(WebCrypto만 사용). `encryptCredential(publicKey, purpose, fields)` → `EncryptedCredential` (`{v:1, alg:"RSA-OAEP-256+A256GCM", kid, key, iv, data}`).
- 평문에 `ts`(epoch ms)·`nonce`를 붙이고, AAD `d94-auth:v1:{login|register}`로 용도를 묶습니다. 형식은 d94-query `CredentialCryptoService`와 짝입니다. 바꾸면 양쪽을 같이 바꿔야 합니다.

```ts
import apiClient from "./client";
import type {MilestoneResponse} from "@/types/milestone";

export async function getMilestones(projectId: string): Promise<MilestoneResponse[]> {
    const res = await apiClient.get(`/v1/projects/${projectId}/milestones`);
    return res.data.data;
}
```

### 예외: `api/notifications.ts` 응답 변환
d94-query 응답이 web 타입과 달라 `res.data.data`를 그대로 돌려주지 않습니다. `getNotifications`는 목록(`read`·`message`·`resourceType`/`resourceId`)을 `NotificationItem`으로 바꾸고 `page`·`size`로 잘라 `NotificationPage`를 만듭니다(`resourceType === "ISSUE"`면 `issueId`, `issueKey`는 백엔드 값 그대로). `getUnreadCount`는 `{count}`에서 숫자를 꺼냅니다. mock은 이미 web 모양이라 그대로 통과시킵니다 → [known-issues](../../docs/known-issues.md)

### 파일 업로드
`apiClient`의 기본 헤더가 `application/json`이므로, `FormData`를 보낼 때는 헤더를 **명시적으로 제거**해야 합니다. 그래야 axios가 boundary를 포함해 헤더를 다시 설정합니다.
```ts
await apiClient.post(url, formData, {headers: {"Content-Type": undefined as unknown as string}});
```
현재 multipart 를 쓰는 곳은 없습니다. UMD 요청 본문 상한(1MB) 때문에 파일은 **조각으로** 보냅니다.
- 첨부: `api/attachments.ts` `startAttachmentUpload` → `putAttachmentUploadPart`(Blob, `application/octet-stream`) → `completeAttachmentUpload`(파일명·크기·MIME). 반복·재시도는 `useUploadAttachment`.
- 첨부 다운로드는 `/api/proxy` 가 아니라 `app/api/attachments/[id]/route.ts` 입니다. 백엔드에 `Range` 로 4MB씩 요청해 하나의 200 응답으로 잇습니다(UMD 응답 상한 5MB 우회, `maxDuration` 60초). `getDownloadUrl(id)` 가 이 경로를 줍니다.

### Study: `api/study.ts` · `study/`
- `saveStudyPosition(id, {sectionId, blockKey})` → `PUT /v1/study/documents/{id}/position` (마지막 읽던 위치). mock 은 시드 문서에 저장.
- `reparseStudyDocument(id)` → `POST /v1/study/documents/{id}/reparse` (저장된 원본 PDF로 비동기 재분석). mock 도 PARSING 상태를 거쳐 READY 로 돌아옵니다.
- 조각 업로드 `putStudyUploadPart`는 `Blob`을 `Content-Type: application/octet-stream`으로 보냅니다(UMD 본문 1MB 제한 → 서버가 정한 `partSize` 768KB). 조립·재시도는 `useUploadStudyDocument`.
- `study/segments.ts` `buildSegments` — 블록 텍스트를 단어 hit·마킹 경계로 자른다. `study/selection.ts` `rangeToAnchor` — 브라우저 선택 → `{start,end}BlockKey/Offset`(블록 요소 시작부터 `Range.toString().length`, 표 컨테이너 제외). 테스트 `study/study.test.ts`.
- `study/colors.ts` — 마킹 색 클래스, `errorMessage(e, fallback)`.
- mock: `mock/study.ts`의 `registerStudyMock(on)` (시드 문서 `mock-doc-1`, 업로드 complete 는 바로 READY).
- mock: `mock/fields.ts`의 `registerFieldsMock(on, presetOf)` (프리셋 SCRUM·KANBAN 시드, 기본 공간 프리셋으로 계산, 유효 필드·기본 컬럼 계산과 소속·복사 가져오기·`importedAs`·`copies` 만 흉내, 이름 중복 외 검증 없음). 프로젝트 생성 mock 은 `spaces` 가 있으면 그 공간들을 `mockSpaces` 에 만들고(첫 번째 = 기본) 첫 공간 프리셋을, 없으면 `presetTypeId` 를 `mockPreset` 에 기억하고, Task mock 은 `customFields` 를 병합합니다(null = 삭제).
- mock: `mock/apiToken.ts`의 `registerApiTokenMock(on)` (서비스 `all`·`cira`·`docs`·`study`·`interface-test`·`life-metric`·`infra`, 발급 시 가짜 원문 생성, dev 서버 재시작 시 초기화).

### Docs: `api/docs.ts` · `docs/`
- `api/docs.ts`: d94-query `/api/v1/docs` 와 짝. vault `getDocsVaults`, 폴더 `getDocsFolders(vaultId="ALL")`·`createDocsFolder(name, parentId, vaultId?)`·`create/rename/move/deleteDocsFolder`, 노트 `getNotes(filters)`(`folderId=""` 최상위만)·`getNoteTitles`·`getNoteByTitle`·`getNote`·`create/update/move/deleteNote`(수정은 `version` 필수, 불일치 409)·`getNoteVersions`·`getBacklinks`, 진화 `deriveNote`·`changeNoteKind`·`getLineage`, 그래프 `getDocsGraph({noteId?, depth?})`, Task `getDocsTasks`·`setDocsTaskStatus`·`promoteDocsTask`, 이미지 `uploadDocsImage(blob)`(`application/octet-stream`, 형식은 서버가 앞 바이트로 판별)·`docsImageUrl(id)`(`/api/proxy/v1/docs/images/{id}`).
- `docs/drafts.ts` `loadDraft`·`saveDraft`·`deleteDraft` — 편집 초안 IndexedDB(`d94-docs`/`drafts`, 키 noteId). 열 수 없으면 조용히 건너뜀 → [conventions §7](../../docs/conventions.md)
- `docs/image.ts` `shrinkImage(blob)` — 900KB 이하·허용 형식이면 그대로, 아니면 긴 변 1920→800px·WebP 품질을 낮춰 가며 줄임(UMD 1MB 상한).
- `docs/error.ts` `docsError(e, fallback)` — 서버 오류 메시지(409 등) 또는 fallback.
- `docs/markdown.ts`: 서버 `DocsMarkdownIndexer` 와 같은 규칙의 화면용 도우미 — `stripFrontmatter`·`readFrontmatter`(단순 `key: value`)·`extractLinks/Tags/Tasks`, `toMarkdownLinks`(`[[A|별칭]]` → `[별칭](#note:A)`)·`titleFromHref`, `groupByStream`(계보 노드 → stream 별 열·세대). 테스트 `docs/markdown.test.ts`.
- `api/ciraDocs.ts`: d94-query `CiraDocsController`·`/v1/issue-types` 와 짝. `getIssueTypes`, `getDocRules`·`saveDocRules(projectId, issueTypeId, rules)`(통째 교체), `getIssueDocs`·`ensureIssueMainDoc`·`deriveIssueDoc`, `promoteNoteToCira`. mock(`router.ts`): 기준정보만 메모리 저장, Task 문서는 항상 "메인 없음", 승격은 Task 만 생성(`createMockIssue` 재사용).
- mock: `mock/docs.ts`의 `registerDocsMock(on)` (vault 는 `mock-private` 하나, 시드 폴더 `가이드`·노트 `시작하기`, 409·404·이름 변경 링크 치환·진화·그래프·Task·5분 버전 병합까지 백엔드 규칙과 같게, 이미지는 앞 바이트 판별 후 메모리 보관·`raw` 응답, dev 서버 재시작 시 초기화).

### 예외: `api/interfaceTests.ts`의 `callInterfaceTest`
통신 확인 화면 전용입니다. `res.data.data` 대신 `InterfaceCallResult`(상태·소요시간·`X-Trace-Id`·`Location`·본문)를 돌려주고, `validateStatus: () => true` 로 4xx·5xx 도 throw 하지 않습니다(따라서 401 에서도 refresh·재로그인을 하지 않음). 목록 조회 `getInterfaceTestItems` 는 표준 규칙을 따릅니다.

- 같은 모듈의 `sendPumpCommand("ON" | "OFF")` 는 `POST /v1/smartfarm/pumps/PUMP1/command` 를 호출합니다. d94-query 에서 ADMIN 인가 후 MQTT publish를 수행합니다.

### 타입
`src/types/{domain}.ts`에 `XxxResponse`, `CreateXxxRequest`, `UpdateXxxRequest`로 정의합니다. 페이지네이션은 `PageResponse<T>`(`types/issue.ts`)를 사용합니다.
CIRA 타입은 d94-query DTO 필드 이름·값 그대로입니다(스프린트 `sprintStat`, 댓글 반응 `reactionType`, 답글 `parentId`, 멤버 `userNm`). 예외는 알림(`api/notifications.ts` 변환)뿐입니다. `apiClient` 는 배열 파라미터를 반복 키(`status=a&status=b`, `paramsSerializer: {indexes: null}`)로 보냅니다 → [docs/test-report.md](../../docs/test-report.md)

### 테스트
- `api/{domain}.test.ts` 가 요청 경로·파라미터·본문과 응답 변환을 확인합니다(issues, projects, boards, sprints, comments, notifications, client). MSW 는 **d94-query 실제 응답 모양**(`src/test/msw/`)이고, d94-query 에 없는 경로는 500 을 줍니다 → [docs/testing.md](../../docs/testing.md)
- 남은 결함은 `it.fails` 로 표시합니다(현재 이슈 생성 `issueTypeId` 1건, 백엔드 유형 API 대기).

## 2. Mock 백엔드 (`mock/`)

`DEV_MOCK_API=true`이고 production이 아니면, `/api/proxy` 요청이 백엔드 대신 mock으로 처리됩니다.

- `data.ts`: 시드 데이터와 in-memory store(`getStore()`). dev 서버를 재시작하면 초기화됩니다.
- `router.ts`: `on(method, pattern, handler)`로 라우트를 등록합니다. `:param` 패턴을 지원합니다. 본문은 JSON 이면 객체, `application/octet-stream` 이면 `{bytes: Uint8Array}` 로 넘깁니다.

```ts
on("GET", "/v1/projects/:projectId/milestones", ({params}) =>
    ok(getStore().milestones.filter((m) => m.projectId === params.projectId)));
```

- 백로그 mock(`GET /v1/projects/:projectId/backlog`)은 `sprintId` 없는 이슈를 우선순위 높은 순으로 페이지네이션합니다(d94-query 와 같은 정렬). API 함수는 `api/sprints.ts` 의 `getBacklog`.
- 작업 공간 mock: 프로젝트마다 처음 조회할 때 기본 공간 "General"(`space-{projectId}`)을 만들고, 공간 추가·이름 변경·삭제만 메모리에 둡니다. 공간별 워크플로·필드는 흉내 내지 않습니다(`spaceId` 무시). Feature 트리는 빈 목록, 산출물 규칙 가져오기는 전사 규칙을 `locked: true` 로 복사. 이슈 유형 mock 에 `Feature`(V650 Epic 이름 변경)가 있습니다.
- **새 엔드포인트를 추가하면 mock 라우트도 함께 추가하세요.** 없으면 mock 모드에서 404가 납니다.
- 응답 헬퍼: `ok(data)` → `{success: true, data}`, `notFound(what)` → 404. 본문 없는 상태(`{status: 204}`)도 반환할 수 있습니다(프록시가 본문 없이 응답).
- 인터페이스 테스트 mock(`/v1/interface-tests`)은 백엔드와 같은 상태코드(201·204·400·404)를 돌려줍니다. 저장소는 `getStore().interfaceTests`.
- 첨부 조각 업로드 mock 은 바이트를 저장하지 않고 complete 에서 메타만 만듭니다. mock 모드의 `/api/attachments/[id]` 는 프록시 mock 다운로드(샘플 텍스트)로 redirect 합니다.
- 기준정보 mock(`/v1/settings`)은 메모리 맵에 병합 저장합니다(값 trim, 검증 없음 — 검증은 백엔드). `/v1/users/me` mock 은 화면 확인용으로 `roles: ["USER", "ADMIN"]` 입니다.
- 인증 mock(`/v1/auth/public-key`·`login`·`register`, 형태만 맞춘 `refresh`·`logout`)은 `credential.ts`의 실제 RSA 키(globalThis 보관, 재시작 시 새로 생성)로 봉투를 복호화합니다. 풀리지 않거나 평문이면 400 `AUTH_CREDENTIAL_INVALID`, 로그인은 비밀번호를 검사하지 않고 아무 계정이나 통과시킵니다. 핸들러는 `Promise<MockResult>`도 반환할 수 있습니다.
- mock 응답은 **web 타입 모양**이라 실제 d94-query 와 다른 곳이 있습니다. `mock/router.test.ts` 가 차이를 `KNOWN_DIFFS` 로 고정합니다(mock 이나 백엔드가 바뀌면 깨짐). 스프린트·댓글·멤버는 백엔드 모양·경로에 맞췄습니다. mock 은 `statusId`·`issueTypeId` 없는 이슈 생성과 255자 넘는 값을 받아 주므로, 그 경우 mock 에서 되고 실제 백엔드에서는 500 입니다.
- `enabled.ts`의 `isMockEnabled`는 `src/auth.ts`가 라우터 전체를 끌어오지 않도록 분리해 둔 것입니다(예전에는 미들웨어가 `auth.ts`를 import 했음. 지금 미들웨어는 `lib/auth/accessToken`만 씀). `router.ts`도 같은 함수를 다시 export 합니다.

## 3. Solace (`messaging/solace/`) 🧪

- `solaceConfig.ts`: 접속 정보입니다. ⚠️ `ws://localhost:8008`, VPN `TSH`, admin/admin이 **하드코딩**되어 있습니다(env 미사용).
- `useSolace.ts`: 연결, 구독, 발행을 감싼 훅입니다. 반환값은 `{isConnected, isConnecting, messages, error, connect, publish, disconnect, clearMessages}`입니다. 사용처는 [solace 화면](../app/(main)/solace/AGENTS.md)입니다.

## 4. 백엔드 API 명세

- 백엔드 요청은 `BACKEND_URL` → **UMD(server) → Redis → UMD(local) → 로컬 백엔드** 로 갑니다. UMD 는 경로·본문을 바꾸지 않습니다 → [docs/architecture.md](../../docs/architecture.md)
- UI 쪽 통신 규칙(상태코드 처리, 재시도, 35초 타임아웃, 1MB 요청 / 5MB 응답 상한): [UMD ui-guide](https://github.com/david-yj-52/d94-app-umd/blob/main/docs/integration/ui-guide.md)
- 엔드포인트별 명세 문서는 없습니다. CIRA 엔드포인트의 경로·응답 모양은 [d94-query](https://github.com/david-yj-52/d94-app-query) `interfaces/controller/cira/` 와 `apService/cira/dto/` 가 원본이고, `src/test/msw/handlers.ts`·`backendTypes.ts` 가 그것을 옮겨 둔 것입니다(2026-10-31 기준).
