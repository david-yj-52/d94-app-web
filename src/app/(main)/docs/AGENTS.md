# L3 · 화면: Docs

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 docs**

## 개요
- **URL:** `/docs`, `/docs/[noteId]` (`?edit=1` 이면 편집으로 엶) · **파일:** `layout.tsx`, `page.tsx`, `[noteId]/page.tsx` (모두 클라이언트 컴포넌트)
- **목적:** 웹 버전 Obsidian형 **다중 vault** — 내 Private vault + 소속 CIRA 프로젝트의 Team vault(멤버 공유, 프로젝트에 첫 Task 가 생길 때 서버가 만듦). Markdown 노트를 폴더로 정리하고 `[[제목]]` 으로 잇습니다. 노트 본문(frontmatter `kind`·`stream`·`origin`, `#태그`, `- [ ]` 체크박스)이 원천이고 서버가 저장할 때 색인합니다. 계획: d94-note `docs/superpowers/plans/2026-11-21-docs-service.md`
- **진입:** 홈 "Docs" 카드 · **접근:** 보호 경로(`routeAccess.ts` `/docs`)
- **layout:** (lg 미만은 [폴더 · 노트] 버튼 → `ui/Dialog side="left"` 서랍. 화면을 옮기거나 빠른 전환·이름 입력·폴더 이동 창을 열면 닫힘 — 서랍의 포커스 가둠이 그 창들을 막지 않도록) 왼쪽 vault 선택(전체 통합·🔒 Private·👥 프로젝트) + vault 섹션별 폴더 트리 + Cmd/Ctrl+K 빠른 전환. 가운데·오른쪽은 각 page 가 그립니다.

## 화면 구성
컴포넌트 카드: [docs](../../../components/docs/AGENTS.md)
```
docs/layout.tsx
├── "노트 찾기 ⌘K" 버튼 → QuickSwitcher · "Task 모아보기" → [tasks](./tasks/AGENTS.md)
├── vault select ("전체 통합" | vault 하나 — layout 상태, 새로고침하면 통합)
├── DocsSidebar   (vault 섹션별 폴더 트리·폴더별 노트, 폴더 ··· 메뉴: 새 노트·하위 폴더·이름 변경·이동·삭제)
├── {children}
├── FolderPickerModal (폴더 이동)  ·  DocsDialog (이름 입력·삭제 확인)  ·  {ToastComponent}
docs/page.tsx            아이디어 빠른 기록 + RAG 지식 검색(전체 또는 vault 선택) + 최근 노트 15개
docs/[noteId]/page.tsx   mode 하나로 보기·편집·버전 미리보기 (CIRA 위키와 같은 패턴)
├── 가운데: 폴더 경로·제목·[종류▾(승격)][파생][CIRA Task로 등록][지식화][편집][폴더 이동][삭제] + NoteMarkdown | NoteEditor
├── 오른쪽(lg 미만은 본문 아래): NoteSidePanel(속성·태그·Task·백링크·파생 노트) | NoteVersionHistory
└── DeriveModal (파생) · PromoteToCiraModal (CIRA Task로 등록)
```

## 데이터
| 훅 | 엔드포인트 | mock |
|---|---|---|
| `useDocsVaults` | `GET /v1/docs/vaults` | ✅ (Private 하나) |
| `useDocsFolders(vaultId)`, `useCreate/Rename/Move/DeleteDocsFolder` | `GET/POST /v1/docs/folders` (`vaultId`, 생성은 `{name, parentId, vaultId}`), `PUT /{id}`, `PUT /{id}/move`, `DELETE /{id}` | ✅ |
| `useNotes(filters, enabled?)` | `GET /v1/docs/notes` (layout 은 선택한 `vaultId`, home·useOpenNote 는 통합, 파생 노트는 `{origin: 제목, vaultId: 노트의 vault}`) | ✅ |
| `useNote`, `useUpdateNote`, `useMoveNote`, `useDeleteNote` | `GET/PUT/DELETE /v1/docs/notes/{id}`, `PUT /{id}/move` | ✅ |
| `useCreateNote` (useOpenNote) | `POST /v1/docs/notes` | ✅ |
| `useBacklinks`, `useNoteVersions` | `GET /v1/docs/notes/{id}/backlinks`, `/versions` (이력 패널을 열 때만) | ✅ |
| `useNoteTitles` (QuickSwitcher) | `GET /v1/docs/notes/titles?prefix=` | ✅ |
| `useChangeNoteKind`, `useDeriveNote` | `PUT /v1/docs/notes/{id}/kind`, `POST /{id}/derive` | ✅ |
| `useAutosaveNote`, `useUploadDocsImage`, `useInvalidateDocs` | `PUT /v1/docs/notes/{id}`(자동 저장), `POST /v1/docs/images` | ✅ |
| `useProjects`, `useIssueTypes`, `usePromoteNoteToCira` (CIRA Task로 등록) | `GET /v1/projects`, `GET /v1/issue-types`, `POST /v1/projects/{id}/docs/notes/{noteId}/promote-to-cira` (`spaceId` = 고른 작업 공간, 없으면 기본) | ✅ (Task 만 생성) |
| `useSetDocsTaskStatus`, `usePromoteDocsTask` | `PUT /v1/docs/tasks/{noteId}/{lineNo}`, `POST …/promote` | ✅ |

## 기능 (L4)
### 링크 열기·만들기
- 본문 `[[A]]`·`[[A|별칭]]` 은 `toMarkdownLinks` 로 `#note:A` 링크가 되고, NoteMarkdown 이 버튼으로 그립니다. 없는 노트(응답 `links[].exists=false`)는 회색.
- 클릭 → `useOpenNote`: **이 노트의 vault 안에서** 제목으로 찾아 이동, 없으면 같은 vault·같은 폴더에 그 제목으로 만들고 `?edit=1` 로 이동합니다(Obsidian 동작).
### 편집·저장
- **Live Preview:** CodeMirror 편집기가 입력 즉시 제목·굵게·기울임·취소선·코드를 스타일링하고, 커서가 없는 줄은 `#`·`**` 같은 기호를 숨기며 이미지를 보여 줍니다(Obsidian 방식). 코드 블록은 언어별 하이라이트, `[[` 는 제목 자동완성.
- **자동 저장:** 입력이 멈추고 1.5초 뒤 서버 저장(`useAutosaveNote` — 이 노트 캐시만 갱신). 제목은 입력란을 떠나거나 Enter 때 저장. "완료" = 남은 입력 저장 후 보기로 돌아가며 Docs 캐시 전체 무효화(`useInvalidateDocs`). 서버 이력은 5분 안 같은 제목 재저장을 한 건으로 합칩니다.
- **장애 대비:** 바뀔 때마다 브라우저 IndexedDB 에 초안을 남깁니다. 서버 저장 실패(네트워크·5xx)면 "서버에 저장하지 못함 — 이 브라우저에 보관 중" 표시 후 10초마다 재시도. 다시 열었을 때 초안이 서버 내용과 다르면 "복원/버리기" 배너. 409(다른 곳에서 수정) 는 자동 저장을 멈추고 안내합니다.
- **이미지 붙여넣기:** 클립보드 이미지를 1MB 이하로 줄여(`shrinkImage`) `POST /v1/docs/images` 로 올리고, 주소 `/api/proxy/v1/docs/images/{id}` 를 이미지 Markdown 으로 넣습니다.
- 제목을 바꾸면 서버가 이 노트를 링크한 내 노트들의 `[[옛 제목]]` 을 고칩니다 → 노트 변경은 "docs" 키를 모두 무효화(`invalidateDocs`).
### Vault
- 선택: "전체 통합"이면 접근 가능한 vault 를 모두 섹션으로, 하나를 고르면 그 vault 만. 섹션 헤더의 [새 노트][새 폴더]는 그 vault 에 만듭니다. Team vault 는 프로젝트 멤버 모두가 보고 고칩니다(Private 는 본인만).
- 제목·폴더 이름 유일, `[[링크]]`·백링크·계보·파생·폴더 이동은 모두 vault 안에서만(다른 vault 폴더로 노트 이동은 서버 400, 폴더 이동 선택 목록도 같은 vault 만).
### 폴더
- 같은 상위 안 이름 중복 409, 자기 하위로 이동은 선택 목록에서 비활성(서버도 400), 비어 있지 않은 폴더 삭제 409.
### 빠른 전환
- Cmd/Ctrl+K → 제목 접두어 검색, ↑↓·Enter, 일치하는 노트가 없으면 "만들기".
### 보기 (Markdown 렌더링)
- GFM(표·취소선·체크박스), ``` 코드 블록 문법 하이라이트(`CodeBlock`), ```mermaid 다이어그램(`MermaidDiagram`, 처음 쓸 때 불러옴), 이미지.
### 진화 (승격·파생·Task)
- **승격:** 제목 옆 종류 선택(아이디어·문서·Task·지식) → 서버가 frontmatter `kind` 만 바꿔 저장(버전 +1).
- **파생:** 가지 아이콘 → DeriveModal(제목·트랙·종류) → 원본과 같은 폴더에 `origin: "[[원본]]"`·`stream` 이 붙은 노트를 만들고 `?edit=1` 로 이동. 원본의 "파생 노트"에 나타납니다.
- **CIRA Task로 등록:** 칸반 아이콘 → PromoteToCiraModal(내가 멤버인 프로젝트·Task 타입·제목) → 서버가 Task 를 만들고, 그 Task 의 메인 노트(팀 vault) frontmatter 에 `origin: "[[이 노트]]"` 를 겁니다. 성공하면 Task 상세로 이동. 원본이 Private 이면 vault 가 달라 계보 트리에는 이어지지 않습니다(크로스 vault 링크 미구현).
- **Task:** 본문의 `- [ ]` 줄이 Task 입니다. 오른쪽 Task 목록의 체크박스는 그 줄의 `[ ]`↔`[x]` 만 바꿔 저장, 그 줄이 바뀌었으면 409. "노트로 만들기" → 줄 내용을 제목으로 `kind: task` 노트를 만들고 줄을 `[[제목]]` 으로 바꾼 뒤 새 노트로 이동.
- **Docs RAG:** 문서 지식화 버튼을 누르면 현재 문서 버전을 청크로 임베딩해 Elasticsearch 에 색인합니다. 첫 화면 검색은 선택한 vault 또는 현재 사용자가 접근 가능한 전체 vault 를 대상으로 BM25 + 벡터 검색하며, 수정·삭제되었거나 현재 접근할 수 없는 노트의 오래된 색인 결과는 API 가 제외합니다.
### 버전
- 오른쪽 "버전 이력" → 버전을 고르면 가운데에 그 버전 본문(읽기 전용), "현재 버전으로" 로 복귀.

## 주의·예외
- 개인 vault: 남의 노트·폴더는 서버가 404. 공개(publish)는 추후(CIRA DOCS-30).
- 노트 삭제는 물리 삭제(버전 이력 포함, 되돌릴 수 없음) — 확인 다이얼로그에 명시.
- `useOpenNote` 는 목록(서버 최대 500건)으로 제목을 찾습니다. 그보다 많아지면 by-title API 로 바꿉니다.
- 들여쓰기 깊이(DocsSidebar)만 인라인 style(동적 수치).
