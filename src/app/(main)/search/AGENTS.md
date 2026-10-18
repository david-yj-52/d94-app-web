# L3 · 화면: 검색 (CIRA)

> 계층: [L1](../../../../AGENTS.md) › [L2 app](../../AGENTS.md) › **L3 search**

## 개요
| URL | 파일 | 설명 |
|---|---|---|
| `/search` | `page.tsx` (567줄) | 키워드 + 필터 검색, 저장 필터 |
| `/search/advanced` | `advanced/page.tsx` (255줄) | CQL(쿼리 언어) 고급 검색 |

- 진입 경로: 헤더 GlobalSearch, 알림 클릭(`/search?q={issueKey}`), 검색 화면의 "CQL 고급 검색" 링크

## 화면 구성
```
search/page.tsx  (SearchPageContent를 Suspense로 감쌈 — useSearchParams 사용)
├── 검색 입력 + 정렬(관련도/최신/업데이트)
├── 필터: 상태·우선순위 다중 선택, ActiveFilterTag(페이지 내부 컴포넌트)
├── 저장 필터 목록 + SaveFilterModal(페이지 내부 컴포넌트)
├── 결과 테이블 (키·제목·상태·우선순위·담당자) + 페이지네이션
└── 빈 상태 "검색 결과가 없습니다."

search/advanced/page.tsx
├── CqlEditor              → 카탈로그 §5
├── CqlSyntaxGuide         → 카탈로그 §5 (예제 클릭 시 삽입)
└── 결과 테이블 + 페이지네이션 / 오류 메시지 "CQL 문법을 확인해주세요."
```

## 데이터
- `useSearchIssues(params, enabled)`: `["search-issues", params]`. 검색어가 있을 때만 실행됩니다.
- `useSavedFilters` / `useSaveFilter` / `useDeleteFilter`: `["saved-filters"]`
- `useProjects()`: 프로젝트 필터용
- `useCqlSearch(cql, page, size)`, `useCqlValidate`, `useCqlAutocomplete`: CQL

## 기능 (L4)
### URL 동기화 검색
- 검색 조건 `q`, `status[]`, `priority[]`, `sort`, `page`를 **URL 쿼리스트링**으로 관리합니다(`parseSearchParams` ↔ `buildQueryString`). 새로고침하거나 링크를 공유해도 조건이 유지됩니다.
- 조건을 바꾸면 `router.push`로 URL을 갱신하고, 훅이 다시 조회합니다.
### 저장 필터
- 현재 조건을 이름을 붙여 저장합니다(SaveFilterModal). 목록에서 클릭하면 적용(`applySavedFilter`)하고 삭제할 수도 있습니다.
### CQL 고급 검색
- 입력 중에는 500ms debounce 후 문법을 검증하고 자동완성을 제안합니다. **Ctrl+Enter**를 누르거나 검색 버튼을 누르면 실행됩니다.

## 주의·예외
- `page.tsx`가 567줄로 매우 큽니다. 필터 패널, 결과 테이블, 저장 필터를 `components/search/`로 분리할 대상입니다.
- 페이지가 `lib/api/search`를 직접 import합니다(규칙 예외).
- `gray-*` 팔레트를 씁니다.
