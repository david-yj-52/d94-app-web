# L3 · 화면: 위키 (CIRA)

> 계층: [L1](../../../../../../AGENTS.md) › [L2 app](../../../../AGENTS.md) › [L3 projects](../../AGENTS.md) › **L3 wiki**
> 컴포넌트 카드: [wiki](../../../../../components/wiki/AGENTS.md)

## 개요
- **URL:** `/projects/:projectId/wiki?pageId={id}` · **파일:** `layout.tsx`(ProjectNav), `page.tsx` (235줄)
- **목적:** 계층형 문서(트리)를 Tiptap 리치 텍스트로 작성하고, 버전 이력을 관리합니다.
- 선택한 페이지는 **URL 쿼리 `pageId`**로 관리합니다. 링크를 공유하거나 뒤로 가기를 해도 유지됩니다.

## 화면 구성
```
wiki/layout.tsx → ProjectNav + {children}
wiki/page.tsx  (WikiPageContent를 Suspense로 감쌈 — useSearchParams 사용)
├── 좌측: WikiTree (선택·하위 추가·삭제)                       → wiki 카드
├── 중앙: renderContent() — mode 에 따라
│   ├── "view"            WikiViewer (편집·이력 버튼)
│   ├── "edit"            WikiEditor (initial = 현재 페이지)
│   ├── "create"          WikiEditor (빈 값, createParentId 하위)
│   └── "version-preview" 선택한 과거 버전 미리보기
└── 우측: {showVersions && <WikiVersionHistory/>}
```
**한 화면에서 `mode` 상태 하나로 보기·편집·생성·미리보기를 전환하는 패턴**입니다.

## 데이터
- `useWikiTree(projectId)` `["wiki-tree", projectId]`
- `useWikiPage(pageId)` `["wiki-page", pageId]`
- `useWikiVersions(showVersions ? pageId : null)`: 패널을 열 때만 조회합니다.
- `useCreate/Update/DeleteWikiPage`

## 기능 (L4)
### 페이지 탐색
- 트리에서 노드를 클릭하면 `router.push(?pageId=)`로 이동하고, 해당 페이지를 조회합니다.
### 페이지 생성 (하위 포함)
- 트리의 + 버튼을 누르면 `createParentId`를 설정하고 `mode="create"`가 됩니다. 저장에 성공하면 생성된 페이지로 이동합니다.
### 편집
- 뷰어의 편집 버튼을 누르면 `mode="edit"`가 됩니다. WikiEditor가 HTML을 저장하고 `mode="view"`로 돌아갑니다.
### 삭제
- `confirm()`으로 하위 페이지까지 모두 삭제되는지 확인한 뒤 삭제하고, 위키 첫 화면으로 이동합니다.
### 버전 이력
- 이력 패널에서 버전을 고르면 `mode="version-preview"`로 해당 시점의 내용을 봅니다.

## 주의·예외
- 페이지가 `lib/api/wiki`를 직접 import합니다(타입 목적).
- 뷰어는 HTML을 `dangerouslySetInnerHTML`로 렌더링합니다. 외부 입력이 들어올 수 있다면 sanitize를 검토하세요.
